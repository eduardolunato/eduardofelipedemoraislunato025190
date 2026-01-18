import axios from 'axios';
import { getAccessToken } from "@/utils/auth";
import { refreshAccessToken, logout } from "@/api/auth.service";

export const api = axios.create({
  baseURL: 'https://pet-manager-api.geia.vip',
});

const publicEndpoints = ["/autenticacao/login", "/autenticacao/refresh"];

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


// ✅ evita loop infinito
let isRefreshing = false;
let pendingQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as { _retry?: boolean } & typeof error.config;

    const status = error?.response?.status;
    const isPublic = publicEndpoints.some((ep) => original?.url?.includes(ep));

    // se não é 401 ou é endpoint público, só rejeita
    if (status !== 401 || isPublic) return Promise.reject(error);

    // evita retry infinito
    if (original._retry) {
      logout();
      window.location.href = "/login";
      return Promise.reject(error);
    }
    original._retry = true;

    // se já está atualizando token, enfileira
    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingQueue.push((newToken: string) => {
          original.headers.Authorization = `Bearer ${newToken}`;
          resolve(api(original));
        });
      });
    }

    // faz refresh
    try {
      isRefreshing = true;
      const newToken = await refreshAccessToken();

      pendingQueue.forEach((cb) => cb(newToken));
      pendingQueue = [];

      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (e) {
      pendingQueue = [];
      logout();
      window.location.href = "/login";
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);