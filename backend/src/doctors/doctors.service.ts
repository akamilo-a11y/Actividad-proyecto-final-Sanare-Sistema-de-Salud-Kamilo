import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDoctorDto, UpdateDoctorDto } from './dto/doctor.dto';
import { AppointmentStatus } from '../common/interfaces/authenticated-user.interface';

@Injectable()
export class DoctorsService {
  constructor(private readonly prisma: PrismaService) {}

  private slotDurationMs = 20 * 60 * 1000;

  async findAll(specialtyId?: string) {
    return this.prisma.doctor.findMany({
      where: specialtyId ? { specialtyId } : undefined,
      orderBy: { name: 'asc' },
      include: {
        specialty: true,
        _count: { select: { appointments: true } },
      },
    });
  }

  async findOne(id: string) {
    const now = new Date();

    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        specialty: true,
        availableSlots: {
          where: {
            isBooked: false,
            startTime: { gte: now },
          },
          orderBy: { startTime: 'asc' },
        },
        _count: { select: { appointments: true } },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    return doctor;
  }

  async create(dto: CreateDoctorDto) {
    const specialty = await this.prisma.specialty.findUnique({
      where: { id: dto.specialtyId },
    });
    if (!specialty) {
      throw new BadRequestException('La especialidad seleccionada no existe');
    }

    const existing = await this.prisma.doctor.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Ya existe un doctor registrado con ese email');
    }

    const doctor = await this.prisma.doctor.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        hospital: dto.hospital,
        specialtyId: dto.specialtyId,
      },
      include: { specialty: true },
    });

    await this.generateSlots(doctor.id);

    return this.findOne(doctor.id);
  }

  async update(id: string, dto: UpdateDoctorDto) {
    const existing = await this.prisma.doctor.findUnique({
      where: { id },
      include: { specialty: true },
    });
    if (!existing) {
      throw new NotFoundException('Doctor no encontrado');
    }

    return this.prisma.doctor.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        hospital: dto.hospital,
        specialtyId: dto.specialtyId,
      },
      include: { specialty: true },
    });
  }

  async remove(id: string) {
    const doctor = await this.prisma.doctor.findUnique({
      where: { id },
      include: {
        _count: { select: { appointments: true } },
      },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const activeAppointments = await this.prisma.appointment.count({
      where: {
        doctorId: id,
        status: {
          in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED],
        },
      },
    });

    if (activeAppointments > 0) {
      throw new BadRequestException(
        `No se puede eliminar: el doctor tiene ${activeAppointments} turno(s) activo(s)`,
      );
    }

    await this.prisma.doctor.delete({ where: { id } });
    return { success: true };
  }

  async generateSlots(doctorId: string) {
    const doctor = await this.prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const now = new Date();
    const startHour = 8;
    const endHour = 14;
    const daysAhead = 7;

    const slots: { doctorId: string; startTime: Date; endTime: Date; durationMinutes: number }[] = [];

    for (let day = 0; day < daysAhead; day++) {
      const date = new Date(now);
      date.setDate(now.getDate() + day);
      date.setHours(0, 0, 0, 0);

      for (let hour = startHour; hour < endHour; hour++) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);

        if (startTime.getTime() < now.getTime()) {
          continue;
        }

        const endTime = new Date(startTime.getTime() + this.slotDurationMs);

        slots.push({
          doctorId,
          startTime,
          endTime,
          durationMinutes: 20,
        });
      }
    }

    const existingSlots = await this.prisma.availableSlot.findMany({
      where: {
        doctorId,
        startTime: { gte: now },
      },
      select: { startTime: true },
    });
    const existingTimes = new Set(existingSlots.map((s) => s.startTime.getTime()));
    const newSlots = slots.filter((s) => !existingTimes.has(s.startTime.getTime()));

    if (newSlots.length > 0) {
      await this.prisma.availableSlot.createMany({
        data: newSlots,
        skipDuplicates: true,
      });
    }

    return { generated: newSlots.length };
  }
}