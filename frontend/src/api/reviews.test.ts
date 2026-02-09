import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './index';

import {
  getPublicReviews,
  getMyReviews,
  getModerationReviews,
  getReviewById,
  approveReview,
  rejectReview,
  deleteReview,
  createReview,
  updateReview,
  toggleLike,
} from './reviews';

vi.mock('./index');

describe('reviews api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getPublicReviews вызывает правильный endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { reviews: [] } } as any);

    const res = await getPublicReviews({ page: 2 });

    expect(api.get).toHaveBeenCalledWith('/reviews/public', { params: { page: 2 } });
    expect(res).toEqual({ reviews: [] });
  });

  it('getMyReviews вызывает endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { reviews: [] } } as any);

    await getMyReviews();

    expect(api.get).toHaveBeenCalledWith('/reviews/my', { params: {} });
  });

  it('getModerationReviews вызывает endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: {} } as any);

    await getModerationReviews({ page: 1 });

    expect(api.get).toHaveBeenCalledWith('/reviews/moderation', { params: { page: 1 } });
  });

  it('getReviewById', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { id: 5 } } as any);

    const res = await getReviewById(5);

    expect(api.get).toHaveBeenCalledWith('/reviews/5');
    expect(res).toEqual({ id: 5 });
  });

  it('approveReview', async () => {
    vi.mocked(api.post).mockResolvedValue({} as any);

    await approveReview(3);

    expect(api.post).toHaveBeenCalledWith('/reviews/3/approve');
  });

  it('rejectReview', async () => {
    vi.mocked(api.post).mockResolvedValue({} as any);

    await rejectReview(4);

    expect(api.post).toHaveBeenCalledWith('/reviews/4/reject');
  });

  it('deleteReview', async () => {
    vi.mocked(api.delete).mockResolvedValue({} as any);

    await deleteReview(7);

    expect(api.delete).toHaveBeenCalledWith('/reviews/7');
  });

  it('createReview', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { id: 1 } } as any);

    const res = await createReview('t', 'm', 'c');

    expect(api.post).toHaveBeenCalledWith('/reviews', {
      title: 't',
      movie_title: 'm',
      content: 'c',
    });

    expect(res).toEqual({ id: 1 });
  });

  it('updateReview', async () => {
    vi.mocked(api.put).mockResolvedValue({ data: { id: 2 } } as any);

    const res = await updateReview(2, 't', 'm', 'c');

    expect(api.put).toHaveBeenCalledWith('/reviews/2', {
      title: 't',
      movie_title: 'm',
      content: 'c',
    });

    expect(res).toEqual({ id: 2 });
  });

  it('toggleLike', async () => {
    vi.mocked(api.post).mockResolvedValue({
      data: { likes: 10, is_liked: true },
    } as any);

    const res = await toggleLike(9);

    expect(api.post).toHaveBeenCalledWith('/reviews/9/like');
    expect(res).toEqual({ likes: 10, is_liked: true });
  });
});
