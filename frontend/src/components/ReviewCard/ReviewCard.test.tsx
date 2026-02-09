import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFormatDate = vi.hoisted(() => vi.fn());
const mockGetEditReviewRoute = vi.hoisted(() => vi.fn());
const mockGetUserProfileRoute = vi.hoisted(() => vi.fn());
const mockLikes = vi.hoisted(() => vi.fn());
const mockButton = vi.hoisted(() => vi.fn());
const mockLinkButton = vi.hoisted(() => vi.fn());
const mockAlert = vi.hoisted(() => vi.fn());
const mockLink = vi.hoisted(() => vi.fn());

vi.mock('../../utils/date', () => ({
  formatDate: mockFormatDate,
}));

vi.mock('../../lib/routes', () => ({
  getEditReviewRoute: mockGetEditReviewRoute,
  getUserProfileRoute: mockGetUserProfileRoute,
}));

vi.mock('../Likes', () => ({
  Likes: mockLikes,
}));

vi.mock('../Button', () => ({
  Button: mockButton,
  LinkButton: mockLinkButton,
}));

vi.mock('../Alert', () => ({
  Alert: mockAlert,
}));

vi.mock('react-router-dom', () => ({
  Link: mockLink,
}));

vi.mock('./index.module.scss', () => ({
  default: {
    card: 'card',
    status: 'status',
    title: 'title',
    meta: 'meta',
    movie: 'movie',
    movieIcon: 'movieIcon',
    author: 'author',
    logoUser: 'logoUser',
    content: 'content',
    footer: 'footer',
    left: 'left',
    date: 'date',
    buttons: 'buttons',
  },
}));

import { ReviewCard } from './index';
import type { Review } from '../../api/types';

describe('ReviewCard - Module Test', () => {
  const mockReview: Review = {
    id: 1,
    title: 'Отличный фильм',
    content: 'Очень понравился',
    movie_title: 'Inception',
    created_at: '2024-01-01',
    likes: 3,
    is_liked: false,
    status: 'approved',
    author: {
      id: 10,
      username: 'test_user',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Настраиваем моки
    mockFormatDate.mockReturnValue('1 января 2024');
    mockGetEditReviewRoute.mockReturnValue('/edit/1');
    mockGetUserProfileRoute.mockReturnValue('/user/10');

    mockLikes.mockReturnValue(<div data-testid="likes">Likes</div>);
    mockButton.mockImplementation(({ onClick, children, color, loading }: any) => (
      <button onClick={onClick} data-testid={`button-${color}`} data-loading={loading}>
        {children}
      </button>
    ));
    mockLinkButton.mockImplementation(({ to, children }: any) => (
      <a href={to} data-testid="link-button">
        {children}
      </a>
    ));
    mockAlert.mockImplementation(({ children }: any) => <div data-testid="alert">{children}</div>);
    mockLink.mockImplementation(({ to, children, className }: any) => (
      <a href={to} className={className} data-testid="link">
        {children}
      </a>
    ));
  });

  describe('базовый рендеринг', () => {
    it('рендерит заголовок и контент', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('Отличный фильм')).toBeInTheDocument();
      expect(screen.getByText('Очень понравился')).toBeInTheDocument();
    });

    it('показывает статус по умолчанию', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByText('approved')).toBeInTheDocument();
    });

    it('не показывает статус при showStatus=false', () => {
      render(<ReviewCard review={mockReview} showStatus={false} />);

      expect(screen.queryByText('approved')).not.toBeInTheDocument();
    });
  });

  describe('условия показа лайков', () => {
    it('показывает Likes при status=approved', () => {
      render(<ReviewCard review={mockReview} />);

      expect(screen.getByTestId('likes')).toBeInTheDocument();
    });

    it('не показывает Likes при status=pending', () => {
      const pendingReview = { ...mockReview, status: 'pending' as const };
      render(<ReviewCard review={pendingReview} />);

      expect(screen.queryByTestId('likes')).not.toBeInTheDocument();
    });

    it('не показывает Likes при showLikes=false', () => {
      render(<ReviewCard review={mockReview} showLikes={false} />);

      expect(screen.queryByTestId('likes')).not.toBeInTheDocument();
    });
  });
});
