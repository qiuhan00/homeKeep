import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../stores/auth';
import { itemApi } from '../services/item';
import Modal from './Modal';

export default function FloatingActionButton() {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { currentFamilyId } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddName, setQuickAddName] = useState('');

  const quickAddMutation = useMutation({
    mutationFn: (name: string) => itemApi.create(currentFamilyId!, {
      name,
      quantity: 1,
      minQuantity: 1,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
      setShowQuickAdd(false);
      setQuickAddName('');
      setIsOpen(false);
    },
  });

  // Don't show on login/register pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30">
        <div className="relative flex flex-col items-end">
          {isOpen && (
            <div className="mb-2 flex flex-col gap-2 items-end">
              <button
                onClick={() => {
                  setShowQuickAdd(true);
                  setIsOpen(false);
                }}
                className="bg-white text-primary-700 px-4 py-2 rounded-lg shadow-warm hover:bg-warm-100 text-sm flex items-center gap-2 border border-warm-200"
              >
                <span>📦</span> 快速添加
              </button>
              <Link
                to="/items/new"
                onClick={() => setIsOpen(false)}
                className="bg-white text-primary-700 px-4 py-2 rounded-lg shadow-warm hover:bg-warm-100 text-sm flex items-center gap-2 border border-warm-200"
              >
                <span>✨</span> 完整添加
              </Link>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-14 h-14 rounded-full bg-primary text-white shadow-warm-lg flex items-center justify-center text-2xl transition-all duration-300 ${
              isOpen ? 'rotate-45 hover:bg-primary-600' : 'hover:bg-primary-600 hover:shadow-warm-lg'
            }`}
          >
            {isOpen ? '✕' : '+'}
          </button>
        </div>
      </div>

      {showQuickAdd && (
        <Modal title="快速添加物品" onClose={() => setShowQuickAdd(false)}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (quickAddName.trim()) {
                quickAddMutation.mutate(quickAddName.trim());
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">物品名称</label>
              <input
                type="text"
                value={quickAddName}
                onChange={(e) => setQuickAddName(e.target.value)}
                className="input text-sm"
                placeholder="例如：洗发水"
                autoFocus
                required
              />
            </div>
            {quickAddMutation.error && (
              <p className="text-red-500 text-sm">
                {(quickAddMutation.error as any).response?.data?.message || '添加失败'}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={quickAddMutation.isPending}
              >
                {quickAddMutation.isPending ? '添加中...' : '添加'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}