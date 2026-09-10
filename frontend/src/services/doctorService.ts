import { api } from './apiService';
import { Doctor, CreateDoctorData, Specialty } from '../types';
import { specialtyService } from './specialtyService';

export const doctorService = {
  async getAll(specialtyId?: string): Promise<Doctor[]> {
    const query = specialtyId ? `?specialtyId=${specialtyId}` : '';
    return api.get<Doctor[]>(`/api/doctors${query}`);
  },

  async getById(id: string): Promise<Doctor> {
    return api.get<Doctor>(`/api/doctors/${id}`);
  },

  async create(data: CreateDoctorData): Promise<Doctor> {
    return api.post<Doctor>('/api/doctors', data);
  },

  async update(id: string, data: CreateDoctorData): Promise<Doctor> {
    return api.put<Doctor>(`/api/doctors/${id}`, data);
  },

  async remove(id: string): Promise<void> {
    return api.delete<void>(`/api/doctors/${id}`);
  },

  async generateSlots(id: string): Promise<{ generated: number }> {
    return api.post<{ generated: number }>(`/api/doctors/${id}/slots/generate`);
  },

  getSpecialties: (): Promise<Specialty[]> => specialtyService.getAll(),
};