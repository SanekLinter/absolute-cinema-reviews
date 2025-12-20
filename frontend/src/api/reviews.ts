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
  console.log('Response status:', response.status);
  console.log('Response data:', response.data);
  console.log('Reviews count:', response.data?.reviews?.length);
  return response.data as Review;
};
