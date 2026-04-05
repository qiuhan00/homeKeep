import api from './api';
import type { ApiResponse } from '../types';

export interface ConsumptionTrend {
  itemId: number;
  itemName: string;
  currentQuantity: number;
  minQuantity: number;
  avgDailyConsumption: number;
  daysUntilRestock: number | null;
  predictedRestockDate: string | null;
  recentConsumption: { date: string; consumption: number }[];
}

export interface LocationDistribution {
  locationId: number | null;
  locationName: string;
  locationPath: string;
  itemCount: number;
  percent: number;
  items: { id: number; name: string; quantity: number }[];
}

export const trendApi = {
  getTrends: async (familyId: number): Promise<ConsumptionTrend[]> => {
    const response = await api.get<ApiResponse<ConsumptionTrend[]>>(`/families/${familyId}/trends`);
    return response.data.data;
  },

  getItemTrend: async (familyId: number, itemId: number): Promise<ConsumptionTrend> => {
    const response = await api.get<ApiResponse<ConsumptionTrend>>(`/families/${familyId}/trends/items/${itemId}`);
    return response.data.data;
  },

  getDistribution: async (familyId: number): Promise<LocationDistribution[]> => {
    const response = await api.get<ApiResponse<LocationDistribution[]>>(`/families/${familyId}/distribution`);
    return response.data.data;
  },
};
