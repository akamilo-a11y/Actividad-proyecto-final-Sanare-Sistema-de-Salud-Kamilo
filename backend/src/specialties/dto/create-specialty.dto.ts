import { ApiProperty } from '@nestjs/swagger';

export class CreateSpecialtyDto {
  @ApiProperty({ example: 'Cardiología' })
  name: string;

  @ApiProperty({ required: false, example: 'Atención del corazón y sistema circulatorio' })
  description?: string;
}