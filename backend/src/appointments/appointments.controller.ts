import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/interfaces/authenticated-user.interface';
import { UserRequest } from '../common/interfaces/user-request.interface';

@ApiTags('appointments')
@Controller()
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar turnos (el paciente ve los suyos; admin todos)' })
  findAll(@Req() req: UserRequest, @Query('status') status?: string) {
    return this.appointmentsService.findAll(req.user!, status);
  }

  @Get('appointments/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Estadísticas para el panel del admin' })
  stats() {
    return this.appointmentsService.stats();
  }

  @Get('appointments/date')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Turnos de una fecha (admin)' })
  findByDate(@Query('date') date: string) {
    return this.appointmentsService.findByDate(date);
  }

  @Get('appointments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Detalle de un turno' })
  findOne(@Req() req: UserRequest, @Param('id') id: string) {
    return this.appointmentsService.findOne(id, req.user!);
  }

  @Post('appointments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear un turno (evita doble reserva con transacción atómica)' })
  create(@Req() req: UserRequest, @Body() dto: CreateAppointmentDto) {
    return this.appointmentsService.create(req.user!, dto);
  }

  @Delete('appointments/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancelar un turno (propietario o admin)' })
  cancel(@Req() req: UserRequest, @Param('id') id: string) {
    return this.appointmentsService.cancel(id, req.user!);
  }
}

@ApiTags('appointments-public')
@Controller('appointments-public')
export class AppointmentsPublicController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Get('token/:token')
  @ApiOperation({ summary: 'Consulta pública de un turno mediante token de cancelación' })
  findByToken(@Param('token') token: string) {
    return this.appointmentsService.findByPublicToken(token);
  }

  @Post('cancel/:token')
  @ApiOperation({ summary: 'Cancelación pública de un turno mediante token' })
  cancelByToken(@Param('token') token: string) {
    return this.appointmentsService.cancelByPublicToken(token);
  }
}