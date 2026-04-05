import { create } from 'zustand';

interface AppState {
  isSidebarOpen: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  setIsMobile: (isMobile: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isSidebarOpen: true,
  isMobile: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setIsMobile: (isMobile) => set({ isMobile, isSidebarOpen: !isMobile }),
}));
