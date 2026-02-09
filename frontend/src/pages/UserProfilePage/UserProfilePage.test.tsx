import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { UserProfilePage } from './index';
import * as apiUsers from '../../api/users';

vi.mock('./index.module.scss', () => ({
  default: {},
}));

vi.mock('../../components/ReviewFeed', () => ({
  ReviewFeed: ({ authorId }: { authorId: number }) => <div>ReviewFeed {authorId}</div>,
}));

vi.mock('../../components/Spinner', () => ({
  Spinner: () => <div>Loading...</div>,
}));

vi.mock('../../components/Alert', () => ({
  Alert: ({ children }: any) => <div>Alert: {children}</div>,
}));

vi.mock('../../api/users', () => ({
  getUserById: vi.fn(),
}));

describe('UserProfilePage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('показывает спиннер при загрузке', () => {
    render(
      <MemoryRouter initialEntries={['/user/1']}>
        <Routes>
          <Route path="/user/:userId" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('рендерит данные пользователя после успешного запроса', async () => {
    const mockUser = { id: 1, username: 'testuser' };
    vi.mocked(apiUsers.getUserById).mockResolvedValueOnce(mockUser);

    render(
      <MemoryRouter initialEntries={['/user/1']}>
        <Routes>
          <Route path="/user/:userId" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(mockUser.username)).toBeInTheDocument();

    expect(screen.getByText(/Рецензии пользователя/i)).toBeInTheDocument();
    expect(screen.getByText(`ReviewFeed ${mockUser.id}`)).toBeInTheDocument();
  });

  it('показывает ошибку при некорректном userId', async () => {
    render(
      <MemoryRouter initialEntries={['/user/abc']}>
        <Routes>
          <Route path="/user/:userId" element={<UserProfilePage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText(/Некорректный id пользователя/i)).toBeInTheDocument();
  });
});
