import { PrismaClient, UserRole, AppointmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SPECIALTIES = [
  { name: 'Medicina General', description: 'Atención primaria y problemas de salud generales' },
  { name: 'Cardiología', description: 'Diagnóstico y tratamiento de enfermedades del corazón' },
  { name: 'Pediatría', description: 'Salud y desarrollo de niños y adolescentes' },
  { name: 'Dermatología', description: 'Enfermedades de la piel, cabello y uñas' },
  { name: 'Traumatología', description: 'Lesiones del sistema musculoesquelético' },
];

const DOCTORS = [
  { name: 'Dra. Laura Fernández', email: 'laura.fernandez@hospital.com', phone: '+54 11 4444-1001', hospital: 'Hospital Central', specialty: 'Medicina General' },
  { name: 'Dr. Carlos Medina', email: 'carlos.medina@hospital.com', phone: '+54 11 4444-1002', hospital: 'Hospital Central', specialty: 'Cardiología' },
  { name: 'Dra. Sofía Rivas', email: 'sofia.rivas@hospital.com', phone: '+54 11 4444-1003', hospital: 'Hospital del Niño', specialty: 'Pediatría' },
  { name: 'Dr. Martín Acosta', email: 'martin.acosta@hospital.com', phone: '+54 11 4444-1004', hospital: 'Hospital Central', specialty: 'Traumatología' },
];

const DAYS_AHEAD = 7;
const START_HOUR = 8;
const END_HOUR = 14;
const DURATION_MINUTES = 20;

async function main() {
  console.log('🌱 Iniciando seed de SaludPública Connect...');

  const passwordHash = await bcrypt.hash('123456', 10);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@saludpublica.com' },
      update: {},
      create: {
        email: 'admin@saludpublica.com',
        password: passwordHash,
        firstName: 'Admin',
        lastName: 'Sistema',
        phone: '+54 11 0000-0000',
        dni: '12345678',
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: 'paciente1@email.com' },
      update: {},
      create: {
        email: 'paciente1@email.com',
        password: passwordHash,
        firstName: 'Juan',
        lastName: 'Paciente',
        phone: '+54 11 1111-1111',
        dni: '23456789',
        role: UserRole.PATIENT,
      },
    }),
    prisma.user.upsert({
      where: { email: 'paciente2@email.com' },
      update: {},
      create: {
        email: 'paciente2@email.com',
        password: passwordHash,
        firstName: 'María',
        lastName: 'García',
        phone: '+54 11 2222-2222',
        dni: '34567890',
        role: UserRole.PATIENT,
      },
    }),
    prisma.user.upsert({
      where: { email: 'doctor1@email.com' },
      update: {},
      create: {
        email: 'doctor1@email.com',
        password: passwordHash,
        firstName: 'Carlos',
        lastName: 'Médico',
        phone: '+54 11 3333-3333',
        role: UserRole.DOCTOR,
      },
    }),
  ]);
  console.log(`✅ ${users.length} usuarios creados`);

  const specialties: { id: string; name: string }[] = [];
  for (const spec of SPECIALTIES) {
    const created = await prisma.specialty.upsert({
      where: { name: spec.name },
      update: { description: spec.description },
      create: spec,
    });
    specialties.push({ id: created.id, name: created.name });
  }
  console.log(`✅ ${specialties.length} especialidades creadas`);

  const specialtyIdByName = new Map(specialties.map((s) => [s.name, s.id]));

  const doctorIds: { id: string; name: string }[] = [];
  for (const doc of DOCTORS) {
    const created = await prisma.doctor.upsert({
      where: { email: doc.email },
      update: {
        name: doc.name,
        phone: doc.phone,
        hospital: doc.hospital,
        specialtyId: specialtyIdByName.get(doc.specialty)!,
      },
      create: {
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        hospital: doc.hospital,
        specialtyId: specialtyIdByName.get(doc.specialty)!,
      },
    });
    doctorIds.push({ id: created.id, name: created.name });
  }
  console.log(`✅ ${doctorIds.length} doctores creados`);

  // Vincular el usuario con rol DOCTOR a un registro de Doctor real
  const doctorUser = users.find((u) => u.email === 'doctor1@email.com');
  const linkedDoctor = doctorIds.find((d) => d.name === 'Dr. Carlos Medina');
  if (doctorUser && linkedDoctor) {
    await prisma.user.update({
      where: { id: doctorUser.id },
      data: { doctor: { connect: { id: linkedDoctor.id } } },
    });
    console.log(`✅ Usuario DOCTOR ${doctorUser.email} vinculado a ${linkedDoctor.name}`);
  }

  const now = new Date();
  let slotCount = 0;

  for (const doctor of doctorIds) {
    const slots: {
      doctorId: string;
      startTime: Date;
      endTime: Date;
      isBooked: boolean;
      durationMinutes: number;
    }[] = [];

    for (let day = 0; day < DAYS_AHEAD; day++) {
      const date = new Date(now);
      date.setDate(now.getDate() + day);
      date.setHours(0, 0, 0, 0);

      for (let hour = START_HOUR; hour < END_HOUR; hour++) {
        const startTime = new Date(date);
        startTime.setHours(hour, 0, 0, 0);

        if (startTime.getTime() <= now.getTime()) {
          continue;
        }

        const endTime = new Date(startTime.getTime() + DURATION_MINUTES * 60 * 1000);

        slots.push({
          doctorId: doctor.id,
          startTime,
          endTime,
          isBooked: false,
          durationMinutes: DURATION_MINUTES,
        });
      }
    }

    if (slots.length > 0) {
      const result = await prisma.availableSlot.createMany({
        data: slots,
        skipDuplicates: true,
      });
      slotCount += result.count;
    }
  }
  console.log(`✅ ${slotCount} horarios disponibles generados`);

  console.log('🎉 Seed completado');
  console.log('   Admin    : admin@saludpublica.com / 123456');
  console.log('   Paciente : paciente1@email.com / 123456');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });