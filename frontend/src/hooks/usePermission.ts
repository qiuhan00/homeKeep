import { useMemo } from 'react';
import { useAuthStore } from '../stores/auth';
import type { Family, FamilyMember } from '../types';

/**
 * 权限钩子 - 用于检查当前用户在家庭中的权限
 * @param family 家庭对象，如果为null则返回无权限
 * @returns 权限对象，包含 canEdit, canInvite, canRemove
 */
export function usePermission(family: Family | null | undefined) {
  const { user } = useAuthStore();

  return useMemo(() => {
    if (!family || !user) {
      return {
        canEdit: false,
        canInvite: false,
        canRemove: false,
        isOwner: false,
        currentMember: null,
      };
    }

    const currentMember = family.members?.find(m => m.userId === user.id);

    if (!currentMember) {
      return {
        canEdit: false,
        canInvite: false,
        canRemove: false,
        isOwner: false,
        currentMember: null,
      };
    }

    // Owner has all permissions
    if (currentMember.role === 'OWNER') {
      return {
        canEdit: true,
        canInvite: true,
        canRemove: true,
        isOwner: true,
        currentMember,
      };
    }

    // Regular member checks individual permissions
    return {
      canEdit: currentMember.canEditItems ?? false,
      canInvite: currentMember.canInviteMembers ?? false,
      canRemove: currentMember.canRemoveMembers ?? false,
      isOwner: false,
      currentMember,
    };
  }, [family, user]);
}

/**
 * 从家庭成员信息判断是否为所有者
 */
export function isMemberOwner(member: FamilyMember | null | undefined): boolean {
  return member?.role === 'OWNER';
}

/**
 * 判断成员是否有编辑权限
 */
export function hasEditPermission(member: FamilyMember | null | undefined): boolean {
  if (!member) return false;
  if (member.role === 'OWNER') return true;
  return member.canEditItems ?? false;
}

/**
 * 判断成员是否有邀请权限
 */
export function hasInvitePermission(member: FamilyMember | null | undefined): boolean {
  if (!member) return false;
  if (member.role === 'OWNER') return true;
  return member.canInviteMembers ?? false;
}

/**
 * 判断成员是否有移除权限
 */
export function hasRemovePermission(member: FamilyMember | null | undefined): boolean {
  if (!member) return false;
  if (member.role === 'OWNER') return true;
  return member.canRemoveMembers ?? false;
}