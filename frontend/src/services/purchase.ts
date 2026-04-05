import api from './api';
import type { ApiResponse } from '../types';

export interface PurchaseItem {
  itemId?: number;
  itemName: string;
  quantity: number;
  price?: number;
}

export interface PurchaseRecord {
  id: number;
  familyId: number;
  purchaserId: number;
  purchaserNickname: string;
  totalAmount: number;
  purchaseDate: string;
  notes?: string;
  items: PurchaseItem[];
}

export interface CreatePurchaseRequest {
  purchaseDate: string;
  notes?: string;
  items: PurchaseItem[];
}

export const purchaseApi = {
  getAll: async (familyId: number): Promise<PurchaseRecord[]> => {
    const response = await api.get<ApiResponse<PurchaseRecord[]>>(`/families/${familyId}/purchases`);
    return response.data.data;
  },

  getById: async (familyId: number, purchaseId: number): Promise<PurchaseRecord> => {
    const response = await api.get<ApiResponse<PurchaseRecord>>(`/families/${familyId}/purchases/${purchaseId}`);
    return response.data.data;
  },

  create: async (familyId: number, data: CreatePurchaseRequest): Promise<PurchaseRecord> => {
    const response = await api.post<ApiResponse<PurchaseRecord>>(`/families/${familyId}/purchases`, data);
    return response.data.data;
  },

  delete: async (familyId: number, purchaseId: number): Promise<void> => {
    await api.delete(`/families/${familyId}/purchases/${purchaseId}`);
  },
};
