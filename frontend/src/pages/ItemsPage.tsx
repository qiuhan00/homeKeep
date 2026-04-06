import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../services/family';
import { itemApi, locationApi } from '../services/item';
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
  const [locationFilter, setLocationFilter] = useState<string | null>(null);
  const [showLowStock, setShowLowStock] = useState(false);

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

  const { data: locations = [] } = useQuery({
    queryKey: ['locations', 'all', currentFamilyId],
    queryFn: () => locationApi.getAll(currentFamilyId!),
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

  const [deleteItemId, setDeleteItemId] = useState<number | null>(null);
  const deleteMutation = useMutation({
    mutationFn: (itemId: number) => itemApi.delete(currentFamilyId!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
      setDeleteItemId(null);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ itemId, delta }: { itemId: number; delta: number }) =>
      itemApi.adjustQuantity(currentFamilyId!, itemId, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
    },
  });

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

  // 当 currentFamilyId 变化时，清除相关缓存确保数据最新
  useEffect(() => {
    if (currentFamilyId) {
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['locations', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
    }
  }, [currentFamilyId, queryClient]);

  const displayItems = searchKeyword
    ? searchResults.filter(i => !i.isDeleted)
    : items.filter(i => !i.isDeleted);

  const filteredByLocation = locationFilter
    ? displayItems.filter(item => item.locationPath === locationFilter)
    : displayItems;

  const filteredByLowStock = showLowStock
    ? filteredByLocation.filter(item => item.isAlert)
    : filteredByLocation;

  const effectiveDisplayItems = filteredByLowStock;

  const groupedByLocation = filteredByLowStock.reduce((acc, item) => {
    const locationKey = item.locationPath || '未分类';
    if (!acc[locationKey]) {
      acc[locationKey] = [];
    }
    acc[locationKey].push(item);
    return acc;
  }, {} as Record<string, typeof filteredByLowStock>);

  const allLocationKeys = locations.map(loc => loc.name);

  const displayLocationKeys = showLowStock
    ? Object.keys(groupedByLocation).sort((a, b) => {
        if (a === '未分类') return 1;
        if (b === '未分类') return -1;
        return a.localeCompare(b);
      })
    : locationFilter
      ? [locationFilter]
      : allLocationKeys.sort((a, b) => {
          if (a === '未分类') return 1;
          if (b === '未分类') return -1;
          return a.localeCompare(b);
        });

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
    if (selectedItems.size === effectiveDisplayItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(effectiveDisplayItems.map(i => i.id)));
    }
  };

  if (families.length === 0 && !familiesLoading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center px-6">
        <div className="w-20 h-20 rounded-full bg-[#F7F4F0] flex items-center justify-center mb-6">
          <svg className="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="#9C9690" strokeWidth="1.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path d="M9 22V12h6v10"/>
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-[#2D2A26] mb-2">还没有加入任何家庭</h3>
        <p className="text-[#6B6560] mb-6 text-center">创建或加入家庭，开始管理您的物品</p>
        <Link to="/family" className="btn-primary px-6 py-3">
          创建或加入家庭
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-bg)' }}>
      {/* 页面标题区 */}
      <div className="px-5 pt-8 pb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-[#2D2A26] mb-1">物品管理</h1>
            <p className="text-sm text-[#6B6560]">
              {selectedFamily?.name}
              <span className="mx-2">·</span>
              {effectiveDisplayItems.length} 件物品
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canEdit && (
              <>
                {selectMode ? (
                  <>
                    <button
                      onClick={() => { setSelectMode(false); setSelectedItems(new Set()); }}
                      className="btn-ghost text-sm"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => setConfirmDelete('batch')}
                      disabled={selectedItems.size === 0}
                      className="btn-primary text-sm px-4 py-2 bg-[#C74D3D] hover:bg-[#B04336]"
                    >
                      删除 {selectedItems.size > 0 && `(${selectedItems.size})`}
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setSelectMode(true)} className="btn-ghost text-sm">
                      选择
                    </button>
                    <Link to="/items/new" className="btn-primary text-sm px-4 py-2">
                      + 添加
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* 搜索 */}
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#9C9690]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索物品..."
            className="w-full pl-12 pr-4 py-3.5 rounded-2xl text-sm"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          />
        </div>
      </div>

      {/* 家庭切换 */}
      {families.length > 1 && (
        <div className="px-5 mb-5 flex gap-2 overflow-x-auto">
          {families.map((family) => (
            <button
              key={family.id}
              onClick={() => { setCurrentFamilyId(family.id); setSelectedFamily(family); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                currentFamilyId === family.id
                  ? 'chip chip-accent'
                  : 'chip chip-default'
              }`}
            >
              {family.name}
            </button>
          ))}
        </div>
      )}

      {/* 筛选标签 */}
      {allLocationKeys.length > 0 && (
        <div className="px-5 mb-6 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => { setLocationFilter(null); setShowLowStock(false); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              locationFilter === null && !showLowStock
                ? 'chip chip-accent'
                : 'chip chip-default'
            }`}
          >
            全部
          </button>
          <button
            onClick={() => { setLocationFilter(null); setShowLowStock(true); }}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              showLowStock
                ? 'chip'
                : 'chip chip-default'
            }`}
            style={showLowStock ? { backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' } : {}}
          >
            需补充
            {lowStockItems.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-xs bg-[#C74D3D] text-white">
                {lowStockItems.length}
              </span>
            )}
          </button>
          {allLocationKeys.sort().map(location => {
            const count = displayItems.filter(item => item.locationPath === location).length;
            return (
              <button
                key={location}
                onClick={() => { setLocationFilter(location); setShowLowStock(false); }}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  locationFilter === location
                    ? 'chip chip-accent'
                    : 'chip chip-default'
                }`}
              >
                {location}
                <span className="ml-1.5 text-xs opacity-60">({count})</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 内容区域 */}
      <div className="px-5 pb-10">
        {itemsLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="bg-[#F7F4F0] h-32 rounded-xl mb-4" />
                <div className="bg-[#F7F4F0] h-4 w-3/4 rounded mb-2" />
                <div className="bg-[#F7F4F0] h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : effectiveDisplayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-24 h-24 rounded-full bg-[#F7F4F0] flex items-center justify-center mb-5">
              <svg className="w-12 h-12 text-[#9C9690]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {showLowStock ? (
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                ) : searchKeyword ? (
                  <>
                    <circle cx="11" cy="11" r="8"/>
                    <path d="M21 21l-4.35-4.35"/>
                  </>
                ) : (
                  <>
                    <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                  </>
                )}
              </svg>
            </div>
            <h3 className="text-lg font-medium text-[#2D2A26] mb-1">
              {showLowStock ? '库存充足' : searchKeyword ? '没有找到' : '还没有物品'}
            </h3>
            <p className="text-sm text-[#9C9690] text-center max-w-xs">
              {showLowStock ? '所有物品库存充足，继续保持！' : searchKeyword ? '换个关键词试试' : '点击添加按钮开始管理'}
            </p>
          </div>
        ) : (
          <>
            {/* 全选栏 */}
            {selectMode && (
              <div className="mb-4 flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <input
                  type="checkbox"
                  checked={selectedItems.size === effectiveDisplayItems.length && effectiveDisplayItems.length > 0}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: 'var(--color-accent)' }}
                />
                <span className="text-sm text-[#6B6560]">全选</span>
                <span className="text-xs text-[#9C9690] ml-auto">{selectedItems.size} 已选</span>
              </div>
            )}

            {/* 物品分组 */}
            {displayLocationKeys.map(locationKey => (
              <div key={locationKey} className="mb-8">
                {/* 分组标题 */}
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-base font-medium text-[#2D2A26]">{locationKey}</h2>
                  <span className="text-xs text-[#9C9690] bg-[#F7F4F0] px-2 py-0.5 rounded-full">
                    {groupedByLocation[locationKey]?.length || 0}
                  </span>
                </div>

                {/* 物品网格 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
                  {(groupedByLocation[locationKey] || []).map((item) => (
                    <div
                      key={item.id}
                      className={`card card-hover relative ${
                        item.isAlert ? 'ring-2 ring-[#C74D3D]/20' : ''
                      } ${selectedItems.has(item.id) ? 'ring-2 ring-[#D4662B]/30' : ''} ${item.usedUp ? 'opacity-50' : ''}`}
                    >
                      {/* 选择checkbox */}
                      {selectMode && (
                        <div
                          className="absolute top-3 left-3 z-10"
                          onClick={() => toggleSelectItem(item.id)}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item.id)}
                            onChange={() => toggleSelectItem(item.id)}
                            className="w-5 h-5 rounded"
                            style={{ accentColor: 'var(--color-accent)' }}
                          />
                        </div>
                      )}

                      {/* 状态标签 */}
                      {item.usedUp ? (
                        <span className="absolute top-3 right-3 z-10 text-xs px-2 py-1 rounded-full font-medium bg-[#F7F4F0] text-[#6B6560]">
                          已用完
                        </span>
                      ) : item.isAlert ? (
                        <span className="absolute top-3 right-3 z-10 text-xs px-2 py-1 rounded-full font-medium bg-[#FBEAE7] text-[#C74D3D]">
                          需补充
                        </span>
                      ) : null}

                      {/* 图片 */}
                      <Link to={`/items/${item.id}`} className="block">
                        <div
                          className="h-28 rounded-xl mb-3 flex items-center justify-center overflow-hidden relative"
                          style={{ backgroundColor: '#F7F4F0' }}
                        >
                          {item.coverImageUrl ? (
                            <img src={item.coverImageUrl} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl opacity-40">
                              {item.category === '洗漱' ? '🧴' :
                               item.category === '食品' ? '🍎' :
                               item.category === '厨房' ? '🍳' : '📦'}
                            </span>
                          )}
                          {/* 过期标签 */}
                          {item.expiryDate && (() => {
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const expiry = new Date(item.expiryDate);
                            expiry.setHours(0, 0, 0, 0);
                            const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                            if (diffDays < 0) {
                              return <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full bg-[#C74D3D] text-white">已过期</span>;
                            } else if (diffDays <= 7) {
                              return <span className="absolute top-2 left-2 text-xs px-2 py-0.5 rounded-full bg-[#C98B2B] text-white">{diffDays}天过期</span>;
                            }
                            return null;
                          })()}
                        </div>
                        <h3 className="font-medium text-[#2D2A26] truncate mb-0.5">{item.name}</h3>
                        <p className="text-sm text-[#9C9690] truncate">{item.category || '未分类'}</p>
                        {item.tags && (
                          <div className="flex gap-1 mt-1.5 overflow-hidden">
                            {item.tags.split(',').slice(0, 2).map(tag => (
                              <span key={tag} className="text-xs text-[#9C9690]">#{tag.trim()}</span>
                            ))}
                          </div>
                        )}
                      </Link>

                      {/* 数量控制 */}
                      {!selectMode && (
                        <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: '1px solid var(--color-border-light)' }}>
                          {canEdit && (
                            <button
                              onClick={() => adjustMutation.mutate({ itemId: item.id, delta: -1 })}
                              disabled={!canEdit || item.quantity <= 0 || adjustMutation.isPending}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-medium transition-all"
                              style={{ backgroundColor: 'var(--color-bg-warm)', color: 'var(--color-text-secondary)' }}
                            >
                              −
                            </button>
                          )}
                          <div className={`flex-1 text-center font-medium ${
                            item.minQuantity != null && item.quantity <= item.minQuantity ? 'text-[#C74D3D]' : 'text-[#2D2A26]'
                          }`}>
                            <span className="text-base">{item.quantity}</span>
                            {item.minQuantity != null && (
                              <span className="text-xs text-[#9C9690]"> / {item.minQuantity}</span>
                            )}
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => adjustMutation.mutate({ itemId: item.id, delta: 1 })}
                              disabled={!canEdit || adjustMutation.isPending}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-lg font-medium text-white transition-all"
                              style={{ backgroundColor: 'var(--color-accent)' }}
                            >
                              +
                            </button>
                          )}
                          {canEdit && (
                            <button
                              onClick={() => { setDeleteItemId(item.id); setConfirmDelete('single'); }}
                              disabled={deleteMutation.isPending}
                              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9C9690] hover:text-[#C74D3D] transition-colors"
                              title="删除"
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmDelete !== null}
        title={confirmDelete === 'batch' ? '确认删除' : '删除物品'}
        message={confirmDelete === 'batch'
          ? `确定要删除选中的 ${selectedItems.size} 件物品吗？此操作不可撤销。`
          : '确定要删除此物品吗？此操作不可撤销。'}
        onConfirm={() => {
          setConfirmDelete(null);
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