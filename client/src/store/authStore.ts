import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email?: string;
  role: 'admin' | 'faculty' | 'student';
  section?: string;
  year?: string;
  avatar?: string;
  [key: string]: any;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (userData: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (userData) => set({ user: userData, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      updateUser: (userData) => set((state) => ({ user: state.user ? { ...state.user, ...userData } : null })),
    }),
    {
      name: 'csehub-auth',
    }
  )
);

export default useAuthStore;
