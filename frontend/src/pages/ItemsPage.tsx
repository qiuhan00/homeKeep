import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../services/family';
import { itemApi } from '../services/item';
import { useAuthStore } from '../stores/auth';
import { usePermission } from '../hooks/usePermission';
import type { Family } from '../types';
import ConfirmModal from '../components/ConfirmModal';

export default function ItemsPage() {
  const { currentFamilyId, setCurrentFamilyId } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<'batch' | 'single' | null>(null);

  // 权限检查
  const { canEdit } = usePermission(selectedFamily);

  const { data: families = [], isLoading: familiesLoading } = useQuery({
    queryKey: ['families'],
    queryFn: familyApi.getAll,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['items', currentFamilyId],
    queryFn: () => itemApi.getAll(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['lowStock', currentFamilyId],
    queryFn: () => itemApi.getLowStock(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const { data: searchResults = [] } = useQuery({
    queryKey: ['search', currentFamilyId, searchKeyword],
    queryFn: () => itemApi.search(currentFamilyId!, searchKeyword),
    enabled: !!currentFamilyId && searchKeyword.length > 0,
  });

  // 单个删除
  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (itemId: number) => itemApi.delete(currentFamilyId!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
      setDeleteItemId(null);
    },
  });

  // 调整数量
  const adjustMutation = useMutation({
    mutationFn: ({ itemId, delta }: { itemId: number; delta: number }) =>
      itemApi.adjustQuantity(currentFamilyId!, itemId, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
    },
  });

  // 批量删除
  const batchDeleteMutation = useMutation({
    mutationFn: () => {
      const promises = Array.from(selectedItems).map(itemId =>
        itemApi.delete(currentFamilyId!, itemId)
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
      setSelectedItems(new Set());
      setSelectMode(false);
      setConfirmDelete(null);
    },
  });

  useEffect(() => {
    if (families.length > 0 && !currentFamilyId) {
      setCurrentFamilyId(families[0].id);
      setSelectedFamily(families[0]);
    } else if (currentFamilyId) {
      setSelectedFamily(families.find(f => f.id === currentFamilyId) || null);
    }
  }, [families, currentFamilyId, setCurrentFamilyId]);

  const displayItems = searchKeyword ? searchResults : items.filter(i => !i.isDeleted && !i.usedUp);
  const usedUpItems = items.filter(i => !i.isDeleted && i.usedUp);

  const toggleSelectItem = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === displayItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(displayItems.map(i => i.id)));
    }
  };

  if (families.length === 0 && !familiesLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">您还没有加入任何家庭</p>
        <Link to="/family" className="btn-primary">
          创建或加入家庭
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
        <div>
          <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">物品管理</h2>
          <p className="text-gray-500 text-xs sm:text-sm">
            {selectedFamily?.name || '全部家庭'}
            {lowStockItems.length > 0 && (
              <span className="text-red-500 ml-1 sm:ml-2">
                有 {lowStockItems.length} 件物品需要补充
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <>
              {selectMode ? (
                <>
                  <button
                    onClick={() => {
                      setSelectMode(false);
                      setSelectedItems(new Set());
                    }}
                    className="btn-secondary text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => setConfirmDelete('batch')}
                    disabled={selectedItems.size === 0}
                    className="btn-danger text-sm disabled:opacity-50"
                  >
                    删除 {selectedItems.size > 0 && `(${selectedItems.size})`}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setSelectMode(true)}
                    className="btn-secondary text-sm"
                  >
                    选择
                  </button>
                  <Link to="/items/new" className="btn-primary text-sm">
                    + 添加
                  </Link>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {families.length > 1 && (
        <div className="mb-3 sm:mb-4 flex gap-1 sm:gap-2 overflow-x-auto pb-2">
          {families.map((family) => (
            <button
              key={family.id}
              onClick={() => {
                setCurrentFamilyId(family.id);
                setSelectedFamily(family);
              }}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-button whitespace-nowrap transition-colors text-xs sm:text-sm ${
                currentFamilyId === family.id
                  ? 'bg-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {family.name}
            </button>
          ))}
        </div>
      )}

      <div className="mb-3 sm:mb-4">
        <input
          type="search"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          placeholder="搜索物品..."
          className="input max-w-full text-sm"
        />
      </div>

      {itemsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="bg-gray-200 h-24 sm:h-32 rounded mb-2 sm:mb-3" />
              <div className="bg-gray-200 h-3 sm:h-4 w-3/4 rounded mb-1 sm:mb-2" />
              <div className="bg-gray-200 h-2 sm:h-3 w-1/2 rounded" />
            </div>
          ))}
        </div>
      ) : displayItems.length === 0 ? (
        <div className="text-center py-8 sm:py-12 text-gray-500 text-sm">
          {searchKeyword ? '没有找到匹配的物品' : '暂无物品，点击添加按钮添加'}
        </div>
      ) : (
        <>
          {selectMode && (
            <div className="mb-3 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedItems.size === displayItems.length && displayItems.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-500">全选</span>
            </div>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {displayItems.map((item) => (
              <div
                key={item.id}
                className={`card hover:shadow-md transition-shadow relative ${
                  item.isAlert ? 'ring-2 ring-red-400' : ''
                } ${selectedItems.has(item.id) ? 'ring-2 ring-primary' : ''}`}
              >
                {selectMode && (
                  <div
                    className="absolute top-2 left-2 z-10 cursor-pointer"
                    onClick={() => toggleSelectItem(item.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4"
                    />
                  </div>
                )}
                <Link
                  to={`/items/${item.id}`}
                  className="block"
                >
                  <div className="bg-gray-100 h-20 sm:h-28 lg:h-32 rounded mb-2 sm:mb-3 flex items-center justify-center overflow-hidden relative">
                    {item.coverImageUrl ? (
                      <img src={item.coverImageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl sm:text-4xl">📦</span>
                    )}
                    {item.expiryDate && (() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const expiry = new Date(item.expiryDate);
                      expiry.setHours(0, 0, 0, 0);
                      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      if (diffDays < 0) {
                        return <span className="absolute bottom-1 right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">已过期</span>;
                      } else if (diffDays <= 7) {
                        return <span className="absolute bottom-1 right-1 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded">{diffDays}天后过期</span>;
                      }
                      return null;
                    })()}
                  </div>
                  <h3 className="font-medium text-sm sm:text-base truncate">{item.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">
                    {item.locationPath || item.category || '未分类'}
                  </p>
                  {item.tags ? (
                    <p className="text-xs text-gray-400 truncate mt-0.5 h-4">
                      {item.tags.split(',').slice(0, 2).map(tag => `#${tag.trim()}`).join(' ')}
                    </p>
                  ) : (
                    <p className="h-4"></p>
                  )}
                </Link>
                <div className="flex items-center justify-between mt-1 sm:mt-2">
                  {!selectMode && canEdit && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setDeleteItemId(item.id);
                      }}
                      disabled={deleteMutation.isPending}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-500 disabled:opacity-50 text-xs flex items-center justify-center"
                      title="删除"
                    >
                      🗑
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        adjustMutation.mutate({ itemId: item.id, delta: -1 });
                      }}
                      disabled={!canEdit || item.quantity <= 0 || adjustMutation.isPending}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-xs sm:text-sm font-bold flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className={`text-xs sm:text-sm min-w-[40px] text-center ${item.quantity <= item.minQuantity ? 'text-red-500' : 'text-gray-600'}`}>
                      {item.quantity}/{item.minQuantity}
                    </span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        adjustMutation.mutate({ itemId: item.id, delta: 1 });
                      }}
                      disabled={!canEdit || adjustMutation.isPending}
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary hover:bg-primary-600 text-white disabled:opacity-50 text-xs sm:text-sm font-bold flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
                {item.isAlert && (
                  <span className="absolute top-2 right-2 text-xs bg-red-100 text-red-600 px-1.5 sm:px-2 py-0.5 rounded">
                    需补充
                  </span>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 已用完物品区域 */}
      {usedUpItems.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-3 text-sm sm:text-base text-gray-500">已用完物品</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {usedUpItems.map((item) => (
              <div
                key={item.id}
                className={`card relative opacity-50 ${
                  selectedItems.has(item.id) ? 'ring-2 ring-primary' : ''
                }`}
              >
                {selectMode && (
                  <div
                    className="absolute top-2 left-2 z-10 cursor-pointer"
                    onClick={() => toggleSelectItem(item.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleSelectItem(item.id)}
                      className="w-4 h-4"
                    />
                  </div>
                )}
                <Link
                  to={`/items/${item.id}`}
                  className="block"
                >
                  <div className="bg-gray-100 h-20 sm:h-28 lg:h-32 rounded mb-2 sm:mb-3 flex items-center justify-center overflow-hidden grayscale relative">
                    {item.coverImageUrl ? (
                      <img src={item.coverImageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl sm:text-4xl">📦</span>
                    )}
                    {item.expiryDate && (() => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const expiry = new Date(item.expiryDate);
                      expiry.setHours(0, 0, 0, 0);
                      const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      if (diffDays < 0) {
                        return <span className="absolute bottom-1 right-1 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded">已过期</span>;
                      } else if (diffDays <= 7) {
                        return <span className="absolute bottom-1 right-1 text-xs bg-orange-500 text-white px-1.5 py-0.5 rounded">{diffDays}天后过期</span>;
                      }
                      return null;
                    })()}
                  </div>
                  <h3 className="font-medium text-sm sm:text-base truncate text-gray-400">{item.name}</h3>
                  <p className="text-xs sm:text-sm text-gray-400 truncate">
                    {item.locationPath || item.category || '未分类'}
                  </p>
                  {item.tags ? (
                    <p className="text-xs text-gray-400 truncate mt-0.5 h-4">
                      {item.tags.split(',').slice(0, 2).map(tag => `#${tag.trim()}`).join(' ')}
                    </p>
                  ) : (
                    <p className="h-4"></p>
                  )}
                </Link>
                <div className="flex items-center justify-end gap-1 mt-1 sm:mt-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      adjustMutation.mutate({ itemId: item.id, delta: -1 });
                    }}
                    disabled={!canEdit || adjustMutation.isPending}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-sm font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-xs sm:text-sm min-w-[40px] text-center text-gray-400">
                    0/{item.minQuantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      adjustMutation.mutate({ itemId: item.id, delta: 1 });
                    }}
                    disabled={!canEdit || adjustMutation.isPending}
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-primary hover:bg-primary-600 text-white disabled:opacity-50 text-xs sm:text-sm font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
                <span className="absolute top-2 right-2 text-xs bg-gray-200 text-gray-500 px-1.5 sm:px-2 py-0.5 rounded">
                  已用完
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmDelete !== null}
        title={confirmDelete === 'batch' ? '批量删除' : '删除物品'}
        message={confirmDelete === 'batch'
          ? `确定要删除选中的 ${selectedItems.size} 件物品吗？此操作不可撤销。`
          : `确定要删除此物品吗？此操作不可撤销。`}
        confirmText="删除"
        onConfirm={() => {
          if (confirmDelete === 'batch') {
            batchDeleteMutation.mutate();
          } else if (confirmDelete === 'single' && deleteItemId !== null) {
            deleteMutation.mutate(deleteItemId);
          }
        }}
        onCancel={() => setConfirmDelete(null)}
        danger
      />
    </div>
  );
}