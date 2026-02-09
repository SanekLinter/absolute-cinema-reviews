import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './index';
import { register, login, getMe } from './auth';

vi.mock('./index');

describe('auth api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('register', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { access_token: '123' },
    } as any);

    const res = await register('u', 'p');

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      username: 'u',
      password: 'p',
    });

    expect(res.token).toBe('123');
  });

  it('login', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { access_token: '321' },
    } as any);

    const res = await login('u', 'p');

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      username: 'u',
      password: 'p',
    });

    expect(res.token).toBe('321');
  });

  it('getMe', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { id: 1 },
    } as any);

    const res = await getMe();

    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(res).toEqual({ id: 1 });
  });
});
