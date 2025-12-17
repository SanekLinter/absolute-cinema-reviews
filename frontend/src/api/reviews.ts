import api from './index';

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
