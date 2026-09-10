import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSpecialtyDto } from './dto/create-specialty.dto';

@Injectable()
export class SpecialtiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.specialty.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { doctors: true } },
      },
    });
  }

  async findOne(id: string) {
    const now = new Date();

    const specialty = await this.prisma.specialty.findUnique({
      where: { id },
      include: {
        doctors: {
          include: {
            availableSlots: {
              where: {
                isBooked: false,
                startTime: { gte: now },
              },
              orderBy: { startTime: 'asc' },
            },
          },
        },
      },
    });

    if (!specialty) {
      throw new NotFoundException('Especialidad no encontrada');
    }

    return specialty;
  }

  async create(dto: CreateSpecialtyDto) {
    return this.prisma.specialty.create({
      data: {
        name: dto.name,
        description: dto.description,
      },
    });
  }
}