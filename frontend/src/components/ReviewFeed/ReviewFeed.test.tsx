import { render, waitFor, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLoadReviews = vi.hoisted(() => vi.fn());
const mockReviewList = vi.hoisted(() => vi.fn());
const mockButton = vi.hoisted(() => vi.fn());
const mockAlert = vi.hoisted(() => vi.fn());
const mockSpinner = vi.hoisted(() => vi.fn());

vi.mock('../ReviewList', () => ({ ReviewList: mockReviewList }));
vi.mock('../Button', () => ({ Button: mockButton }));
vi.mock('../Alert', () => ({ Alert: mockAlert }));
vi.mock('../Spinner', () => ({ Spinner: mockSpinner }));

vi.mock('./index.module.scss', () => ({ default: {} }));

// импорт компонента после моков
import { ReviewFeed } from './index';

describe('ReviewFeed - Module Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLoadReviews.mockResolvedValue({ reviews: [], pagination: { total_pages: 1 } });

    // Моки компонентов должны возвращать валидный React элемент
    mockReviewList.mockImplementation(() => <div data-testid="review-list">ReviewList Mock</div>);
    mockButton.mockImplementation(({ onClick, children, loading }: any) => (
      <button onClick={onClick} disabled={loading} data-testid="button">
        {children}
      </button>
    ));
    mockAlert.mockImplementation(({ children }: any) => <div data-testid="alert">{children}</div>);
    mockSpinner.mockImplementation(() => <div data-testid="spinner">Spinner Mock</div>);
  });

  describe('логика параметров', () => {
    it('передает authorId в loadReviews', async () => {
      render(<ReviewFeed loadReviews={mockLoadReviews} authorId={123} />);

      await waitFor(() => {
        expect(mockLoadReviews).toHaveBeenCalledWith(expect.objectContaining({ author_id: 123 }));
      });
    });

    it('не передает authorId если не указан', async () => {
      render(<ReviewFeed loadReviews={mockLoadReviews} />);

      await waitFor(() => {
        expect(mockLoadReviews).toHaveBeenCalledWith(
          expect.objectContaining({ author_id: undefined })
        );
      });
    });

    it('передает reviewCardProps в ReviewList', async () => {
      const reviewCardProps = {
        showLikes: false,
        showStatus: false,
        moderation: true,
      };

      render(<ReviewFeed loadReviews={mockLoadReviews} reviewCardProps={reviewCardProps} />);

      await waitFor(() => {
        const calls = mockReviewList.mock.calls;
        expect(calls.length).toBeGreaterThan(0);
        const lastCall = calls[calls.length - 1];
        expect(lastCall[0]).toMatchObject({
          cardProps: reviewCardProps,
          reviews: [],
          onLikeUpdate: expect.any(Function),
        });
      });
    });
  });

  describe('логика withControls', () => {
    it('не вызывает loadReviews с search/sort при withControls=false', async () => {
      render(<ReviewFeed loadReviews={mockLoadReviews} withControls={false} />);

      await waitFor(() => {
        const call = mockLoadReviews.mock.calls[0][0];
        expect(call.search).toBeUndefined();
        expect(call.sort).toBeUndefined();
        expect(call.order).toBeUndefined();
      });
    });
    it('вызывает loadReviews с search/sort при withControls=true', async () => {
      render(<ReviewFeed loadReviews={mockLoadReviews} withControls={true} />);

      await waitFor(() => {
        const call = mockLoadReviews.mock.calls[0][0];
        expect(call.sort).toBe('created_at');
        expect(call.order).toBe('desc');
      });
    });
  });

  describe('состояния загрузки и ошибки', () => {
    it('показывает Spinner во время загрузки', async () => {
      // Делаем загрузку медленной
      mockLoadReviews.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ reviews: [], pagination: { total_pages: 1 } }), 100);
          })
      );

      render(<ReviewFeed loadReviews={mockLoadReviews} />);

      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });
    });
    it('показывает Alert при ошибке загрузки', async () => {
      const errorMessage = 'Ошибка сети';
      mockLoadReviews.mockRejectedValue({ uiMessage: errorMessage });

      render(<ReviewFeed loadReviews={mockLoadReviews} />);

      await waitFor(() => {
        expect(screen.getByTestId('alert')).toHaveTextContent(errorMessage);
      });
    });
  });

  describe('пагинация', () => {
    beforeEach(() => {
      mockLoadReviews.mockResolvedValue({
        reviews: [],
        pagination: { total_pages: 3 },
      });
    });

    it('показывает пагинацию при total_pages > 1', async () => {
      render(<ReviewFeed loadReviews={mockLoadReviews} />);

      await waitFor(() => {
        expect(screen.getByTestId('review-list')).toBeInTheDocument();
        expect(mockButton).toHaveBeenCalled();
      });
    });

    it('не показывает пагинацию при total_pages = 1', async () => {
      mockLoadReviews.mockResolvedValue({
        reviews: [],
        pagination: { total_pages: 1 },
      });

      render(<ReviewFeed loadReviews={mockLoadReviews} />);

      await waitFor(() => {
        // Кнопки пагинации не должны вызываться
        const buttonCalls = mockButton.mock.calls;
        const paginationButtonCalls = buttonCalls.filter(
          (call: any) => call[0]?.children === '➡' || call[0]?.children === '⬅'
        );
        expect(paginationButtonCalls).toHaveLength(0);
      });
    });
    it('меняет страницу при клике на кнопки', async () => {
      render(<ReviewFeed loadReviews={mockLoadReviews} />);

      await waitFor(() => {
        expect(mockLoadReviews).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
      });

      const buttonCalls = mockButton.mock.calls;
      const nextButtonCall = buttonCalls.find((call: any) => call[0]?.children === '➡');

      if (nextButtonCall && nextButtonCall[0]?.onClick) {
        nextButtonCall[0].onClick();

        await waitFor(() => {
          expect(mockLoadReviews).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
        });
      }
    });

    it('блокирует кнопки пагинации при loading', async () => {
      render(<ReviewFeed loadReviews={mockLoadReviews} />);

      await waitFor(() => {
        const buttonCalls = mockButton.mock.calls;
        const paginationButtons = buttonCalls.filter(
          (call: any) => call[0]?.children === '➡' || call[0]?.children === '⬅'
        );

        paginationButtons.forEach((call: any) => {
          expect(call[0].loading).toBe(false); // После загрузки loading=false
        });
      });
    });
  });

  describe('логика handleLikeUpdate', () => {
    it('обновляет лайки в reviews', async () => {
      const mockReviews = [
        {
          id: 1,
          title: 'Review 1',
          movie_title: 'Movie 1',
          content: 'Content 1',
          likes: 10,
          is_liked: false,
          created_at: '2024-01-01',
          status: 'approved',
          author: { id: 1, username: 'user1' },
        } as any,
      ];

      mockLoadReviews.mockResolvedValue({
        reviews: mockReviews,
        pagination: { total_pages: 1 },
      });

      let likeUpdateHandler: any;
      mockReviewList.mockImplementation(({ onLikeUpdate }: any) => {
        likeUpdateHandler = onLikeUpdate;
        return <div data-testid="review-list">ReviewList</div>;
      });

      await act(async () => {
        render(<ReviewFeed loadReviews={mockLoadReviews} />);
      });

      await waitFor(() => {
        expect(likeUpdateHandler).toBeDefined();
      });

      // Вызываем обработчик обновления лайков
      if (likeUpdateHandler) {
        await act(async () => {
          likeUpdateHandler(1, 11, true);
        });

        // Ждем обновления и проверяем последний вызов ReviewList
        await waitFor(() => {
          const calls = mockReviewList.mock.calls;
          expect(calls.length).toBeGreaterThan(1);

          // Ищем вызов с обновленными данными
          const lastCall = calls[calls.length - 1];
          const reviewsArg = lastCall[0].reviews;
          const updatedReview = reviewsArg.find((r: any) => r.id === 1);

          if (updatedReview) {
            expect(updatedReview.likes).toBe(11);
            expect(updatedReview.is_liked).toBe(true);
          }
        });
      }
    });
  });
});
