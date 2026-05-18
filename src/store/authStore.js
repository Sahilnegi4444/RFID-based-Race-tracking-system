import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isAuthenticated: false,
  user: null,
  login: (username, password) => {
    // Mock login
    if (username === 'admin' && password === 'admin') {
      set({ isAuthenticated: true, user: { username: 'Admin User', role: 'admin' } });
      return true;
    }
    return false;
  },
  logout: () => set({ isAuthenticated: false, user: null }),
}));

export default useAuthStore;
