export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Specialty {
  id: string;
  name: string;
  description?: string | null;
  createdAt?: string;
  doctors?: Doctor[];
  _count?: { doctors: number };
}

export interface Slot {
  id: string;
  doctorId: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  durationMinutes: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialtyId: string;
  specialty?: Specialty;
  hospital: string;
  email: string;
  phone?: string | null;
  availableSlots?: Slot[];
  _count?: { appointments: number };
}

export interface CreateDoctorData {
  name: string;
  email: string;
  phone?: string;
  hospital: string;
  specialtyId: string;
}

export interface Appointment {
  id: string;
  doctorId: string;
  userId: string;
  patientName: string;
  patientEmail?: string | null;
  patientPhone: string;
  date: string;
  notes?: string | null;
  status: AppointmentStatus;
  cancellationToken?: string | null;
  createdAt: string;
  updatedAt: string;
  doctor?: Doctor;
}

export interface CreateAppointmentData {
  doctorId: string;
  patientName: string;
  patientEmail?: string;
  patientPhone: string;
  date: string;
  notes?: string;
}

export interface TriageResult {
  recommendedSpecialty: string;
  urgency: 'Baja' | 'Media' | 'Alta';
  reasoning: string;
}

export interface StatsResponse {
  total: number;
  byStatus: {
    pending: number;
    confirmed: number;
    cancelled: number;
    completed: number;
  };
  totalDoctors: number;
  totalSpecialties: number;
  totalUsers: number;
  nextAppointment: Appointment | null;
  appointmentsBySpecialty: { name: string; appointments: number }[];
  appointmentsByDay: { date: string; appointments: number }[];
}