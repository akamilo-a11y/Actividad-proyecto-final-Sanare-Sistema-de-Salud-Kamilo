import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus() {
    return {
      status: 'online',
      service: 'SaludPublica Connect API',
      time: new Date().toISOString(),
      endpoints: {
        api: '/api',
        swagger: '/api/docs',
      },
    };
  }
}