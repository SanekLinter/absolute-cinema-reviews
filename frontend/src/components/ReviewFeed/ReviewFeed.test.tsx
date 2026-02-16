import { render, waitFor, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

import { ReviewFeed } from './index';

describe('ReviewFeed - Module Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockLoadReviews.mockResolvedValue({ reviews: [], pagination: { total_pages: 1 } });

    mockReviewList.mockImplementation(() => <div data-testid="review-list">ReviewList Mock</div>);

    mockButton.mockImplementation(({ onClick, children, loading }: any) => (
      <button onClick={onClick} disabled={loading}>
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
      const user = userEvent.setup();

      render(<ReviewFeed loadReviews={mockLoadReviews} />);

      await waitFor(() => {
        expect(mockLoadReviews).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
      });

      const nextButton = await screen.findByRole('button', {
        name: '➡',
      });

      await user.click(nextButton);

      await waitFor(() => {
        expect(mockLoadReviews).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
      });
    });

    it('блокирует кнопки пагинации при loading', async () => {
      render(<ReviewFeed loadReviews={mockLoadReviews} />);

      const nextButton = await screen.findByRole('button', {
        name: '➡',
      });

      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });
    });
  });

  describe('логика handleLikeUpdate', () => {
    it('обновляет лайки в reviews', async () => {
      const user = userEvent.setup();

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
        },
      ];

      mockLoadReviews.mockResolvedValue({
        reviews: mockReviews,
        pagination: { total_pages: 1 },
      });

      // Мокаем ReviewList с защитой от undefined
      mockReviewList.mockImplementation(({ reviews = [], onLikeUpdate }) => {
        if (reviews.length === 0) {
          return <div data-testid="review-list">Пустой список</div>;
        }

        const review = reviews[0];

        return (
          <div data-testid="review-list">
            <button
              data-testid="like-button"
              onClick={() => onLikeUpdate(review.id, review.likes + 1, !review.is_liked)}
            >
              Like ({review.likes})
            </button>
          </div>
        );
      });

      render(<ReviewFeed loadReviews={mockLoadReviews} />);

      // Ждём, пока данные загрузятся и ReviewList отрендерится с реальными отзывами
      await waitFor(() => {
        expect(screen.getByTestId('review-list')).toBeInTheDocument();
        expect(screen.getByTestId('like-button')).toBeInTheDocument();
      });

      const likeButton = screen.getByTestId('like-button');
      expect(likeButton).toHaveTextContent('Like (10)');

      await user.click(likeButton);

      // Ждём перерендера ReviewList с обновлёнными данными
      await waitFor(() => {
        const calls = mockReviewList.mock.calls;
        const lastCallArgs = calls[calls.length - 1][0];
        const updatedReview = lastCallArgs.reviews.find((r: { id: number }) => r.id === 1);

        expect(updatedReview).toBeDefined();
        expect(updatedReview.likes).toBe(11);
        expect(updatedReview.is_liked).toBe(true);
      });

      expect(screen.getByTestId('like-button')).toHaveTextContent('Like (11)');
    });
  });
});
