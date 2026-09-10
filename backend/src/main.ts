import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const customOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
    : [];

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3002',
    ...customOrigins,
  ];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.onrender.com')) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['', 'health'] });

  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api', (req: any, res: any) => {
    res.json({ status: 'ok', service: 'SaludPublica Connect API' });
  });
  httpAdapter.get('/health', (req: any, res: any) => {
    res.json({ status: 'ok' });
  });
  httpAdapter.get('/api/seed', (req: any, res: any) => {
    const { exec } = require('child_process');
    exec('npm run prisma:seed', (error: any, stdout: any, stderr: any) => {
      if (error) {
        return res.status(500).json({ error: error.message, stderr });
      }
      res.json({ message: 'Seed completado exitosamente', output: stdout });
    });
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('SaludPublica Connect API')
    .setDescription('Sistema de Gestión de Turnos para Centros de Salud Públicos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port, '0.0.0.0');
  logger.log(`API SaludPublica Connect en http://localhost:${port}`);
  logger.log(`Documentación Swagger en http://localhost:${port}/api/docs`);
}

bootstrap();