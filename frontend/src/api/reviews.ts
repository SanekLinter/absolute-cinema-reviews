import api from './index';
import type { Review } from './types';

export const getPublicReviews = async (
  params: {
    page?: number;
    limit?: number;
    sort?: 'created_at' | 'likes';
    order?: 'asc' | 'desc';
    search?: string;
    authorId?: number;
  } = {}
) => {
  const response = await api.get('/reviews/public', { params });
  return response.data;
};

export const getMyReviews = async (
  params: {
    page?: number;
    limit?: number;
    sort?: 'created_at' | 'likes';
    order?: 'asc' | 'desc';
    search?: string;
  } = {}
) => {
  const response = await api.get('/reviews/my', { params });
  return response.data;
};

export const getModerationReviews = async (
  params: {
    page?: number;
    limit?: number;
  } = {}
) => {
  const response = await api.get('/reviews/moderation', { params });
  return response.data;
};

export const getReviewById = async (reviewId: number) => {
  const response = await api.get(`/reviews/${reviewId}`);

  return response.data as Review;
};

export const approveReview = (reviewId: number) => api.post(`/reviews/${reviewId}/approve`);

export const rejectReview = (reviewId: number) => api.post(`/reviews/${reviewId}/reject`);

export const deleteReview = (reviewId: number) => api.delete(`/reviews/${reviewId}`);

export const createReview = async (title: string, movie_title: string, content: string) => {
  const response = await api.post('/reviews', { title, movie_title, content });
  return response.data as Review;
};

export const updateReview = async (
  reviewId: number,
  title: string,
  movie_title: string,
  content: string
) => {
  const response = await api.put(`/reviews/${reviewId}`, {
    title,
    movie_title,
    content,
  });
  return response.data as Review;
};
