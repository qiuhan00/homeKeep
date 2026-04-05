import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itemApi } from '../services/item';
import { useAuthStore } from '../stores/auth';
import ConfirmModal from '../components/ConfirmModal';

export default function ItemDetailPage() {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentFamilyId } = useAuthStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', currentFamilyId, itemId],
    queryFn: () => itemApi.getById(currentFamilyId!, Number(itemId)),
    enabled: !!currentFamilyId && !!itemId,
  });

  const adjustMutation = useMutation({
    mutationFn: (delta: number) => itemApi.adjustQuantity(currentFamilyId!, Number(itemId), delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item', currentFamilyId, itemId] });
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => itemApi.delete(currentFamilyId!, Number(itemId)),
    onSuccess: () => {
      navigate('/');
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="bg-gray-200 h-64 rounded mb-4" />
        <div className="bg-gray-200 h-8 w-3/4 rounded mb-4" />
        <div className="bg-gray-200 h-4 w-1/2 rounded mb-2" />
        <div className="bg-gray-200 h-4 w-1/2 rounded mb-2" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">物品不存在</p>
        <Link to="/" className="btn-primary mt-4">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded">
          ←
        </button>
        <h2 className="text-xl font-bold">物品详情</h2>
      </div>

      <div className="card mb-4">
        <div className="bg-gray-100 h-48 rounded mb-4 flex items-center justify-center overflow-hidden">
          {item.coverImageUrl ? (
            <img src={item.coverImageUrl} alt={item.name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-6xl">📦</span>
          )}
        </div>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{item.name}</h1>
            {item.category && (
              <span className="text-sm bg-gray-100 px-2 py-1 rounded mt-1 inline-block">
                {item.category}
              </span>
            )}
          </div>
          {item.isAlert && (
            <span className="bg-red-100 text-red-600 px-3 py-1 rounded-button text-sm">
              库存不足
            </span>
          )}
        </div>

        {item.description && (
          <p className="text-gray-600 mb-4">{item.description}</p>
        )}

        <div className="border-t border-gray-100 pt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">存放位置</span>
            <span>{item.locationPath || '未分类'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">创建者</span>
            <span>{item.creatorNickname}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">更新时间</span>
            <span>{new Date(item.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <h3 className="font-medium mb-3">数量管理</h3>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => adjustMutation.mutate(-1)}
            disabled={item.quantity <= 0 || adjustMutation.isPending}
            className="w-12 h-12 rounded-full bg-gray-100 text-2xl font-bold hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <div className="text-center">
            <span className={`text-4xl font-bold ${
              item.quantity <= item.minQuantity ? 'text-red-500' : 'text-gray-800'
            }`}>
              {item.quantity}
            </span>
            <p className="text-sm text-gray-500">
              最低 {item.minQuantity}
            </p>
          </div>
          <button
            onClick={() => adjustMutation.mutate(1)}
            disabled={adjustMutation.isPending}
            className="w-12 h-12 rounded-full bg-primary text-2xl font-bold text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
        {item.quantity <= item.minQuantity && (
          <p className="text-center text-red-500 text-sm mt-2">
            当前数量低于最低阈值，请及时补充
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Link
          to={`/items/${itemId}/edit`}
          className="btn-primary flex-1 text-center"
        >
          编辑
        </Link>
        <button
          onClick={() => setConfirmDelete(true)}
          className="btn-secondary flex-1 text-red-500"
        >
          删除
        </button>
      </div>

      <ConfirmModal
        isOpen={confirmDelete}
        title="删除物品"
        message={`确定要删除"${item.name}"吗？此操作不可撤销。`}
        confirmText="删除"
        onConfirm={() => {
          setConfirmDelete(false);
          deleteMutation.mutate();
        }}
        onCancel={() => setConfirmDelete(false)}
        danger
      />
    </div>
  );
}
