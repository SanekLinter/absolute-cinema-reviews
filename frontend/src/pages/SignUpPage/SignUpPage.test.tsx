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

function renderPage() {
  return render(
    <MemoryRouter>
      <SignUpPage />
    </MemoryRouter>
  );
}

describe('SignUpPage', () => {
  const mockRegister = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(AuthContext.useAuth).mockReturnValue({
      register: mockRegister,
    } as any);
  });

  it('рендерит форму регистрации', () => {
    renderPage();

    expect(screen.getByLabelText(/логин/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/пароль/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
  });

  describe('граничные условия поля username', () => {
    const cases = [
      { value: 'abc', valid: false }, // 3
      { value: 'abcd', valid: true }, // 4
      { value: 'abcdefghij', valid: true }, // mid
      { value: 'a'.repeat(20), valid: true }, // 20
      { value: 'a'.repeat(21), valid: false }, // 21
    ];

    it.each(cases)('username length: $value', async ({ value, valid }) => {
      const user = userEvent.setup();

      renderPage();

      const input = screen.getByLabelText(/логин/i);

      await user.type(input, value);
      await user.tab();

      if (!valid) {
        await waitFor(() => {
          expect(screen.getByText(/символ/)).toBeInTheDocument();
        });
      } else {
        await waitFor(() => {
          expect(screen.queryByText(/символ/)).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('граничные условия поля Password', () => {
    const cases = [
      { value: '1234567', valid: false }, // 7
      { value: '12345678', valid: true }, // 8
      { value: 'Password12', valid: true }, // mid
      { value: 'a'.repeat(16), valid: true }, // 16
      { value: 'a'.repeat(17), valid: false }, // 17
    ];

    it.each(cases)('password length: $value', async ({ value, valid }) => {
      const user = userEvent.setup();

      renderPage();

      const input = screen.getByLabelText(/пароль/i);

      await user.type(input, value);
      await user.tab();

      if (!valid) {
        await waitFor(() => {
          expect(screen.getByText(/символ/)).toBeInTheDocument();
        });
      }
    });
  });

  // EQUIVALENCE CLASSES

  describe('Username character validation', () => {
    it('не принимает невалидный username', async () => {
      const user = userEvent.setup();

      renderPage();

      const input = screen.getByLabelText(/логин/i);

      await user.type(input, 'user!');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Только латиница и цифры')).toBeInTheDocument();
      });
    });

    it('принмимает валидный username', async () => {
      const user = userEvent.setup();

      renderPage();
      const input = screen.getByLabelText(/логин/i);

      await user.type(input, 'user123');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText('Только латиница и цифры')).not.toBeInTheDocument();
      });
    });
  });

  it('успешная регистрация → перенаправление на главную', async () => {
    const user = userEvent.setup();
    renderPage();

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
    renderPage();

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
