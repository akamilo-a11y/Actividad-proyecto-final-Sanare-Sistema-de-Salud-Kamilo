import { api } from './apiService';
import { Specialty } from '../types';

export const specialtyService = {
  async getAll(): Promise<Specialty[]> {
    return api.get<Specialty[]>('/api/specialties');
  },

  async getById(id: string): Promise<Specialty> {
    return api.get<Specialty>(`/api/specialties/${id}`);
  },

  async create(data: { name: string; description?: string }): Promise<Specialty> {
    return api.post<Specialty>('/api/specialties', data);
  },
};