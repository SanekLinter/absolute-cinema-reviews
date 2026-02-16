import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { CreateReviewPage } from './index';
import * as reviewsApi from '../../api/reviews';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../api/reviews', () => ({
  createReview: vi.fn(),
}));

describe('CreateReviewPage', () => {
  const mockCreateReview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reviewsApi.createReview).mockImplementation(mockCreateReview);
  });

  it('рендерит форму создания рецензии', () => {
    render(
      <MemoryRouter>
        <CreateReviewPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Новая рецензия')).toBeInTheDocument();
    expect(screen.getByLabelText(/заголовок рецензии/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/название фильма/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Введите текст рецензии...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /отправить на модерацию/i })).toBeInTheDocument();
  });

  // BOUNDARY VALUE ANALYSIS - TITLE
  describe('Граничные условия поля title', () => {
    const cases = [
      { value: 'abcd', valid: false }, // 4
      { value: 'abcde', valid: true }, // 5
      { value: 'a'.repeat(50), valid: true },
      { value: 'a'.repeat(100), valid: true },
      { value: 'a'.repeat(101), valid: false }, // 101
    ];

    it.each(cases)('title length: $value', async ({ value, valid }) => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <CreateReviewPage />
        </MemoryRouter>
      );

      const input = screen.getByLabelText(/заголовок рецензии/i);

      await user.type(input, value);
      await user.tab();

      if (!valid) {
        expect(await screen.findByText(/символ/)).toBeInTheDocument();
      }
    });
  });

  // BOUNDARY VALUE ANALYSIS - CONTENT
  describe('Граничные условия поля Content', () => {
    const cases = [
      { value: 'a'.repeat(99), valid: false },
      { value: 'a'.repeat(100), valid: true },
      { value: 'a'.repeat(1000), valid: true },
      { value: 'a'.repeat(5000), valid: true },
      { value: 'a'.repeat(5001), valid: false },
    ];

    it.each(cases)('content length test (length: $value.length)', async ({ value, valid }) => {
      render(
        <MemoryRouter>
          <CreateReviewPage />
        </MemoryRouter>
      );

      const textarea = screen.getByPlaceholderText(/введите текст рецензии/i);

      fireEvent.change(textarea, {
        target: { value },
      });

      fireEvent.blur(textarea);

      if (!valid) {
        expect(await screen.findByText(/символ/i)).toBeInTheDocument();
      } else {
        expect(screen.queryByText(/символ/i)).not.toBeInTheDocument();
      }
    });
  });

  // EQUIVALENCE CLASSES
  it('Не принимает невалидные символы (emoji) для поля title', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CreateReviewPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/заголовок рецензии/i);

    await user.type(input, 'Тест😊');
    await user.tab();

    expect(await screen.findByText(/только кириллица, латиница/i)).toBeInTheDocument();
  });

  it('Принимает кириллица + латиница + цифры в поле title', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <CreateReviewPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText(/заголовок рецензии/i);

    await user.type(input, 'Фильм 2024: Test!');
    await user.tab();

    expect(screen.queryByText(/только кириллица/i)).not.toBeInTheDocument();
  });

  // SUCCESS CASE
  it('успешно отправляет форму и делает редирект', async () => {
    const user = userEvent.setup();

    vi.mocked(reviewsApi.createReview).mockResolvedValue({
      id: 123,
    } as any);

    render(
      <MemoryRouter>
        <CreateReviewPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/заголовок/i), 'Valid title');
    await user.type(screen.getByLabelText(/название фильма/i), 'Valid movie');
    await user.type(screen.getByPlaceholderText(/введите текст рецензии/i), 'a'.repeat(120));

    await user.click(screen.getByRole('button', { name: /отправить/i }));

    await waitFor(() => {
      expect(reviewsApi.createReview).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalled();
    });
  });

  // SERVER ERROR
  it('показывает серверную ошибку', async () => {
    const user = userEvent.setup();

    vi.mocked(reviewsApi.createReview).mockRejectedValue({
      uiMessage: 'Ошибка сервера',
    });

    render(
      <MemoryRouter>
        <CreateReviewPage />
      </MemoryRouter>
    );

    await user.type(screen.getByLabelText(/заголовок/i), 'Valid title');
    await user.type(screen.getByLabelText(/название фильма/i), 'Valid movie');
    await user.type(screen.getByPlaceholderText(/введите текст рецензии/i), 'a'.repeat(120));

    await user.click(screen.getByRole('button', { name: /отправить/i }));

    expect(await screen.findByText('Ошибка сервера')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
