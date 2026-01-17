import axios from 'axios';
import { getAccessToken } from '../utils/auth';

export const api = axios.create({
  baseURL: 'https://pet-manager-api.geia.vip',
});

api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    // 🔴 Endpoints públicos (NÃO enviar token)
    const publicEndpoints = [
      '/autenticacao/login',
      '/autenticacao/refresh',
    ];

    const isPublicEndpoint = publicEndpoints.some(
      (endpoint) => config.url?.includes(endpoint)
    );

    if (token && !isPublicEndpoint) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
