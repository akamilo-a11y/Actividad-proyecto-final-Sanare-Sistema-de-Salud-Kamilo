import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class TriageDto {
  @ApiProperty({ example: 'Tengo dolor de pecho y falta de aire hace dos días' })
  @IsString()
  @IsNotEmpty({ message: 'Describa sus síntomas' })
  @MinLength(3, { message: 'Describa sus síntomas con más detalle' })
  symptoms: string;
}