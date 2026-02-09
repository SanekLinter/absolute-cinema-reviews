import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFormatDate = vi.hoisted(() => vi.fn());
const mockGetReviewRoute = vi.hoisted(() => vi.fn());
const mockGetUserProfileRoute = vi.hoisted(() => vi.fn());
const mockLikes = vi.hoisted(() => vi.fn());
const mockLink = vi.hoisted(() => vi.fn());

vi.mock('../../utils/date', () => ({
  formatDate: mockFormatDate,
}));

vi.mock('../../lib/routes', () => ({
  getReviewRoute: mockGetReviewRoute,
  getUserProfileRoute: mockGetUserProfileRoute,
}));

vi.mock('../Likes', () => ({
  Likes: mockLikes,
}));

vi.mock('react-router-dom', () => ({
  Link: mockLink,
}));

vi.mock('./index.module.scss', () => ({
  default: {
    card: 'card',
    title: 'title',
    meta: 'meta',
    movie: 'movie',
    author: 'author',
    date: 'date',
    preview: 'preview',
    status: 'status',
  },
}));

import { ReviewMiniCard } from './index';

describe('ReviewMiniCard', () => {
  const mockReview = {
    id: 1,
    title: 'Title',
    movie_title: 'Movie',
    content: 'Content text',
    created_at: '2024-01-01',
    likes: 5,
    is_liked: false,
    status: 'approved',
    author: {
      id: 1,
      username: 'user',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockFormatDate.mockReturnValue('1 января 2024');
    mockGetReviewRoute.mockReturnValue('/review/1');
    mockGetUserProfileRoute.mockReturnValue('/user/1');

    mockLikes.mockReturnValue(<div data-testid="likes">Likes</div>);
    mockLink.mockImplementation(({ to, children, className }: any) => (
      <a href={to} className={className} data-testid="link">
        {children}
      </a>
    ));
  });

  it('рендерит данные рецензии', () => {
    render(<ReviewMiniCard review={mockReview as any} />);

    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Movie')).toBeInTheDocument();
    expect(screen.getByText('user')).toBeInTheDocument();
    expect(screen.getByText('1 января 2024')).toBeInTheDocument();
  });

  it('показывает Likes при status=approved', () => {
    render(<ReviewMiniCard review={mockReview as any} />);

    expect(screen.getByTestId('likes')).toBeInTheDocument();
  });

  it('не показывает Likes при status=pending', () => {
    const pendingReview = { ...mockReview, status: 'pending' as const };
    render(<ReviewMiniCard review={pendingReview as any} />);

    expect(screen.queryByTestId('likes')).not.toBeInTheDocument();
  });

  it('не показывает Likes при showLikes=false', () => {
    render(<ReviewMiniCard review={mockReview as any} showLikes={false} />);

    expect(screen.queryByTestId('likes')).not.toBeInTheDocument();
  });
});
