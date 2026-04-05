import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseApi, PurchaseRecord, PurchaseItem } from '../services/purchase';
import { itemApi } from '../services/item';
import { useAuthStore } from '../stores/auth';
import Modal from '../components/Modal';
import type { Item } from '../types';

export default function PurchaseRecordsPage() {
  const { currentFamilyId } = useAuthStore();
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [toast, setToast] = useState('');

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['purchaseRecords', currentFamilyId],
    queryFn: () => purchaseApi.getAll(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const deleteMutation = useMutation({
    mutationFn: (purchaseId: number) => purchaseApi.delete(currentFamilyId!, purchaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseRecords', currentFamilyId] });
      setToast('删除成功');
      setTimeout(() => setToast(''), 2000);
    },
  });

  // 按日期分组
  const groupedByDate = records.reduce((acc, record) => {
    const date = new Date(record.purchaseDate).toLocaleDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(record);
    return acc;
  }, {} as Record<string, PurchaseRecord[]>);

  return (
    <div>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded text-lg">←</Link>
        <h2 className="text-lg sm:text-xl font-bold">采购历史</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary text-sm ml-auto"
        >
          + 记一笔
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : records.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📝</div>
          <p className="text-gray-500 mb-4">暂无采购记录</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary"
          >
            记一笔采购
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByDate).map(([date, items]) => (
            <div key={date} className="card">
              <h3 className="font-medium text-sm text-gray-500 mb-3">{date}</h3>
              <div className="space-y-3">
                {items.map((record) => (
                  <div key={record.id} className="flex items-start justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{record.purchaserNickname}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(record.purchaseDate).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        {record.items.map(item => `${item.itemName} x${item.quantity}`).join(', ')}
                      </div>
                      {record.notes && (
                        <div className="text-xs text-gray-400 mt-1">{record.notes}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {record.totalAmount > 0 && (
                        <span className="text-sm text-orange-500">¥{record.totalAmount.toFixed(2)}</span>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('确定要删除这条记录吗？')) {
                            deleteMutation.mutate(record.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreatePurchaseModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            queryClient.invalidateQueries({ queryKey: ['purchaseRecords', currentFamilyId] });
            setToast('采购已记录');
            setTimeout(() => setToast(''), 2000);
          }}
        />
      )}
    </div>
  );
}

interface CreatePurchaseModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreatePurchaseModal({ onClose, onSuccess }: CreatePurchaseModalProps) {
  const { currentFamilyId } = useAuthStore();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [notes, setNotes] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);

  const { data: allItems = [] } = useQuery({
    queryKey: ['items', currentFamilyId],
    queryFn: () => itemApi.getAll(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const createMutation = useMutation({
    mutationFn: () => purchaseApi.create(currentFamilyId!, {
      purchaseDate: new Date().toISOString(),
      notes: notes || undefined,
      items,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      onSuccess();
    },
  });

  const addItem = (item: Item) => {
    setItems([...items, { itemId: item.id, itemName: item.name, quantity: 1, price: 0 }]);
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    if (field === 'price' || field === 'quantity') {
      setTotalAmount(newItems.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0));
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <Modal title="记一笔采购" onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="label">选择物品</label>
          <select
            className="input w-full"
            onChange={(e) => {
              const item = allItems.find(i => i.id === Number(e.target.value));
              if (item) {
                addItem(item);
                e.target.value = '';
              }
            }}
            value=""
          >
            <option value="">选择物品...</option>
            {allItems.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        {items.length > 0 && (
          <div className="space-y-2">
            <label className="label">已选物品</label>
            {items.map((item, index) => (
              <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span className="flex-1 text-sm truncate">{item.itemName}</span>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                  className="w-16 input text-sm text-center"
                  min={1}
                />
                <span className="text-xs text-gray-400">件</span>
                <input
                  type="number"
                  value={item.price || 0}
                  onChange={(e) => updateItem(index, 'price', parseFloat(e.target.value) || 0)}
                  className="w-20 input text-sm text-center"
                  min={0}
                  step={0.01}
                />
                <span className="text-xs text-gray-400">元</span>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-500 text-xs"
                >
                  删除
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="label">备注</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input w-full"
            placeholder="可选备注..."
          />
        </div>

        {totalAmount > 0 && (
          <div className="text-right text-lg font-medium">
            总金额：<span className="text-orange-500">¥{totalAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">取消</button>
          <button
            onClick={() => createMutation.mutate()}
            disabled={items.length === 0 || createMutation.isPending}
            className="btn-primary flex-1 disabled:opacity-50"
          >
            {createMutation.isPending ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
