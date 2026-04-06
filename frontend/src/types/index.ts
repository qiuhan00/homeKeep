export interface User {
  id: number;
  phone: string;
  nickname: string;
  avatarUrl?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Family {
  id: number;
  name: string;
  inviteCode: string;
  members: FamilyMember[];
  createdAt: string;
}

export interface FamilyMember {
  userId: number;
  nickname: string;
  avatarUrl?: string;
  role: 'OWNER' | 'MEMBER';
  joinedAt: string;
  canEditItems: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
}

export interface MemberPermissions {
  canEditItems: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
}

export interface Location {
  id: number;
  familyId?: number | null;  // null 表示系统默认位置
  name: string;
  parentId?: number;
  path: string;
  isSystem?: boolean;  // 是否为系统默认位置
  children?: Location[];
}

export interface Category {
  id: number;
  familyId?: number | null;  // null 表示系统默认分类
  name: string;
  parentId?: number;
  path: string;
  sortOrder?: number;
  isSystem?: boolean;  // 是否为系统默认分类
}

export interface Item {
  id: number;
  familyId: number;
  creatorId: number;
  creatorNickname: string;
  name: string;
  description?: string;
  quantity: number;
  minQuantity: number;
  locationId?: number;
  locationPath?: string;
  category?: string;
  tags?: string;
  coverImageUrl?: string;
  customFields?: string;
  expiryDate?: string;
  expiryDays?: number;
  isAlert: boolean;
  isDeleted?: boolean;
  usedUp?: boolean;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface DashboardStats {
  totalItems: number;
  lowStockCount: number;
  lowStockPercent: number;
  usedUpCount: number;
  expiringCount: number;
  totalQuantity: number;
}

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
