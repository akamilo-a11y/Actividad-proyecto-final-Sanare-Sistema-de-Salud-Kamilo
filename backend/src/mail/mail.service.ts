import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

interface MailPayload {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;
  private isEthereal = false;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('EMAIL_HOST');
    const user = this.config.get<string>('EMAIL_USER');
    const pass = this.config.get<string>('EMAIL_PASS');

    const hasRealCredentials =
      host &&
      user &&
      pass &&
      !user.startsWith('tu_') &&
      !user.includes('tu_email') &&
      !pass.startsWith('tu_');

    if (hasRealCredentials) {
      this.transporter = nodemailer.createTransport({
        host,
        port: parseInt(this.config.get('EMAIL_PORT') || '587', 10),
        secure: this.config.get('EMAIL_PORT') === '465',
        auth: { user, pass },
      });
      this.logger.log('Email: transporte SMTP configurado');
    } else {
      this.logger.warn('Email: sin credenciales SMTP reales, usando cuenta Ethereal de prueba');
      this.setupEthereal();
    }
  }

  private async setupEthereal() {
    try {
      const account = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      });
      this.logger.log(`Email: cuenta Ethereal lista (${account.user})`);
    } catch (err) {
      this.logger.error('Email: no se pudo configurar transporte de prueba', err);
      this.transporter = null as any;
    }
    this.isEthereal = true;
  }

  async send(payload: MailPayload) {
    if (!this.transporter) {
      this.logger.warn('Email: transporte no disponible, correo NO enviado');
      return;
    }

    const from = this.config.get<string>('EMAIL_FROM') || 'SaludPublica Connect <noreply@saludpublica.com>';

    try {
      const info = await this.transporter.sendMail({ ...payload, from });
      this.logger.log(`Email enviado a ${payload.to} (${info.messageId})`);
      if (this.isEthereal && info.messageId) {
        this.logger.log(`Vista previa: ${nodemailer.getTestMessageUrl(info)}`);
      }
      return info;
    } catch (err) {
      this.logger.error(`Error enviando email a ${payload.to}`, err);
    }
  }

  sendAppointmentConfirmation(payload: {
    to: string;
    patientName: string;
    doctorName: string;
    date: string;
    cancellationToken: string;
  }) {
    const frontendUrl = this.config.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const baseUrl = process.env.BASE_URL || frontendUrl;

    return this.send({
      to: payload.to,
      subject: 'Turno confirmado - SaludPublica Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #1d4ed8;">Turno Confirmado</h2>
          <p>Hola <strong>${payload.patientName}</strong>,</p>
          <p>Su turno fue registrado correctamente:</p>
          <ul>
            <li><strong>Doctor:</strong> ${payload.doctorName}</li>
            <li><strong>Fecha:</strong> ${new Date(payload.date).toLocaleString('es-AR')}</li>
          </ul>
          <p>Si necesita cancelar, use este enlace (válido hasta la hora del turno):</p>
          <p>
            <a href="${baseUrl}/appointment/${payload.cancellationToken}"
               style="background:#dc2626;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">
              Cancelar turno
            </a>
          </p>
          <p style="color:#6b7280;font-size:12px;">SaludPublica Connect - Sistema de Gestión de Turnos</p>
        </div>
      `,
    });
  }

  sendAppointmentCancelled(payload: {
    to: string;
    patientName: string;
    doctorName: string;
    date: string;
  }) {
    return this.send({
      to: payload.to,
      subject: 'Turno cancelado - SaludPublica Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #dc2626;">Turno Cancelado</h2>
          <p>Hola <strong>${payload.patientName}</strong>,</p>
          <p>Su turno fue cancelado:</p>
          <ul>
            <li><strong>Doctor:</strong> ${payload.doctorName}</li>
            <li><strong>Fecha:</strong> ${new Date(payload.date).toLocaleString('es-AR')}</li>
          </ul>
          <p>Si desea reprogramar, puede reservar un nuevo turno desde la plataforma.</p>
          <p style="color:#6b7280;font-size:12px;">SaludPublica Connect - Sistema de Gestión de Turnos</p>
        </div>
      `,
    });
  }
}