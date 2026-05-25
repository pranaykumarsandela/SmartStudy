import { create } from 'zustand';
import api from '../lib/api';

export const useUserStore = create((set, get) => ({
  user: null,
  profile: null,
  sessions: [],
  notifications: [],
  isLoading: true,
  isAuthenticated: false,
  isAddSessionModalOpen: false,

  setAddSessionModalOpen: (isOpen) => set({ isAddSessionModalOpen: isOpen }),

  initialize: async () => {
    set({ isLoading: true });
    
    const token = localStorage.getItem('study_smart_token');
    if (token) {
      try {
        const { data } = await api.get('/auth/me');
        set({ user: { id: data._id, email: data.email }, profile: data, isAuthenticated: true });
        await get().fetchSessions();
        // await get().fetchNotifications(); // Assuming notifications aren't migrated yet
      } catch (error) {
        console.error('Session expired or invalid', error);
        localStorage.removeItem('study_smart_token');
        set({ user: null, profile: null, isAuthenticated: false });
      }
    }
    set({ isLoading: false });
  },

  login: async (email, password) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('study_smart_token', data.token);
      set({ user: { id: data.user._id, email: data.user.email }, profile: data.user, isAuthenticated: true });
      await get().fetchSessions();
      return data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      if (window.addGlobalToast) window.addGlobalToast(message, 'error');
      throw new Error(message);
    }
  },

  register: async (data) => {
    try {
      const { data: responseData } = await api.post('/auth/register', data);
      localStorage.setItem('study_smart_token', responseData.token);
      set({ user: { id: responseData.user._id, email: responseData.user.email }, profile: responseData.user, isAuthenticated: true, sessions: [], notifications: [] });
      await get().fetchSessions();
      return responseData;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      if (window.addGlobalToast) window.addGlobalToast(message, 'error');
      throw new Error(message);
    }
  },

  loginWithGoogle: async (credential) => {
    try {
      const { data } = await api.post('/auth/google', { credential });
      localStorage.setItem('study_smart_token', data.token);
      set({ user: { id: data.user._id, email: data.user.email }, profile: data.user, isAuthenticated: true, sessions: [], notifications: [] });
      await get().fetchSessions();
      return data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      if (window.addGlobalToast) window.addGlobalToast(message, 'error');
      throw new Error(message);
    }
  },

  forgotPassword: async (email) => {
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      return data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const { data } = await api.post('/auth/reset-password', { token, newPassword });
      return data;
    } catch (error) {
      const message = error.response?.data?.error || error.message;
      throw new Error(message);
    }
  },

  logout: async () => {
    localStorage.removeItem('study_smart_token');
    set({ user: null, profile: null, sessions: [], notifications: [], isAuthenticated: false });
    localStorage.removeItem('theme'); // Optional reset
  },

  updateProfile: async (updates) => {
    try {
      const { data } = await api.put('/users/profile', updates);
      set({ profile: data });
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update profile';
      if (window.addGlobalToast) window.addGlobalToast(message, 'error');
      throw new Error(message);
    }
  },

  fetchSessions: async () => {
    try {
      const { data } = await api.get('/users/sessions');
      set({ sessions: data });
    } catch (error) {
      console.error(error);
    }
  },

  addSession: async (sessionData) => {
    try {
      const { data } = await api.post('/users/sessions', sessionData);
      set((state) => ({ sessions: [...state.sessions, data] }));
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to add session';
      if (window.addGlobalToast) window.addGlobalToast(message, 'error');
      throw new Error(message);
    }
  },

  updateSession: async (id, updates) => {
    try {
      const { data } = await api.put(`/users/sessions/${id}`, updates);
      set((state) => ({
        sessions: state.sessions.map((s) => (s._id === id ? data : s)),
      }));
      return data;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update session';
      if (window.addGlobalToast) window.addGlobalToast(message, 'error');
      throw new Error(message);
    }
  },

  deleteSession: async (id) => {
    try {
      await api.delete(`/users/sessions/${id}`);
      set((state) => ({
        sessions: state.sessions.filter((s) => s._id !== id),
      }));
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete session';
      if (window.addGlobalToast) window.addGlobalToast(message, 'error');
      throw new Error(message);
    }
  },

  clearAllSessions: async () => {
    try {
      await api.delete('/users/sessions');
      set({ sessions: [] });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to clear sessions';
      if (window.addGlobalToast) window.addGlobalToast(message, 'error');
      throw new Error(message);
    }
  },

  subscribeToPush: async (subscription) => {
    try {
      await api.post('/users/push/subscribe', { subscription });
    } catch (error) {
      console.error('Failed to save push subscription', error);
      throw error;
    }
  },



  deleteAccount: async () => {
    try {
      await api.delete('/users/account');
      localStorage.removeItem('study_smart_token');
      set({ profile: null, sessions: [], notifications: [], token: null });
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to delete account';
      if (window.addGlobalToast) window.addGlobalToast(message, 'error');
      throw new Error(message);
    }
  },

  uploadSyllabus: async (file) => {
    try {
      const formData = new FormData();
      formData.append('syllabus', file);
      
      const response = await api.post('/ai/upload-syllabus', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const newSyllabus = response.data.syllabus;
      set((state) => ({
        profile: { ...state.profile, syllabus: newSyllabus }
      }));
      
      if (window.addGlobalToast) window.addGlobalToast('Syllabus scanned successfully!', 'success');
      return newSyllabus;
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to process syllabus';
      if (window.addGlobalToast) window.addGlobalToast(message, 'error');
      throw new Error(message);
    }
  },

  fetchNotifications: async () => {
    // Legacy placeholder, can implement similarly later
    set({ notifications: [] });
  }
}));
