import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID('4', { message: 'Doctor inválido' })
  doctorId: string;

  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2, { message: 'Ingrese un nombre válido' })
  patientName: string;

  @ApiProperty({ required: false, example: 'juan@email.com' })
  @IsOptional()
  @IsEmail({}, { message: 'Email del paciente inválido' })
  patientEmail?: string;

  @ApiProperty({ example: '+54 11 1234-5678' })
  @IsString()
  @Matches(/^[\d\s\+\-\(\)]+$/, { message: 'Teléfono del paciente inválido' })
  patientPhone: string;

  @ApiProperty({ example: '2026-09-16T13:00:00.000Z' })
  @IsDateString({}, { message: 'Fecha inválida' })
  date: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}