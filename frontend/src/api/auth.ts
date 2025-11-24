import api from './index';

export const register = async (username: string, password: string) => {
  const response = await api.post('/auth/register', { username, password });
  return {
    token: response.data.access_token,
  };
};

export const login = async (username: string, password: string) => {
  const response = await api.post('/auth/login', { username, password });
  return {
    token: response.data.access_token,
  };
};

export const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};
