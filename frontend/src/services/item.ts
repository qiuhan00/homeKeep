import api from './api';
import type { Item, Location, ApiResponse } from '../types';

export const itemApi = {
  create: async (familyId: number, data: Partial<Item>): Promise<Item> => {
    const response = await api.post<ApiResponse<Item>>(`/families/${familyId}/items`, data);
    return response.data.data;
  },

  getAll: async (familyId: number): Promise<Item[]> => {
    const response = await api.get<ApiResponse<Item[]>>(`/families/${familyId}/items`);
    return response.data.data;
  },

  getById: async (familyId: number, itemId: number): Promise<Item> => {
    const response = await api.get<ApiResponse<Item>>(`/families/${familyId}/items/${itemId}`);
    return response.data.data;
  },

  update: async (familyId: number, itemId: number, data: Partial<Item>): Promise<Item> => {
    const response = await api.put<ApiResponse<Item>>(`/families/${familyId}/items/${itemId}`, data);
    return response.data.data;
  },

  delete: async (familyId: number, itemId: number): Promise<void> => {
    await api.delete(`/families/${familyId}/items/${itemId}`);
  },

  search: async (familyId: number, keyword: string): Promise<Item[]> => {
    const response = await api.get<ApiResponse<Item[]>>(`/families/${familyId}/items/search`, {
      params: { keyword },
    });
    return response.data.data;
  },

  getLowStock: async (familyId: number): Promise<Item[]> => {
    const response = await api.get<ApiResponse<Item[]>>(`/families/${familyId}/items/low-stock`);
    return response.data.data;
  },

  getUsedUp: async (familyId: number): Promise<Item[]> => {
    const response = await api.get<ApiResponse<Item[]>>(`/families/${familyId}/items/used-up`);
    return response.data.data;
  },

  getExpiring: async (familyId: number): Promise<Item[]> => {
    const response = await api.get<ApiResponse<Item[]>>(`/families/${familyId}/items/expiring`);
    return response.data.data;
  },

  adjustQuantity: async (familyId: number, itemId: number, delta: number): Promise<Item> => {
    const response = await api.post<ApiResponse<Item>>(`/families/${familyId}/items/${itemId}/adjust`, { delta });
    return response.data.data;
  },

  getDashboardStats: async (familyId: number): Promise<any> => {
    const response = await api.get<ApiResponse<any>>(`/families/${familyId}/items/stats/dashboard`);
    return response.data.data;
  },

  restockAll: async (familyId: number): Promise<Item[]> => {
    const response = await api.post<ApiResponse<Item[]>>(`/families/${familyId}/items/restock-all`);
    return response.data.data;
  },
};

export const locationApi = {
  create: async (familyId: number, data: { name: string; parentId?: number }): Promise<Location> => {
    const response = await api.post<ApiResponse<Location>>(`/families/${familyId}/locations`, data);
    return response.data.data;
  },

  getAll: async (familyId: number): Promise<Location[]> => {
    const response = await api.get<ApiResponse<Location[]>>(`/families/${familyId}/locations`);
    return response.data.data;
  },

  getRoot: async (familyId: number): Promise<Location[]> => {
    const response = await api.get<ApiResponse<Location[]>>(`/families/${familyId}/locations/root`);
    return response.data.data;
  },

  getChildren: async (familyId: number, parentId: number): Promise<Location[]> => {
    const response = await api.get<ApiResponse<Location[]>>(`/families/${familyId}/locations/${parentId}/children`);
    return response.data.data;
  },

  delete: async (familyId: number, locationId: number): Promise<void> => {
    await api.delete(`/families/${familyId}/locations/${locationId}`);
  },
};
