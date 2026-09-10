import { api, setToken } from './apiService';
import { AuthResponse, LoginData, RegisterData, User } from '../types/auth';

export const authService = {
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    setToken(response.accessToken);
    return response;
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/register', data);
    setToken(response.accessToken);
    return response;
  },

  async getProfile(): Promise<User> {
    return api.get<User>('/api/auth/profile');
  },
};