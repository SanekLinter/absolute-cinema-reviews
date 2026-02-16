import api from './index';
import type { UserBase } from './types';

export const getUserById = async (userId: number) => {
  const response = await api.get(`/users/${userId}`);
  return response.data as UserBase;
};
