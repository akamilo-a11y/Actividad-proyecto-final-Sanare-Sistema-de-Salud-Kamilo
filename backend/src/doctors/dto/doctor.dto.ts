import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';

export class CreateDoctorDto {
  @ApiProperty({ example: 'Dra. María Gómez' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'maria.gomez@hospital.com' })
  @IsEmail({}, { message: 'Ingrese un email válido' })
  email: string;

  @ApiProperty({ required: false, example: '+54 11 4444-5555' })
  @IsOptional()
  @IsString()
  @Matches(/^[\d\s\+\-\(\)]+$/, { message: 'Teléfono inválido' })
  phone?: string;

  @ApiProperty({ example: 'Hospital Central' })
  @IsString()
  @IsNotEmpty()
  hospital: string;

  @ApiProperty()
  @IsUUID('4', { message: 'Especialidad inválida' })
  specialtyId: string;
}

export class UpdateDoctorDto extends CreateDoctorDto {};