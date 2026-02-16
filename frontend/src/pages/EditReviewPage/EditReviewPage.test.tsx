import { render, screen, waitFor } from '@testing-library/react';
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

const mockCurrentUser: User = { id: 10, username: 'testuser', role: 'user' };
const mockAnotherUser: User = { id: 999, username: 'another', role: 'user' };

const mockReview = {
  id: 42,
  title: 'Старый заголовок',
  movie_title: 'Старый фильм',
  content: 'Старый длинный текст рецензии, который уже больше 100 символов. '.repeat(4),
  author: { id: 10 },
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/reviews/42/edit']}>
      <Routes>
        <Route path="/reviews/:reviewId/edit" element={<EditReviewPage />} />
      </Routes>
    </MemoryRouter>
  );
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
    mockGetReviewById.mockImplementation(() => new Promise(() => {}));

    renderPage();

    await waitFor(() => {
      const spinner = document.querySelector('[class*="_spinner"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  it('показывает ошибку, если рецензия не найдена', async () => {
    mockGetReviewById.mockRejectedValueOnce({ uiMessage: 'Рецензия не найдена' });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Рецензия не найдена')).toBeInTheDocument();
    });
  });

  it('показывает ошибку, если пользователь не автор рецензии', async () => {
    vi.mocked(AuthContext.useMe).mockReturnValue(mockAnotherUser);
    mockGetReviewById.mockResolvedValueOnce(mockReview);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByText('У вас нет прав на редактирование этой рецензии')
      ).toBeInTheDocument();
    });
  });

  it('предзаполняет форму данными рецензии и позволяет редактировать', async () => {
    const user = userEvent.setup();
    mockGetReviewById.mockResolvedValueOnce(mockReview);

    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Старый заголовок')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Старый фильм')).toBeInTheDocument();
    });

    const contentTextarea = screen.getByLabelText(/текст рецензии/i);
    const initialLength = mockReview.content.length;

    await user.type(contentTextarea, ' Дополнение!!!');

    await waitFor(() => {
      const expectedLength = initialLength + ' Дополнение!!!'.length;
      expect(screen.getByText(`${expectedLength} / 5000`)).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Старый заголовок');
    await user.clear(titleInput);
    await user.type(titleInput, 'Новый заголовок 2026');
  });

  it('успешно обновляет рецензию и перенаправляет', async () => {
    const user = userEvent.setup();
    mockGetReviewById.mockResolvedValueOnce(mockReview);
    mockUpdateReview.mockResolvedValueOnce({ id: 42 });

    renderPage();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Старый заголовок')).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/заголовок рецензии/i));
    await user.type(screen.getByLabelText(/заголовок рецензии/i), 'Обновлённый заголовок');

    await user.clear(screen.getByLabelText(/название фильма/i));
    await user.type(screen.getByLabelText(/название фильма/i), 'Обновлённый фильм');

    await user.click(screen.getByRole('button', { name: /отправить на модерацию/i }));

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

    renderPage();

    const submitButton = await screen.findByRole('button', {
      name: /отправить на модерацию/i,
    });

    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Не удалось обновить')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('EditReviewPage - pairwise combinations', () => {
    const validTitle = 'Корректный заголовок';
    const invalidTitle = 'abc';
    const validContent = 'a'.repeat(150);
    const invalidContent = 'a'.repeat(50);
    const validMovie = 'Интерстеллар';
    const invalidMovie = '';

    const authorUser = { id: 10, username: 'username', role: 'user' as 'user' | 'admin' };
    const notAuthorUser = { id: 99, username: 'username', role: 'user' as 'user' | 'admin' };

    const cases = [
      {
        title: validTitle,
        content: validContent,
        movie: validMovie,
        user: authorUser,
        shouldSubmit: true,
      },
      {
        title: validTitle,
        content: invalidContent,
        movie: invalidMovie,
        user: notAuthorUser,
        shouldSubmit: false,
      },
      {
        title: invalidTitle,
        content: validContent,
        movie: validMovie,
        user: notAuthorUser,
        shouldSubmit: false,
      },
      {
        title: invalidTitle,
        content: invalidContent,
        movie: invalidMovie,
        user: authorUser,
        shouldSubmit: false,
      },
      {
        title: validTitle,
        content: validContent,
        movie: invalidMovie,
        user: authorUser,
        shouldSubmit: false,
      },
      {
        title: validTitle,
        content: invalidContent,
        movie: validMovie,
        user: authorUser,
        shouldSubmit: false,
      },
    ];

    it.each(cases)(
      'title:$title content:$content movie:$movie user:$user.id shouldSubmit:$shouldSubmit',
      async ({ title, content, movie, user, shouldSubmit }) => {
        vi.mocked(AuthContext.useMe).mockReturnValue(user);
        const u = userEvent.setup();

        mockGetReviewById.mockResolvedValueOnce(mockReview);

        renderPage();

        if (user.id === mockReview.author.id) {
          // автор → ожидаем форму
          await waitFor(() => {
            expect(screen.getByDisplayValue('Старый заголовок')).toBeInTheDocument();
          });

          await u.clear(screen.getByLabelText(/заголовок рецензии/i));
          await u.type(screen.getByLabelText(/заголовок рецензии/i), title);

          await u.clear(screen.getByLabelText(/название фильма/i));
          if (movie) {
            await u.type(screen.getByLabelText(/название фильма/i), movie);
          }

          const contentTextarea = screen.getByLabelText(/текст рецензии/i);
          await u.clear(contentTextarea);
          await u.type(contentTextarea, content);

          await u.click(screen.getByRole('button', { name: /отправить/i }));
        } else {
          // не автор → ожидаем ошибку доступа
          await waitFor(() => {
            expect(
              screen.getByText('У вас нет прав на редактирование этой рецензии')
            ).toBeInTheDocument();
          });

          expect(screen.queryByLabelText(/заголовок рецензии/i)).not.toBeInTheDocument();
        }

        if (shouldSubmit) {
          await waitFor(() => expect(reviewsApi.updateReview).toHaveBeenCalled());
        } else {
          await waitFor(() => expect(reviewsApi.updateReview).not.toHaveBeenCalled());
        }
      }
    );
  });
});
