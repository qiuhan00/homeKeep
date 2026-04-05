import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { familyApi } from '../services/family';
import { itemApi } from '../services/item';
import { useAuthStore } from '../stores/auth';
import type { Item, DashboardStats } from '../types';

export default function HomePage() {
  const { user, currentFamilyId, setCurrentFamilyId } = useAuthStore();
  const queryClient = useQueryClient();
  const [toast, setToast] = useState('');

  const { data: families = [] } = useQuery({
    queryKey: ['families'],
    queryFn: familyApi.getAll,
  });

  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboardStats', currentFamilyId],
    queryFn: () => itemApi.getDashboardStats(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const { data: lowStockItems = [] } = useQuery({
    queryKey: ['lowStock', currentFamilyId],
    queryFn: () => itemApi.getLowStock(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const { data: usedUpItems = [] } = useQuery({
    queryKey: ['usedUp', currentFamilyId],
    queryFn: () => itemApi.getUsedUp(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const { data: expiringItems = [] } = useQuery({
    queryKey: ['expiring', currentFamilyId],
    queryFn: () => itemApi.getExpiring(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  // 按更新时间倒序排列
  const sortedLowStockItems: Item[] = [...lowStockItems]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // 已用完物品（单独显示）
  const sortedUsedUpItems: Item[] = [...usedUpItems]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  // 调整数量
  const adjustMutation = useMutation({
    mutationFn: ({ itemId, delta }: { itemId: number; delta: number }) =>
      itemApi.adjustQuantity(currentFamilyId!, itemId, delta),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['usedUp', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['expiring', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', currentFamilyId] });
    },
  });

  // 一键补全所有低库存
  const restockAllMutation = useMutation({
    mutationFn: () => itemApi.restockAll(currentFamilyId!),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lowStock', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['usedUp', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['items', currentFamilyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', currentFamilyId] });
      setToast(`已补全 ${data.length} 件物品`);
      setTimeout(() => setToast(''), 2000);
    },
  });

  useEffect(() => {
    if (families.length > 0 && !currentFamilyId) {
      setCurrentFamilyId(families[0].id);
    }
  }, [families, currentFamilyId, setCurrentFamilyId]);

  if (families.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">您还没有加入任何家庭</p>
        <Link to="/family" className="btn-primary">
          创建或加入家庭
        </Link>
      </div>
    );
  }

  const currentFamily = families.find(f => f.id === currentFamilyId) || families[0];

  return (
    <div>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 text-sm">
          {toast}
        </div>
      )}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-1 sm:mb-2">欢迎回来，{user?.nickname || '用户'}</h2>
        <p className="text-gray-500 text-xs sm:text-sm">当前家庭：{currentFamily.name}</p>
      </div>

      {/* 库存统计面板 */}
      {dashboardStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="card text-center py-3 sm:py-4">
            <div className="text-2xl sm:text-3xl mb-1">📦</div>
            <div className="text-lg sm:text-2xl font-bold text-gray-700">{dashboardStats.totalItems}</div>
            <div className="text-xs text-gray-500">总物品数</div>
          </div>
          <div className="card text-center py-3 sm:py-4">
            <div className="text-2xl sm:text-3xl mb-1">⚠️</div>
            <div className="text-lg sm:text-2xl font-bold text-red-500">{dashboardStats.lowStockCount}</div>
            <div className="text-xs text-gray-500">低库存</div>
          </div>
          <div className="card text-center py-3 sm:py-4">
            <div className="text-2xl sm:text-3xl mb-1">⏰</div>
            <div className="text-lg sm:text-2xl font-bold text-orange-500">{dashboardStats.expiringCount}</div>
            <div className="text-xs text-gray-500">即将过期</div>
          </div>
          <div className="card text-center py-3 sm:py-4">
            <div className="text-2xl sm:text-3xl mb-1">🛒</div>
            <div className="text-lg sm:text-2xl font-bold text-gray-500">{dashboardStats.usedUpCount}</div>
            <div className="text-xs text-gray-500">已用完</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-8">
        <Link
          to="/items"
          className="card hover:shadow-md transition-shadow text-center py-4 sm:py-6"
        >
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📦</div>
          <h3 className="font-medium text-sm sm:text-base mb-1">物品管理</h3>
          <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">查看和管理家庭物品</p>
        </Link>

        <Link
          to="/family"
          className="card hover:shadow-md transition-shadow text-center py-4 sm:py-6"
        >
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">👨‍👩‍👧</div>
          <h3 className="font-medium text-sm sm:text-base mb-1">家庭成员</h3>
          <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">管理家庭成员和权限</p>
        </Link>

        <Link
          to="/shopping-list"
          className="card hover:shadow-md transition-shadow text-center py-4 sm:py-6"
        >
          <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🛒</div>
          <h3 className="font-medium text-sm sm:text-base mb-1">购物清单</h3>
          <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">生成采购清单</p>
        </Link>

        <div className="col-span-2 lg:col-span-3">
          <div className="card">
            <h3 className="font-medium mb-3 sm:mb-4 text-sm sm:text-base">快速操作</h3>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <Link to="/items/new" className="btn-primary text-sm">
                + 添加物品
              </Link>
              <Link to="/family" className="btn-secondary text-sm">
                管理家庭
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 即将过期物品 */}
      {expiringItems.length > 0 && (
        <div className="card border-orange-200 bg-orange-50 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm sm:text-base text-orange-600">⏰ 即将过期</h3>
            <span className="text-xs text-orange-500">{expiringItems.length} 件物品</span>
          </div>
          <div className="space-y-2">
            {expiringItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-white rounded hover:bg-orange-100 transition-colors"
              >
                <Link
                  to={`/items/${item.id}`}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <span className="text-lg">📅</span>
                  <span className="text-sm truncate">{item.name}</span>
                  {item.category && (
                    <span className="text-xs text-gray-400 hidden sm:inline">[{item.category}]</span>
                  )}
                </Link>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <span className="text-xs text-orange-500">
                    {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '无日期'}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {expiringItems.length > 5 && (
            <Link
              to="/items"
              className="block text-center text-xs text-orange-500 mt-2 hover:underline"
            >
              查看全部 {expiringItems.length} 件即将过期物品 →
            </Link>
          )}
        </div>
      )}

      {lowStockItems.length > 0 && (
        <div className="card border-red-200 bg-red-50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm sm:text-base text-red-600">⚠️ 待补充物品</h3>
              <button
                onClick={() => restockAllMutation.mutate()}
                disabled={restockAllMutation.isPending}
                className="text-xs bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded disabled:opacity-50"
              >
                {restockAllMutation.isPending ? '补货中...' : '一键补全'}
              </button>
            </div>
            <span className="text-xs text-red-500">{lowStockItems.length} 件物品</span>
          </div>
          <div className="space-y-2">
            {sortedLowStockItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-white rounded hover:bg-red-100 transition-colors"
              >
                <Link
                  to={`/items/${item.id}`}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <span className="text-lg">📦</span>
                  <span className="text-sm truncate">{item.name}</span>
                  {item.category && (
                    <span className="text-xs text-gray-400 hidden sm:inline">[{item.category}]</span>
                  )}
                </Link>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <span className="text-xs text-gray-500 hidden sm:inline">
                    {new Date(item.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      adjustMutation.mutate({ itemId: item.id, delta: -1 });
                    }}
                    disabled={item.quantity <= 0 || adjustMutation.isPending}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-sm sm:text-base font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium text-red-500 min-w-[40px] text-center">
                    {item.quantity}/{item.minQuantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      adjustMutation.mutate({ itemId: item.id, delta: 1 });
                    }}
                    disabled={adjustMutation.isPending}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary hover:bg-primary-600 text-white disabled:opacity-50 text-sm sm:text-base font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          {lowStockItems.length > 5 && (
            <Link
              to="/items"
              className="block text-center text-xs text-red-500 mt-2 hover:underline"
            >
              查看全部 {lowStockItems.length} 件待补充物品 →
            </Link>
          )}
        </div>
      )}

      {/* 已用完物品 */}
      {sortedUsedUpItems.length > 0 && (
        <div className="card border-gray-200 bg-gray-50 mt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm sm:text-base text-gray-500">已用完物品</h3>
            <span className="text-xs text-gray-400">{sortedUsedUpItems.length} 件物品</span>
          </div>
          <div className="space-y-2">
            {sortedUsedUpItems.slice(0, 5).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-white rounded hover:bg-gray-100 transition-colors opacity-60"
              >
                <Link
                  to={`/items/${item.id}`}
                  className="flex items-center gap-2 min-w-0 flex-1"
                >
                  <span className="text-lg grayscale">📦</span>
                  <span className="text-sm truncate text-gray-400">{item.name}</span>
                  {item.category && (
                    <span className="text-xs text-gray-400 hidden sm:inline">[{item.category}]</span>
                  )}
                </Link>
                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      adjustMutation.mutate({ itemId: item.id, delta: -1 });
                    }}
                    disabled={adjustMutation.isPending}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-sm sm:text-base font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="text-sm font-medium text-gray-400 min-w-[40px] text-center">
                    0/{item.minQuantity}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      adjustMutation.mutate({ itemId: item.id, delta: 1 });
                    }}
                    disabled={adjustMutation.isPending}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary hover:bg-primary-600 text-white disabled:opacity-50 text-sm sm:text-base font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
          {sortedUsedUpItems.length > 5 && (
            <Link
              to="/items"
              className="block text-center text-xs text-gray-400 mt-2 hover:underline"
            >
              查看全部 {sortedUsedUpItems.length} 件已用完物品 →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}