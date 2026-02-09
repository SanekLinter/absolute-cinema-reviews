import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUseAuth = vi.fn();
const mockUseNavigate = vi.fn();
const mockLogout = vi.fn();

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockUseNavigate,
    Link: ({ to, children }: any) => <a href={to}>{children}</a>,
  };
});

vi.mock('../../Button', () => ({
  Button: ({ onClick, children }: any) => <button onClick={onClick}>{children}</button>,
  LinkButton: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('./index.module.scss', () => ({
  default: {
    navbar: 'navbar',
    left: 'left',
    right: 'right',
    link: 'link',
    username: 'username',
  },
}));

import { Navbar } from './index';

describe('Navbar (модульный тест)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('показывает ссылки на Вход и Регистрация если не авторизован', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: mockLogout,
    });

    render(<Navbar />);

    expect(screen.getByText('Вход')).toBeInTheDocument();
    expect(screen.getByText('Регистрация')).toBeInTheDocument();
  });

  it('показывает username и кнопку Выйти для обычного пользователя', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'test', role: 'user' },
      isAuthenticated: true,
      logout: mockLogout,
    });

    render(<Navbar />);

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('Выйти')).toBeInTheDocument();
  });

  it('не показывает админскую ссылку для обычного пользователя', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'test', role: 'user' },
      isAuthenticated: true,
      logout: mockLogout,
    });

    render(<Navbar />);

    expect(screen.queryByText('Рецензии на модерации')).not.toBeInTheDocument();
  });

  it('показывает админскую ссылку для admin', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'admin', role: 'admin' },
      isAuthenticated: true,
      logout: mockLogout,
    });

    render(<Navbar />);

    expect(screen.getByText('Рецензии на модерации')).toBeInTheDocument();
  });

  it('вызывает logout и navigate при клике Выйти', () => {
    mockUseAuth.mockReturnValue({
      user: { username: 'test', role: 'user' },
      isAuthenticated: true,
      logout: mockLogout,
    });

    render(<Navbar />);

    fireEvent.click(screen.getByText('Выйти'));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockUseNavigate).toHaveBeenCalledWith('/sign-in', { replace: true });
  });
});
