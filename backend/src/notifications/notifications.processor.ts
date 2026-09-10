import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { MailService } from '../mail/mail.service';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('appointment-confirmed')
  async handleAppointmentConfirmed(job: Job) {
    this.logger.log(`Procesando turno confirmado #${job.id}`);
    const data = job.data;

    this.logger.log(
      `📅 Turno confirmado para ${data.patientName} con ${data.doctorName} el ${new Date(data.date).toLocaleString('es-AR')}`,
    );

    if (data.patientEmail) {
      await this.mailService.sendAppointmentConfirmation({
        to: data.patientEmail,
        patientName: data.patientName,
        doctorName: data.doctorName,
        date: data.date,
        cancellationToken: data.cancellationToken,
      });
    } else {
      this.logger.warn(`Sin email para ${data.patientName}, no se envió notificación`);
    }
  }

  @Process('slot-available')
  async handleSlotAvailable(job: Job) {
    const data = job.data;
    this.logger.log(
      `👨‍⚕️ Horario liberado: ${data.doctorName} - ${new Date(data.startTime).toLocaleString('es-AR')}`,
    );
  }

  @Process('appointment-cancelled')
  async handleAppointmentCancelled(job: Job) {
    this.logger.log(`Procesando turno cancelado #${job.id}`);
    const data = job.data;

    this.logger.log(
      `❌ Turno cancelado para ${data.patientName} con ${data.doctorName}`,
    );

    if (data.patientEmail) {
      await this.mailService.sendAppointmentCancelled({
        to: data.patientEmail,
        patientName: data.patientName,
        doctorName: data.doctorName,
        date: data.date,
      });
    }
  }
}