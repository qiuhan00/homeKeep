import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { trendApi } from '../services/trend';
import { useAuthStore } from '../stores/auth';

export default function ConsumptionTrendsPage() {
  const { currentFamilyId } = useAuthStore();
  const [sortBy, setSortBy] = useState<'daysUntilRestock' | 'name'>('daysUntilRestock');

  const { data: trends = [], isLoading } = useQuery({
    queryKey: ['consumptionTrends', currentFamilyId],
    queryFn: () => trendApi.getTrends(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  // 排序
  const sortedTrends = [...trends].sort((a, b) => {
    if (sortBy === 'daysUntilRestock') {
      // 优先显示有消耗趋势的物品
      if (a.daysUntilRestock === null && b.daysUntilRestock === null) return 0;
      if (a.daysUntilRestock === null) return 1;
      if (b.daysUntilRestock === null) return -1;
      return a.daysUntilRestock - b.daysUntilRestock;
    }
    return a.itemName.localeCompare(b.itemName);
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded text-lg">←</Link>
        <h2 className="text-lg sm:text-xl font-bold">消耗趋势</h2>
      </div>

      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">共 {trends.length} 件物品</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="input text-sm py-1"
          >
            <option value="daysUntilRestock">按急需补货排序</option>
            <option value="name">按名称排序</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : trends.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-gray-500">暂无消耗数据</p>
          <p className="text-xs text-gray-400 mt-2">开始使用后会显示消耗趋势</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedTrends.map((trend) => (
            <div key={trend.itemId} className="card">
              <div className="flex items-start justify-between mb-2">
                <Link
                  to={`/items/${trend.itemId}`}
                  className="font-medium text-sm sm:text-base hover:text-orange-500"
                >
                  {trend.itemName}
                </Link>
                <div className="text-right">
                  {trend.daysUntilRestock !== null ? (
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      trend.daysUntilRestock <= 3 ? 'bg-red-100 text-red-600' :
                      trend.daysUntilRestock <= 7 ? 'bg-orange-100 text-orange-600' :
                      'bg-green-100 text-green-600'
                    }`}>
                      {trend.daysUntilRestock}天后需补货
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400">消耗平稳</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                <span>当前: {trend.currentQuantity}/{trend.minQuantity}</span>
                {trend.avgDailyConsumption > 0 && (
                  <span>日均消耗: {trend.avgDailyConsumption.toFixed(1)}</span>
                )}
                {trend.predictedRestockDate && (
                  <span>预计: {new Date(trend.predictedRestockDate).toLocaleDateString()}</span>
                )}
              </div>

              {/* 7天消耗柱状图 */}
              <div className="flex items-end gap-1 h-8">
                {trend.recentConsumption.map((day, i) => {
                  const maxConsumption = Math.max(...trend.recentConsumption.map(d => d.consumption), 1);
                  const height = Math.max((day.consumption / maxConsumption) * 24, day.consumption > 0 ? 4 : 0);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div
                        className="w-full bg-orange-200 rounded-t transition-all"
                        style={{ height: `${height}px` }}
                      />
                      <span className="text-[10px] text-gray-400">
                        {new Date(day.date).getMonth() + 1}/{new Date(day.date).getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
