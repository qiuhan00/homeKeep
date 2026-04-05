import { useEffect } from 'react';
import { useOfflineStore } from '../stores/offlineStore';
import { offlineQueue } from '../services/offlineQueue';

/**
 * 离线指示器组件
 * 显示当前网络状态和待同步操作数量
 */
export default function OfflineIndicator() {
  const { isOnline, pendingMutations } = useOfflineStore();

  // 初始化时更新待同步数量
  useEffect(() => {
    offlineQueue.getPendingCount().then((count) => {
      useOfflineStore.getState().setPendingMutations(count);
    });
  }, []);

  // 如果在线且没有待同步操作，不显示
  if (isOnline && pendingMutations === 0) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-sm transition-all ${
        isOnline
          ? 'bg-orange-100 text-orange-700 border border-orange-300'
          : 'bg-gray-800 text-white'
      }`}
    >
      {/* 状态图标 */}
      <span className="text-base">
        {isOnline ? '🔄' : '📴'}
      </span>

      {/* 状态文字 */}
      <span className="font-medium">
        {!isOnline
          ? '离线模式'
          : pendingMutations > 0
          ? `同步中 (${pendingMutations})`
          : ''}
      </span>

      {/* 同步按钮（仅在线且有待同步时显示） */}
      {isOnline && pendingMutations > 0 && (
        <button
          onClick={() => offlineQueue.syncAll()}
          className="ml-1 px-2 py-0.5 bg-orange-500 text-white rounded-full text-xs hover:bg-orange-600 transition-colors"
        >
          同步
        </button>
      )}
    </div>
  );
}