import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'paciente@email.com' })
  @IsEmail({}, { message: 'Ingrese un email válido' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(50)
  password: string;

  @ApiProperty({ example: 'Juan' })
  @IsString()
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  firstName: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @Length(2, 50, { message: 'El apellido debe tener entre 2 y 50 caracteres' })
  lastName: string;

  @ApiProperty({ required: false, example: '+54 11 1234-5678' })
  @IsOptional()
  @IsString()
  @Matches(/^[\d\s\+\-\(\)]+$/, { message: 'Teléfono inválido' })
  phone?: string;

  @ApiProperty({ required: false, example: '12345678' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{7,8}$/, { message: 'El DNI debe tener entre 7 y 8 dígitos' })
  dni?: string;
}