import { render, screen, waitFor, act } from '@testing-library/react';
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

  it('показывает ошибки валидации при слишком коротких полях', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <CreateReviewPage />
      </MemoryRouter>
    );

    const titleInput = screen.getByLabelText(/заголовок рецензии/i);
    const movieInput = screen.getByLabelText(/название фильма/i);
    const contentTextarea = screen.getByPlaceholderText('Введите текст рецензии...');

    await act(async () => {
      await user.type(titleInput, 'abc');
      await user.type(movieInput, 'film');
      await user.type(contentTextarea, 'короткий');
    });

    await waitFor(() => {
      const min5Errors = screen.getAllByText('Минимум 5 символов');
      expect(min5Errors).toHaveLength(2); // для title и movie_title
      expect(screen.getByText('Минимум 100 символов')).toBeInTheDocument();
    });
  });

  it('успешно отправляет форму → перенаправляет на страницу рецензии', async () => {
    const user = userEvent.setup();
    mockCreateReview.mockResolvedValueOnce({ id: 123 });

    render(
      <MemoryRouter>
        <CreateReviewPage />
      </MemoryRouter>
    );

    await act(async () => {
      await user.type(screen.getByLabelText(/заголовок рецензии/i), 'Отличный фильм 2025');
      await user.type(screen.getByLabelText(/название фильма/i), 'Dune: Part Three');

      const longText =
        'Это очень длинный и осмысленный текст рецензии, который должен пройти валидацию по длине и символам. '.repeat(
          3
        );
      await user.type(screen.getByPlaceholderText('Введите текст рецензии...'), longText);

      await user.click(screen.getByRole('button', { name: /отправить на модерацию/i }));
    });

    await waitFor(() => {
      expect(mockCreateReview).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith('/reviews/123');
    });
  });

  it('показывает серверную ошибку и не перенаправляет при неудаче', async () => {
    const user = userEvent.setup();
    mockCreateReview.mockRejectedValueOnce({ uiMessage: 'Ошибка сервера, попробуйте позже' });

    render(
      <MemoryRouter>
        <CreateReviewPage />
      </MemoryRouter>
    );

    await act(async () => {
      await user.type(screen.getByLabelText(/заголовок рецензии/i), 'Тестовая рецензия');
      await user.type(screen.getByLabelText(/название фильма/i), 'Тестовый фильм');

      const longText =
        'Достаточно длинный текст для прохождения валидации и теста отправки. '.repeat(4);
      await user.type(screen.getByPlaceholderText('Введите текст рецензии...'), longText);

      await user.click(screen.getByRole('button', { name: /отправить на модерацию/i }));
    });

    await waitFor(() => {
      expect(screen.getByText('Ошибка сервера, попробуйте позже')).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
