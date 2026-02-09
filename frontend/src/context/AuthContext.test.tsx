import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, useMe } from './AuthContext';

// Моки должны быть идентичными реальным API
vi.mock('../api/auth', () => ({
  login: vi.fn(),
  register: vi.fn(),
  getMe: vi.fn(),
}));

import { login, register, getMe } from '../api/auth';

describe('AuthContext - Module Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Мокаем только методы localStorage, которые использует контекст
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
  });

  // Тест 1: Базовое состояние (ИСПРАВЛЕНО)
  describe('initial state', () => {
    it('верное базовое состояние', async () => {
      // Убедимся, что нет токена при инициализации
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Ждем завершения инициализации
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
    });
  });

  describe('login function', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
    });

    it('successfully logs in and updates state', async () => {
      const mockToken = 'test-token';
      const mockUser = { id: 1, username: 'testuser' };

      vi.mocked(login).mockResolvedValue({ token: mockToken });
      vi.mocked(getMe).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Ждем завершения инициализации
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Изначальное состояние
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();

      // Выполняем логин
      await act(async () => {
        await result.current.login('testuser', 'password');
      });

      // Проверяем вызовы API
      expect(login).toHaveBeenCalledWith('testuser', 'password');
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(getMe).toHaveBeenCalled();

      // Проверяем обновление состояния
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });

    it('handles login API error', async () => {
      vi.mocked(login).mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Ждем завершения инициализации
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await expect(
        act(async () => {
          await result.current.login('testuser', 'wrongpassword');
        })
      ).rejects.toThrow('Login failed');

      expect(localStorage.setItem).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('register function', () => {
    beforeEach(() => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);
    });

    it('successfully registers and logs in user', async () => {
      const mockToken = 'reg-token';
      const mockUser = { id: 2, username: 'newuser' };

      vi.mocked(register).mockResolvedValue({ token: mockToken });
      vi.mocked(getMe).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Ждем завершения инициализации
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.register('newuser', 'password123');
      });

      expect(register).toHaveBeenCalledWith('newuser', 'password123');
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
    });
  });

  describe('logout function', () => {
    it('clears user state and removes token', async () => {
      // Настраиваем состояние "авторизованный пользователь"
      vi.mocked(localStorage.getItem).mockReturnValue('existing-token');
      vi.mocked(getMe).mockResolvedValue({ id: 1, username: 'existing' });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Ждем завершения инициализации
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({ id: 1, username: 'existing' });

      // Выполняем логаут
      act(() => {
        result.current.logout();
      });

      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('initialization', () => {
    it('loads user from token on mount', async () => {
      const mockUser = { id: 1, username: 'persisted' };
      vi.mocked(localStorage.getItem).mockReturnValue('persisted-token');
      vi.mocked(getMe).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
        expect(result.current.isAuthenticated).toBe(true);
        expect(result.current.user).toEqual(mockUser);
      });

      expect(getMe).toHaveBeenCalled();
    });

    it('does nothing when no token exists', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(getMe).not.toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('hook errors', () => {
    it('throws error when useAuth is used without provider', () => {
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within AuthProvider');

      console.error = originalError;
    });

    it('useMe returns user when authenticated', async () => {
      vi.mocked(localStorage.getItem).mockReturnValue('token');
      vi.mocked(getMe).mockResolvedValue({ id: 1, username: 'me' });

      const { result } = renderHook(() => useMe(), {
        wrapper: AuthProvider,
      });

      await waitFor(() => {
        expect(result.current).not.toBeNull();
      });

      expect(result.current).toEqual({ id: 1, username: 'me' });
    });
  });
});
