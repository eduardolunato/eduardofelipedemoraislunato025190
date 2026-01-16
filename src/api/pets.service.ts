import { api } from './axios';

export const getPets = async (page = 1) => {
  const response = await api.get(`/v1/pets?page=${page}&limit=10`);
  return response.data;
};
