import api from './api';
import type { AuthResponse, ApiResponse } from '../types';

export const authApi = {
  login: async (phone: string, password: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', { phone, password });
    return response.data.data;
  },

  register: async (phone: string, password: string, nickname?: string): Promise<AuthResponse> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', { phone, password, nickname });
    return response.data.data;
  },
};
