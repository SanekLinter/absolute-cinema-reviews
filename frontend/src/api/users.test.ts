import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './index';
import { getUserById } from './users';
import type { User } from './types';

vi.mock('./index');

describe('users api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserById', () => {
    it('получает пользователя по ID', async () => {
      const mockUser: User = {
        id: 5,
        username: 'testuser',
        role: 'user',
      };

      vi.mocked(api.get).mockResolvedValue({
        data: mockUser,
      });

      const result = await getUserById(5);

      expect(api.get).toHaveBeenCalledWith('/users/5');
      expect(result).toEqual(mockUser);
    });

    it('получает admin пользователя', async () => {
      const mockAdmin: User = {
        id: 1,
        username: 'admin',
        role: 'admin',
      };

      vi.mocked(api.get).mockResolvedValue({
        data: mockAdmin,
      });

      const result = await getUserById(1);

      expect(api.get).toHaveBeenCalledWith('/users/1');
      expect(result).toEqual(mockAdmin);
    });

    it('обрабатывает ошибку 404 (пользователь не найден)', async () => {
      vi.mocked(api.get).mockRejectedValue({
        response: {
          status: 404,
          data: { message: 'Пользователь не найден' },
        },
      });

      await expect(getUserById(999)).rejects.toThrow();
    });

    it('обрабатывает сетевые ошибки', async () => {
      vi.mocked(api.get).mockRejectedValue(new Error('Network error'));

      await expect(getUserById(5)).rejects.toThrow('Network error');
    });

    it('обрабатывает ошибку авторизации (401)', async () => {
      vi.mocked(api.get).mockRejectedValue({
        response: {
          status: 401,
          data: { message: 'Не авторизован' },
        },
      });

      await expect(getUserById(5)).rejects.toThrow();
    });

    it('обрабатывает ошибку доступа (403)', async () => {
      vi.mocked(api.get).mockRejectedValue({
        response: {
          status: 403,
          data: { message: 'Доступ запрещен' },
        },
      });

      await expect(getUserById(5)).rejects.toThrow();
    });
  });
});
