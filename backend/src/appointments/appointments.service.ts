import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AppointmentStatus, AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  async findAll(user: AuthenticatedUser, status?: string) {
    const isAdmin = user.role === 'ADMIN';
    const isDoctor = user.role === 'DOCTOR';

    let where: any = {};

    if (isDoctor) {
      const doctor = await this.prisma.doctor.findUnique({
        where: { userId: user.id },
      });
      if (doctor) {
        where.doctorId = doctor.id;
      }
    } else if (!isAdmin) {
      where.userId = user.id;
    }

    if (status) {
      where.status = status as AppointmentStatus;
    }

    return this.prisma.appointment.findMany({
      where,
      include: {
        doctor: {
          include: { specialty: true },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByDate(date: string) {
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }

    const startOfDay = new Date(parsed);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(parsed);
    endOfDay.setHours(23, 59, 59, 999);

    return this.prisma.appointment.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      include: {
        doctor: {
          include: { specialty: true },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        doctor: {
          include: { specialty: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (user.role !== 'ADMIN' && appointment.userId !== user.id) {
      const isDoctorOwner =
        user.role === 'DOCTOR' &&
        (await this.isDoctorForAppointment(user.id, appointment.doctorId));
      if (!isDoctorOwner) {
        throw new NotFoundException('Turno no encontrado');
      }
    }

    return appointment;
  }

  async create(user: AuthenticatedUser, dto: CreateAppointmentDto) {
    const appointmentDate = new Date(dto.date);
    if (isNaN(appointmentDate.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }

    const doctor = await this.prisma.doctor.findUnique({
      where: { id: dto.doctorId },
    });
    if (!doctor) {
      throw new NotFoundException('Doctor no encontrado');
    }

    const appointment = await this.prisma.$transaction(async (tx) => {
      const slot = await tx.availableSlot.findFirst({
        where: {
          doctorId: dto.doctorId,
          startTime: appointmentDate,
          isBooked: false,
        },
      });

      if (!slot) {
        throw new BadRequestException(
          'El horario seleccionado ya no está disponible. Por favor elija otro turno.',
        );
      }

      const cancellationToken = crypto.randomBytes(32).toString('hex');

      const created = await tx.appointment.create({
        data: {
          doctorId: dto.doctorId,
          userId: user.id,
          patientName: dto.patientName,
          patientEmail: dto.patientEmail,
          patientPhone: dto.patientPhone,
          date: appointmentDate,
          notes: dto.notes,
          status: AppointmentStatus.PENDING,
          cancellationToken,
        },
        include: { doctor: { include: { specialty: true } } },
      });

      await tx.availableSlot.update({
        where: { id: slot.id },
        data: { isBooked: true },
      });

      return created;
    });

    await this.notificationsQueue.add(
      'appointment-confirmed',
      {
        appointmentId: appointment.id,
        patientName: appointment.patientName,
        patientEmail: appointment.patientEmail,
        doctorName: doctor.name,
        date: appointmentDate.toISOString(),
        cancellationToken: appointment.cancellationToken,
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return appointment;
  }

  async cancel(id: string, user: AuthenticatedUser) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: { doctor: true },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (user.role !== 'ADMIN' && appointment.userId !== user.id) {
      const isDoctorOwner =
        user.role === 'DOCTOR' &&
        (await this.isDoctorForAppointment(user.id, appointment.doctorId));
      if (!isDoctorOwner) {
        throw new NotFoundException('Turno no encontrado');
      }
    }

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException(`El turno ya fue ${appointment.status.toLowerCase() === 'cancelled' ? 'cancelado' : 'completado'}`);
    }

    const cancelled = await this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });

    await this.prisma.availableSlot.updateMany({
      where: {
        doctorId: appointment.doctorId,
        startTime: appointment.date,
        isBooked: true,
      },
      data: { isBooked: false },
    });

    await this.notificationsQueue.add(
      'appointment-cancelled',
      {
        appointmentId: cancelled.id,
        patientName: cancelled.patientName,
        patientEmail: cancelled.patientEmail,
        doctorName: appointment.doctor.name,
        date: appointment.date.toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return cancelled;
  }

  async stats() {
    const [
      total,
      pending,
      confirmed,
      cancelled,
      completed,
      totalDoctors,
      totalSpecialties,
      totalUsers,
      appointments,
    ] = await Promise.all([
      this.prisma.appointment.count(),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.PENDING } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.CONFIRMED } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.CANCELLED } }),
      this.prisma.appointment.count({ where: { status: AppointmentStatus.COMPLETED } }),
      this.prisma.doctor.count(),
      this.prisma.specialty.count(),
      this.prisma.user.count(),
      this.prisma.appointment.findMany({
        where: { status: { not: AppointmentStatus.CANCELLED } },
        include: { doctor: { include: { specialty: true } } },
      }),
    ]);

    const bySpecialtyMap = new Map<string, number>();
    appointments.forEach((apt) => {
      const name = apt.doctor?.specialty?.name ?? 'Sin especialidad';
      bySpecialtyMap.set(name, (bySpecialtyMap.get(name) || 0) + 1);
    });
    const appointmentsBySpecialty = Array.from(bySpecialtyMap.entries()).map(
      ([name, count]) => ({ name, appointments: count }),
    );

    const now = new Date();
    const byDay: { date: string; appointments: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const next = new Date(day);
      next.setHours(23, 59, 59, 999);

      const count = appointments.filter(
        (apt) => apt.date >= day && apt.date <= next,
      ).length;

      byDay.push({
        date: day.toISOString().slice(0, 10),
        appointments: count,
      });
    }

    return {
      total,
      byStatus: { pending, confirmed, cancelled, completed },
      totalDoctors,
      totalSpecialties,
      totalUsers,
      nextAppointment: appointments.length
        ? appointments
            .filter((apt) => apt.date.getTime() >= now.getTime())
            .sort((a, b) => a.date.getTime() - b.date.getTime())[0] ?? null
        : null,
      appointmentsBySpecialty,
      appointmentsByDay: byDay,
    };
  }

  async findByPublicToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { cancellationToken: token },
      include: {
        doctor: {
          include: { specialty: true },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    return appointment;
  }

  async cancelByPublicToken(token: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { cancellationToken: token },
      include: { doctor: true },
    });

    if (!appointment) {
      throw new NotFoundException('Turno no encontrado');
    }

    if (
      appointment.status === AppointmentStatus.CANCELLED ||
      appointment.status === AppointmentStatus.COMPLETED
    ) {
      throw new BadRequestException('El turno ya no puede cancelarse (estado final).');
    }

    const cancelled = await this.prisma.appointment.update({
      where: { id: appointment.id },
      data: { status: AppointmentStatus.CANCELLED },
    });

    await this.prisma.availableSlot.updateMany({
      where: {
        doctorId: appointment.doctorId,
        startTime: appointment.date,
        isBooked: true,
      },
      data: { isBooked: false },
    });

    await this.notificationsQueue.add(
      'appointment-cancelled',
      {
        appointmentId: cancelled.id,
        patientName: cancelled.patientName,
        patientEmail: cancelled.patientEmail,
        doctorName: appointment.doctor.name,
        date: appointment.date.toISOString(),
      },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return cancelled;
  }

  private async isDoctorForAppointment(userId: string, doctorId: string): Promise<boolean> {
    const doctor = await this.prisma.doctor.findUnique({
      where: { userId },
      select: { id: true },
    });
    return doctor?.id === doctorId;
  }
}