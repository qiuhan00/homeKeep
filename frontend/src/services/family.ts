import api from './api';
import type { Family, FamilyMember, ApiResponse, MemberPermissions } from '../types';

export const familyApi = {
  create: async (name: string): Promise<Family> => {
    const response = await api.post<ApiResponse<Family>>('/families', { name });
    return response.data.data;
  },

  join: async (inviteCode: string): Promise<Family> => {
    const response = await api.post<ApiResponse<Family>>('/families/join', { inviteCode });
    return response.data.data;
  },

  getAll: async (): Promise<Family[]> => {
    const response = await api.get<ApiResponse<Family[]>>('/families');
    return response.data.data;
  },

  getById: async (familyId: number): Promise<Family> => {
    const response = await api.get<ApiResponse<Family>>(`/families/${familyId}`);
    return response.data.data;
  },

  update: async (familyId: number, name: string): Promise<Family> => {
    const response = await api.put<ApiResponse<Family>>(`/families/${familyId}`, { name });
    return response.data.data;
  },

  delete: async (familyId: number): Promise<void> => {
    await api.delete(`/families/${familyId}`);
  },

  getMemberDetail: async (familyId: number, userId: number): Promise<FamilyMember> => {
    const response = await api.get<ApiResponse<FamilyMember>>(`/families/${familyId}/members/${userId}`);
    return response.data.data;
  },

  updateMemberPermissions: async (
    familyId: number,
    userId: number,
    permissions: MemberPermissions
  ): Promise<FamilyMember> => {
    const response = await api.put<ApiResponse<FamilyMember>>(
      `/families/${familyId}/members/${userId}/permissions`,
      permissions
    );
    return response.data.data;
  },

  removeMember: async (familyId: number, userId: number): Promise<void> => {
    await api.delete(`/families/${familyId}/members/${userId}`);
  },

  leaveFamily: async (familyId: number): Promise<void> => {
    await api.post(`/families/${familyId}/leave`);
  },
};
