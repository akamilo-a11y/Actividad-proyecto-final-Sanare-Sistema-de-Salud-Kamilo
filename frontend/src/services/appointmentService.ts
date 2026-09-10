import { api } from './apiService';
import { Appointment, CreateAppointmentData, StatsResponse } from '../types';

export const appointmentService = {
  async getAll(status?: string): Promise<Appointment[]> {
    const query = status ? `?status=${status}` : '';
    return api.get<Appointment[]>(`/api/appointments${query}`);
  },

  async getById(id: string): Promise<Appointment> {
    return api.get<Appointment>(`/api/appointments/${id}`);
  },

  async getByDate(date: Date): Promise<Appointment[]> {
    const iso = date.toISOString().slice(0, 10);
    return api.get<Appointment[]>(`/api/appointments/date?date=${iso}`);
  },

  async getStats(): Promise<StatsResponse> {
    return api.get<StatsResponse>('/api/appointments/stats');
  },

  async create(data: CreateAppointmentData): Promise<Appointment> {
    return api.post<Appointment>('/api/appointments', data);
  },

  async cancel(id: string): Promise<Appointment> {
    return api.delete<Appointment>(`/api/appointments/${id}`);
  },

  async getByToken(token: string): Promise<Appointment> {
    return api.get<Appointment>(`/api/appointments-public/token/${token}`);
  },

  async cancelByToken(token: string): Promise<Appointment> {
    return api.post<Appointment>(`/api/appointments-public/cancel/${token}`);
  },
};