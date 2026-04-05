import { create } from 'zustand';

/**
 * 离线状态管理
 * 跟踪网络状态和待同步操作
 */
interface OfflineState {
  isOnline: boolean;
  pendingMutations: number;
  lastSyncTime: string | null;
  setOnline: (online: boolean) => void;
  setPendingMutations: (count: number) => void;
  setLastSyncTime: (time: string) => void;
  incrementPending: () => void;
  decrementPending: () => void;
}

export const useOfflineStore = create<OfflineState>((set) => ({
  isOnline: navigator.onLine,
  pendingMutations: 0,
  lastSyncTime: null,

  setOnline: (online) => set({ isOnline: online }),

  setPendingMutations: (count) => set({ pendingMutations: count }),

  setLastSyncTime: (time) => set({ lastSyncTime: time }),

  incrementPending: () => set((state) => ({
    pendingMutations: state.pendingMutations + 1
  })),

  decrementPending: () => set((state) => ({
    pendingMutations: Math.max(0, state.pendingMutations - 1)
  })),
}));

// 监听网络状态变化
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnline(true);
  });

  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnline(false);
  });
}