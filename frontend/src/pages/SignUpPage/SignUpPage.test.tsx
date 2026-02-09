import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { SignUpPage } from './index';
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

describe('SignUpPage', () => {
  const mockRegister = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      register: mockRegister,
    } as any);
  });

  it('рендерит форму регистрации', () => {
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText(/логин/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
  });

  it('показывает ошибку валидации при слишком коротком username', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SignUpPage />
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

  it('успешная регистрация → перенаправление на главную', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/логин/i), 'validuser123');
    await user.type(screen.getByLabelText(/пароль/i), 'Password123!');

    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(
      () => {
        expect(mockRegister).toHaveBeenCalledWith('validuser123', 'Password123!');
        expect(mockNavigate).toHaveBeenCalledWith('/');
      },
      { timeout: 1500 }
    );
  });

  it('показывает серверную ошибку при неудачной регистрации', async () => {
    mockRegister.mockRejectedValueOnce({ uiMessage: 'Пользователь уже существует' });

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/логин/i), 'existinguser');
    await user.type(screen.getByLabelText(/пароль/i), 'ValidPass123!');

    await user.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    await waitFor(
      () => {
        expect(screen.getByText('Пользователь уже существует')).toBeInTheDocument();
      },
      { timeout: 1500 }
    );

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
