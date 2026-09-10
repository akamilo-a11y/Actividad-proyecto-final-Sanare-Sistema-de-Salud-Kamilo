import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { AppointmentsController, AppointmentsPublicController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MailModule,
    BullModule.registerQueue({ name: 'notifications' }),
  ],
  controllers: [AppointmentsController, AppointmentsPublicController],
  providers: [AppointmentsService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}