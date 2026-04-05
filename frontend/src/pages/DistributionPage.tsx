import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { trendApi } from '../services/trend';
import { useAuthStore } from '../stores/auth';

const COLORS = [
  '#E07B39', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6',
  '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'
];

export default function DistributionPage() {
  const { currentFamilyId } = useAuthStore();
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  const { data: distribution = [], isLoading } = useQuery({
    queryKey: ['distribution', currentFamilyId],
    queryFn: () => trendApi.getDistribution(currentFamilyId!),
    enabled: !!currentFamilyId,
  });

  const totalItems = distribution.reduce((sum, loc) => sum + loc.itemCount, 0);

  // 计算饼图数据
  const pieData = distribution.slice(0, 9).map((loc, i) => ({
    ...loc,
    color: COLORS[i % COLORS.length],
    startAngle: distribution.slice(0, i).reduce((sum, d) => sum + (d.itemCount / totalItems) * 360, 0),
    endAngle: distribution.slice(0, i + 1).reduce((sum, d) => sum + (d.itemCount / totalItems) * 360, 0),
  }));

  const selectedData = selectedLocation
    ? distribution.find(d => d.locationPath === selectedLocation)
    : null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Link to="/" className="p-2 hover:bg-gray-100 rounded text-lg">←</Link>
        <h2 className="text-lg sm:text-xl font-bold">物品分布</h2>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : distribution.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">📍</div>
          <p className="text-gray-500">暂无物品分布数据</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 饼图 */}
          <div className="card">
            <h3 className="font-medium text-sm mb-3">位置分布</h3>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* 简化的饼图 */}
              <div className="relative w-40 h-40 flex-shrink-0">
                <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                  {pieData.map((item, i) => {
                    const percent = totalItems > 0 ? (item.itemCount / totalItems) * 100 : 0;
                    const dashArray = percent > 0 ? `${percent} ${100 - percent}` : '0 100';
                    const dashOffset = pieData.slice(0, i).reduce((sum, d) => {
                      return sum + (totalItems > 0 ? (d.itemCount / totalItems) * 100 : 0);
                    }, 0);
                    return (
                      <circle
                        key={item.locationPath}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke={item.color}
                        strokeWidth="20"
                        strokeDasharray={dashArray}
                        strokeDashoffset={dashOffset}
                        className="cursor-pointer transition-all hover:opacity-80"
                        onClick={() => setSelectedLocation(
                          selectedLocation === item.locationPath ? null : item.locationPath
                        )}
                      />
                    );
                  })}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalItems}</div>
                    <div className="text-xs text-gray-500">件物品</div>
                  </div>
                </div>
              </div>

              {/* 图例 */}
              <div className="flex-1 grid grid-cols-2 gap-2">
                {pieData.map((item) => (
                  <div
                    key={item.locationPath}
                    className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-all ${
                      selectedLocation === item.locationPath ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedLocation(
                      selectedLocation === item.locationPath ? null : item.locationPath
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs truncate">{item.locationPath}</div>
                      <div className="text-xs text-gray-500">
                        {item.itemCount}件 ({item.percent}%)
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 选中位置的物品列表 */}
          {selectedData && (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">{selectedData.locationPath}</h3>
                <button
                  onClick={() => setSelectedLocation(null)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  关闭
                </button>
              </div>
              <div className="space-y-2">
                {selectedData.items.map((item) => (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                  >
                    <span className="text-sm">{item.name}</span>
                    <span className="text-xs text-gray-500">x{item.quantity}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* 列表视图 */}
          <div className="card">
            <h3 className="font-medium text-sm mb-3">位置列表</h3>
            <div className="space-y-2">
              {distribution.map((loc, i) => (
                <div
                  key={loc.locationPath}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-all ${
                    selectedLocation === loc.locationPath ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedLocation(
                    selectedLocation === loc.locationPath ? null : loc.locationPath
                  )}
                >
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{loc.locationPath}</div>
                    <div className="text-xs text-gray-500">{loc.itemCount}件物品</div>
                  </div>
                  <div className="text-xs text-gray-400">{loc.percent}%</div>
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${loc.percent}%`, backgroundColor: COLORS[i % COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
