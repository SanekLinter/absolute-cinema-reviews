import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SignInPage } from './index';
import * as AuthContext from '../../context/AuthContext';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../context/AuthContext', () => ({
  ...vi.importActual('../../context/AuthContext'),
  useAuth: vi.fn(),
}));

describe('SignInPage', () => {
  const mockLogin = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      login: mockLogin,
    } as any);
  });

  it('рендерит форму входа', () => {
    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/логин/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /войти/i })).toBeInTheDocument();
  });

  it('показывает ошибку валидации при слишком коротком username', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );

    const usernameInput = screen.getByLabelText(/логин/i);
    await user.type(usernameInput, 'abc');
    await user.tab();

    await waitFor(
      () => {
        expect(screen.getByText('Минимум 4 символа')).toBeInTheDocument();
      },
      { timeout: 1500 }
    );
  });

  it('успешный вход → перенаправление на главную', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/логин/i), 'validuser123');
    await user.type(screen.getByLabelText(/пароль/i), 'Password123!');

    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(
      () => {
        expect(mockLogin).toHaveBeenCalledWith('validuser123', 'Password123!');
        expect(mockNavigate).toHaveBeenCalledWith('/');
      },
      { timeout: 1500 }
    );
  });

  it('показывает серверную ошибку при неудачном входе', async () => {
    mockLogin.mockRejectedValueOnce({ uiMessage: 'Неверный логин или пароль' });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SignInPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/логин/i), 'wronguser');
    await user.type(screen.getByLabelText(/пароль/i), 'WrongPass123!');

    await user.click(screen.getByRole('button', { name: /войти/i }));

    await waitFor(
      () => {
        expect(screen.getByText('Неверный логин или пароль')).toBeInTheDocument();
      },
      { timeout: 1500 }
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
