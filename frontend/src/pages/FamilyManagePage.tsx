import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../services/family';
import { useAuthStore } from '../stores/auth';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import type { Family, FamilyMember, MemberPermissions } from '../types';

export default function FamilyManagePage() {
  const queryClient = useQueryClient();
  const { currentFamilyId, setCurrentFamilyId, user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState<Family | null>(null);
  const [viewingMember, setViewingMember] = useState<FamilyMember | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<FamilyMember | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Confirmation modals
  const [confirmDelete, setConfirmDelete] = useState<{ family: Family } | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<{ member: FamilyMember } | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const { data: families = [], isLoading } = useQuery({
    queryKey: ['families'],
    queryFn: familyApi.getAll,
  });

  // 当前家庭的权限
  const currentFamily = families.find(f => f.id === currentFamilyId);

  const createMutation = useMutation({
    mutationFn: (name: string) => familyApi.create(name),
    onSuccess: (family) => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      setCurrentFamilyId(family.id);
      setShowCreateModal(false);
      setFamilyName('');
    },
  });

  const joinMutation = useMutation({
    mutationFn: (code: string) => familyApi.join(code),
    onSuccess: (family) => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      setCurrentFamilyId(family.id);
      setShowJoinModal(false);
      setInviteCode('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ familyId, name }: { familyId: number; name: string }) =>
      familyApi.update(familyId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      setEditingFamily(null);
      setFamilyName('');
    },
  });

  const deleteFamilyMutation = useMutation({
    mutationFn: (familyId: number) => familyApi.delete(familyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      setConfirmDelete(null);
      if (families.length > 1) {
        const nextFamily = families.find(f => f.id !== confirmDelete?.family.id);
        if (nextFamily) setCurrentFamilyId(nextFamily.id);
      }
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ familyId, userId }: { familyId: number; userId: number }) =>
      familyApi.removeMember(familyId, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      setConfirmRemove(null);
      setViewingMember(null);
    },
  });

  const leaveFamilyMutation = useMutation({
    mutationFn: (familyId: number) => familyApi.leaveFamily(familyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      setConfirmLeave(false);
      setViewingMember(null);
    },
  });

  const updatePermissionsMutation = useMutation({
    mutationFn: ({ familyId, userId, permissions }: { familyId: number; userId: number; permissions: MemberPermissions }) =>
      familyApi.updateMemberPermissions(familyId, userId, permissions),
    onSuccess: (updatedMember) => {
      queryClient.invalidateQueries({ queryKey: ['families'] });
      setEditingPermissions(null);
      setViewingMember(updatedMember);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (familyName.trim()) {
      createMutation.mutate(familyName.trim());
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteCode.trim()) {
      joinMutation.mutate(inviteCode.trim());
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingFamily && familyName.trim()) {
      updateMutation.mutate({ familyId: editingFamily.id, name: familyName.trim() });
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const isOwner = currentFamily?.members?.some(m => m.role === 'OWNER' && m.userId === user?.id) ?? false;
  const currentMember = currentFamily?.members?.find(m => m.userId === user?.id);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">家庭管理</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowJoinModal(true)}
            className="btn-secondary text-xs sm:text-sm"
          >
            加入
          </button>
          <button
            onClick={() => {
              setFamilyName('');
              setShowCreateModal(true);
            }}
            className="btn-primary text-xs sm:text-sm"
          >
            创建
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3 sm:space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="bg-gray-200 h-20 sm:h-24 rounded" />
            </div>
          ))}
        </div>
      ) : families.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg-warm)' }}>
            <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-tertiary)" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
              <path d="M9 22V12h6v10"/>
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>还没有加入任何家庭</h3>
          <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>创建新家庭或使用邀请码加入已有家庭</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => {
                setFamilyName('');
                setShowCreateModal(true);
              }}
              className="btn-primary px-6 py-3"
            >
              创建家庭
            </button>
            <button
              onClick={() => {
                setInviteCode('');
                setShowJoinModal(true);
              }}
              className="btn-ghost px-6 py-3"
            >
              加入已有
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              isActive={currentFamilyId === family.id}
              onSelect={() => setCurrentFamilyId(family.id)}
              onCopyCode={() => copyInviteCode(family.inviteCode)}
              onEdit={() => {
                setEditingFamily(family);
                setFamilyName(family.name);
              }}
              onViewMember={setViewingMember}
              onDelete={() => setConfirmDelete({ family })}
              currentUserId={user?.id}
            />
          ))}
        </div>
      )}

      {showCreateModal && (
        <Modal title="创建家庭" onClose={() => setShowCreateModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="label">家庭名称</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="input"
                placeholder="例如：我家"
                required
              />
            </div>
            {createMutation.error && (
              <p className="text-red-500 text-sm">
                {(createMutation.error as any).response?.data?.message || '创建失败'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showJoinModal && (
        <Modal title="加入家庭" onClose={() => setShowJoinModal(false)}>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="label">邀请码</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="input"
                placeholder="请输入6位邀请码"
                maxLength={6}
                required
              />
            </div>
            {joinMutation.error && (
              <p className="text-red-500 text-sm">
                {(joinMutation.error as any).response?.data?.message || '加入失败'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowJoinModal(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={joinMutation.isPending}
              >
                {joinMutation.isPending ? '加入中...' : '加入'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editingFamily && (
        <Modal title="编辑家庭" onClose={() => setEditingFamily(null)}>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="label">家庭名称</label>
              <input
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="input"
                placeholder="家庭名称"
                required
              />
            </div>
            {updateMutation.error && (
              <p className="text-red-500 text-sm">
                {(updateMutation.error as any).response?.data?.message || '更新失败'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingFamily(null)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
            {editingFamily.members?.some(m => m.role === 'OWNER' && m.userId === user?.id) && (
              <button
                type="button"
                onClick={() => setConfirmDelete({ family: editingFamily })}
                className="w-full btn-danger mt-2"
                disabled={deleteFamilyMutation.isPending}
              >
                删除家庭
              </button>
            )}
          </form>
        </Modal>
      )}

      {viewingMember && (
        <MemberDetailModal
          member={viewingMember}
          isOwner={isOwner}
          canRemoveMembers={currentMember?.canRemoveMembers || false}
          onClose={() => setViewingMember(null)}
          onEditPermissions={() => {
            setEditingPermissions(viewingMember);
          }}
          onRemove={() => setConfirmRemove({ member: viewingMember })}
          onLeave={() => setConfirmLeave(true)}
        />
      )}

      {editingPermissions && (
        <Modal title="编辑权限" onClose={() => setEditingPermissions(null)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              updatePermissionsMutation.mutate({
                familyId: currentFamilyId!,
                userId: editingPermissions.userId,
                permissions: {
                  canEditItems: editingPermissions.canEditItems,
                  canInviteMembers: editingPermissions.canInviteMembers,
                  canRemoveMembers: editingPermissions.canRemoveMembers,
                },
              });
            }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm">物品编辑权限</span>
              <input
                type="checkbox"
                checked={editingPermissions.canEditItems}
                onChange={(e) =>
                  setEditingPermissions({ ...editingPermissions, canEditItems: e.target.checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">邀请成员权限</span>
              <input
                type="checkbox"
                checked={editingPermissions.canInviteMembers}
                onChange={(e) =>
                  setEditingPermissions({ ...editingPermissions, canInviteMembers: e.target.checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">移除成员权限</span>
              <input
                type="checkbox"
                checked={editingPermissions.canRemoveMembers}
                onChange={(e) =>
                  setEditingPermissions({ ...editingPermissions, canRemoveMembers: e.target.checked })
                }
              />
            </div>
            {updatePermissionsMutation.error && (
              <p className="text-red-500 text-sm">
                {(updatePermissionsMutation.error as any).response?.data?.message || '更新失败'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingPermissions(null)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={updatePermissionsMutation.isPending}
              >
                {updatePermissionsMutation.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirmation: Delete Family */}
      {confirmDelete && (
        <ConfirmModal
          isOpen={true}
          title="删除家庭"
          message={`确定要删除"${confirmDelete.family.name}"吗？此操作不可撤销。`}
          confirmText="删除"
          onConfirm={() => deleteFamilyMutation.mutate(confirmDelete.family.id)}
          onCancel={() => setConfirmDelete(null)}
          danger
        />
      )}

      {/* Confirmation: Remove Member */}
      {confirmRemove && (
        <ConfirmModal
          isOpen={true}
          title="移除成员"
          message={`确定要移除成员"${confirmRemove.member.nickname}"吗？`}
          confirmText="移除"
          onConfirm={() => removeMemberMutation.mutate({ familyId: currentFamilyId!, userId: confirmRemove.member.userId })}
          onCancel={() => setConfirmRemove(null)}
          danger
        />
      )}

      {/* Confirmation: Leave Family */}
      {confirmLeave && (
        <ConfirmModal
          isOpen={true}
          title="退出家庭"
          message="确定要退出该家庭吗？"
          confirmText="退出"
          onConfirm={() => leaveFamilyMutation.mutate(currentFamilyId!)}
          onCancel={() => setConfirmLeave(false)}
          danger
        />
      )}
    </div>
  );
}

function FamilyCard({
  family,
  isActive,
  onSelect,
  onCopyCode,
  onEdit,
  onViewMember,
  onDelete,
  currentUserId,
}: {
  family: Family;
  isActive: boolean;
  onSelect: () => void;
  onCopyCode: () => void;
  onEdit: () => void;
  onViewMember: (member: FamilyMember) => void;
  onDelete: () => void;
  currentUserId?: number;
}) {
  const isOwner = family.members?.some(m => m.role === 'OWNER' && m.userId === currentUserId);

  return (
    <div
      className={`card cursor-pointer transition-all relative ${
        isActive ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3 pr-16">
        <h3 className="font-bold text-sm sm:text-base lg:text-lg">{family.name}</h3>
        <div className="flex items-center gap-1 sm:gap-2 absolute top-3 right-3">
          {isActive && (
            <span className="text-xs bg-primary text-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
              当前
            </span>
          )}
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="p-1 hover:bg-gray-100 rounded text-sm"
              title="编辑家庭"
            >
              ✏️
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-2 sm:mb-3">
        <span>{family.members?.length || 0} 位成员</span>
        <div className="flex items-center gap-1 sm:gap-2">
          <span className="hidden sm:inline">邀请码：</span>{family.inviteCode}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCopyCode();
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title="复制邀请码"
          >
            📋
          </button>
        </div>
      </div>

      {family.members && family.members.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {family.members.map((member) => (
            <button
              key={member.userId}
              onClick={(e) => {
                e.stopPropagation();
                onViewMember(member);
              }}
              className="flex items-center gap-1 text-sm bg-gray-50 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
            >
              <span>{member.nickname || '用户'}</span>
              {member.role === 'OWNER' && (
                <span className="text-xs text-primary">👑</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Delete button at bottom right */}
      {isOwner && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute bottom-3 right-3 text-gray-400 hover:text-red-500 transition-colors text-xs sm:text-sm"
          title="删除家庭"
        >
          🗑️ 删除
        </button>
      )}
    </div>
  );
}

function MemberDetailModal({
  member,
  isOwner,
  canRemoveMembers,
  onClose,
  onEditPermissions,
  onRemove,
  onLeave,
}: {
  member: FamilyMember;
  isOwner: boolean;
  canRemoveMembers: boolean;
  onClose: () => void;
  onEditPermissions: () => void;
  onRemove: () => void;
  onLeave: () => void;
}) {
  return (
    <Modal title="成员详情" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary font-medium text-lg">
            {member.nickname?.charAt(0) || '用户'}
          </div>
          <div>
            <p className="font-medium">{member.nickname || '用户'}</p>
            <p className="text-sm text-gray-500">
              {member.role === 'OWNER' ? '👑 所有者' : '成员'}
            </p>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          <p>加入时间：{new Date(member.joinedAt).toLocaleDateString()}</p>
        </div>

        {member.role !== 'OWNER' && (
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">权限</p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span>物品编辑</span>
                <span className={member.canEditItems ? 'text-green-600' : 'text-gray-400'}>
                  {member.canEditItems ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>邀请成员</span>
                <span className={member.canInviteMembers ? 'text-green-600' : 'text-gray-400'}>
                  {member.canInviteMembers ? '✓' : '✗'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>移除成员</span>
                <span className={member.canRemoveMembers ? 'text-green-600' : 'text-gray-400'}>
                  {member.canRemoveMembers ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t">
          {isOwner && member.role !== 'OWNER' && (
            <>
              <button onClick={onEditPermissions} className="btn-primary flex-1">
                设置权限
              </button>
              <button onClick={onRemove} className="btn-secondary flex-1">
                移除
              </button>
            </>
          )}
          {!isOwner && member.role !== 'OWNER' && canRemoveMembers && (
            <>
              <button onClick={onEditPermissions} className="btn-primary flex-1">
                设置权限
              </button>
              <button onClick={onRemove} className="btn-secondary flex-1">
                移除
              </button>
            </>
          )}
          {!isOwner && member.role !== 'OWNER' && !canRemoveMembers && (
            <button onClick={onLeave} className="btn-secondary w-full">
              退出家庭
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}