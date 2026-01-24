import axios from 'axios';
import { getAccessToken } from "@/utils/auth";
import { refreshAccessToken, logout } from "@/api/auth.service";

export const api = axios.create({
  baseURL: 'https://pet-manager-api.geia.vip',
});

const publicEndpoints = ["/autenticacao/login", "/autenticacao/refresh"];

// ✅ Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    const isPublic = publicEndpoints.some((ep) => config.url?.includes(ep));

    if (token && !isPublic) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);


// ✅ evita loop infinito + fila com resolve/reject
let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function resolveQueue(token: string) {
  pendingQueue.forEach((p) => p.resolve(token));
  pendingQueue = [];
}

function rejectQueue(err: unknown) {
  pendingQueue.forEach((p) => p.reject(err));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean });

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

    // se já está atualizando, enfileira esperando refresh
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken: string) => {
            original.headers = original.headers ?? {};
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    try {
      isRefreshing = true;

      const newToken = await refreshAccessToken();

      resolveQueue(newToken);

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (e) {
      rejectQueue(e);
      logout();
      window.location.href = "/login";
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);