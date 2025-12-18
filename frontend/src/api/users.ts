import api from './index';
import type { UserBase } from './types';

export const getUserById = async (userId: number) => {
  const response = await api.get(`/users/${userId}`);
  console.log('Response status:', response.status);
  console.log('Response data:', response.data);
  console.log('Reviews count:', response.data?.reviews?.length);
  return response.data as UserBase;
};
