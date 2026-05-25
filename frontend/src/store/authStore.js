import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  isAuthenticated: localStorage.getItem('auth_token') === 'true',
  user: JSON.parse(localStorage.getItem('auth_user')) || null,
  login: (userData) => {
    localStorage.setItem('auth_token', 'true');
    localStorage.setItem('auth_user', JSON.stringify(userData));
    set({ isAuthenticated: true, user: userData });
  },
  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    set({ isAuthenticated: false, user: null });
  },
  updateOnboarding: (data) => {
    set((state) => {
      const newUser = { ...state.user, ...data };
      localStorage.setItem('auth_user', JSON.stringify(newUser));
      return { user: newUser };
    });
  }
}));
