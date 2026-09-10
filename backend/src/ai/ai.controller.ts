import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { TriageDto } from './dto/triage.dto';

@ApiTags('ai')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('triage')
  @HttpCode(200)
  @ApiOperation({ summary: 'Análisis de síntomas con IA (triaje)' })
  @ApiResponse({ status: 200, description: 'Recomendación de especialidad' })
  @ApiResponse({ status: 503, description: 'IA no disponible o mal configurada' })
  triage(@Body() dto: TriageDto) {
    return this.aiService.triage(dto.symptoms);
  }
}