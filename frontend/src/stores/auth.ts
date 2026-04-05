import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  currentFamilyId: number | null;
  kickedMessage: string | null;
  setAuth: (token: string, user: User) => void;
  setCurrentFamilyId: (familyId: number | null) => void;
  logout: () => void;
  setKickedMessage: (message: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      currentFamilyId: null,
      kickedMessage: null,
      setAuth: (token, user) => set({ token, user, kickedMessage: null }),
      setCurrentFamilyId: (familyId) => set({ currentFamilyId: familyId }),
      logout: () => set({ token: null, user: null, currentFamilyId: null, kickedMessage: null }),
      setKickedMessage: (message) => set({ kickedMessage: message }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        currentFamilyId: state.currentFamilyId,
      }),
    }
  )
);
