import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EditReviewPage } from './index';
import * as reviewsApi from '../../api/reviews';
import * as AuthContext from '../../context/AuthContext';
import type { User } from '../../api/types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: vi.fn(() => ({ reviewId: '42' })),
  };
});

vi.mock('../../api/reviews', () => ({
  getReviewById: vi.fn(),
  updateReview: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  ...vi.importActual('../../context/AuthContext'),
  useMe: vi.fn(),
}));

const mockCurrentUser: User = {
  id: 10,
  username: 'testuser',
  role: 'user',
};

const mockAnotherUser: User = {
  id: 999,
  username: 'another',
  role: 'user',
};

const mockReview = {
  id: 42,
  title: 'Старый заголовок',
  movie_title: 'Старый фильм',
  content: 'Старый длинный текст рецензии, который уже больше 100 символов. '.repeat(4),
  author: { id: 10 },
};

async function userAct(user: ReturnType<typeof userEvent.setup>, fn: () => Promise<void>) {
  await act(async () => {
    await fn();
  });
}

describe('EditReviewPage', () => {
  const mockGetReviewById = vi.fn();
  const mockUpdateReview = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(reviewsApi.getReviewById).mockImplementation(mockGetReviewById);
    vi.mocked(reviewsApi.updateReview).mockImplementation(mockUpdateReview);

    vi.mocked(AuthContext.useMe).mockReturnValue(mockCurrentUser);
  });

  it('показывает спиннер при загрузке рецензии', async () => {
    mockGetReviewById.mockImplementation(() => new Promise(() => {})); // зависание

    render(
      <MemoryRouter initialEntries={['/reviews/42/edit']}>
        <Routes>
          <Route path="/reviews/:reviewId/edit" element={<EditReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      const spinner = document.querySelector('[class*="_spinner"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('показывает ошибку, если рецензия не найдена или нет прав', async () => {
    mockGetReviewById.mockRejectedValueOnce({ uiMessage: 'Рецензия не найдена' });

    render(
      <MemoryRouter initialEntries={['/reviews/42/edit']}>
        <Routes>
          <Route path="/reviews/:reviewId/edit" element={<EditReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Рецензия не найдена')).toBeInTheDocument();
    });
  });

  it('показывает ошибку, если пользователь не автор рецензии', async () => {
    vi.mocked(AuthContext.useMe).mockReturnValue(mockAnotherUser);

    mockGetReviewById.mockResolvedValueOnce(mockReview);

    render(
      <MemoryRouter initialEntries={['/reviews/42/edit']}>
        <Routes>
          <Route path="/reviews/:reviewId/edit" element={<EditReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(
        screen.getByText('У вас нет прав на редактирование этой рецензии')
      ).toBeInTheDocument();
    });
  });

  it('предзаполняет форму данными рецензии и позволяет редактировать', async () => {
    const user = userEvent.setup();

    mockGetReviewById.mockResolvedValueOnce(mockReview);

    render(
      <MemoryRouter initialEntries={['/reviews/42/edit']}>
        <Routes>
          <Route path="/reviews/:reviewId/edit" element={<EditReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Старый заголовок')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Старый фильм')).toBeInTheDocument();
    });

    const contentTextarea = screen.getByRole('textbox', { name: '' });
    const initialLength = mockReview.content.length;

    await userAct(user, async () => {
      await user.type(contentTextarea, ' Дополнение!!!');
    });

    await waitFor(() => {
      const expectedLength = initialLength + ' Дополнение!!!'.length;
      expect(screen.getByText(`${expectedLength} / 5000`)).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Старый заголовок');
    await userAct(user, async () => {
      await user.clear(titleInput);
      await user.type(titleInput, 'Новый заголовок 2026');
    });
  });

  it('успешно обновляет рецензию и перенаправляет', async () => {
    const user = userEvent.setup();

    mockGetReviewById.mockResolvedValueOnce(mockReview);
    mockUpdateReview.mockResolvedValueOnce({ id: 42 });

    render(
      <MemoryRouter initialEntries={['/reviews/42/edit']}>
        <Routes>
          <Route path="/reviews/:reviewId/edit" element={<EditReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Старый заголовок')).toBeInTheDocument();
    });

    await userAct(user, async () => {
      await user.clear(screen.getByLabelText(/заголовок рецензии/i));
      await user.type(screen.getByLabelText(/заголовок рецензии/i), 'Обновлённый заголовок');

      await user.clear(screen.getByLabelText(/название фильма/i));
      await user.type(screen.getByLabelText(/название фильма/i), 'Обновлённый фильм');

      await user.click(screen.getByRole('button', { name: /отправить на модерацию/i }));
    });

    await waitFor(() => {
      expect(mockUpdateReview).toHaveBeenCalledWith(
        42,
        'Обновлённый заголовок',
        'Обновлённый фильм',
        expect.any(String)
      );
      expect(mockNavigate).toHaveBeenCalledWith('/reviews/42');
    });
  });

  it('показывает серверную ошибку при неудачном обновлении', async () => {
    const user = userEvent.setup();

    mockGetReviewById.mockResolvedValueOnce(mockReview);
    mockUpdateReview.mockRejectedValueOnce({ uiMessage: 'Не удалось обновить' });

    render(
      <MemoryRouter initialEntries={['/reviews/42/edit']}>
        <Routes>
          <Route path="/reviews/:reviewId/edit" element={<EditReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Ждём появления кнопки "Отправить на модерацию"
    const submitButton = await screen.findByRole('button', {
      name: /отправить на модерацию/i,
    });

    // Клик через act
    await act(async () => {
      await user.click(submitButton);
    });

    // Ждём появления ошибки
    await waitFor(() => {
      expect(screen.getByText('Не удалось обновить')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
