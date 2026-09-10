import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Estado del servicio' })
  getStatus() {
    return this.appService.getStatus();
  }

  @Get('api')
  @ApiOperation({ summary: 'Estado de la API' })
  getApiStatus() {
    return this.appService.getStatus();
  }

  @Get('health')
  @ApiOperation({ summary: 'Healthcheck para Render' })
  getHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}