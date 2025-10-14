import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { jwtDecode } from 'jwt-decode';
import type { User } from '@/types';
import api from '@/services/api';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(null);

  const isAuthenticated = computed(() => !!user.value && !!token.value);

  function loadFromStorage() {
    const storedToken = localStorage.getItem('auth_token');
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        if (decoded.exp * 1000 > Date.now()) {
          token.value = storedToken;
          user.value = {
            id: decoded.sub || decoded.userId,
            email: decoded.email,
            name: decoded.name,
            token: storedToken,
          };
        } else {
          logout();
        }
      } catch (error) {
        logout();
      }
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await api.login(email, password);
      token.value = response.token;
      user.value = {
        ...response.user,
        token: response.token,
      };
      localStorage.setItem('auth_token', response.token);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  function logout() {
    user.value = null;
    token.value = null;
    localStorage.removeItem('auth_token');
  }

  return {
    user,
    token,
    isAuthenticated,
    loadFromStorage,
    login,
    logout,
  };
});
