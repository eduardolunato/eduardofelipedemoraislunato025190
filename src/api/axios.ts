import axios from "axios";
import { getAccessToken } from "@/utils/auth";
import { refreshAccessToken, logout } from "@/api/auth.service";

export const api = axios.create({
  baseURL: "https://pet-manager-api.geia.vip",
});

const publicEndpoints = ["/autenticacao/login", "/autenticacao/refresh"];

// No seu axios.ts, adicione um contador de tentativas
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { 
      _retry?: boolean;
      _retryCount?: number; // ADICIONAR
    });

    const status = error?.response?.status;
    const isPublic = publicEndpoints.some((ep) => original?.url?.includes(ep));

    if (status !== 401 || isPublic) return Promise.reject(error);

    // ADICIONAR: Limita tentativas para evitar loops infinitos
    original._retryCount = (original._retryCount || 0) + 1;
    
    if (original._retryCount > 2) {
      console.error('[axios] Muitas tentativas de refresh, deslogando...');
      logout();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    if (original._retry) {
      logout();
      window.location.href = "/login";
      return Promise.reject(error);
    }
    original._retry = true;

    
  }
);




// ---------- REQUEST ----------
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

// ---------- RESPONSE (REFRESH) ----------
let isRefreshing = false;

type QueueItem = {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
};

let pendingQueue: QueueItem[] = [];

function flushQueueSuccess(token: string) {
  pendingQueue.forEach((p) => p.resolve(token));
  pendingQueue = [];
}

function flushQueueError(err: unknown) {
  pendingQueue.forEach((p) => p.reject(err));
  pendingQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean });

    const status = error?.response?.status;
    const isPublic = publicEndpoints.some((ep) => original?.url?.includes(ep));

    if (status !== 401 || isPublic) return Promise.reject(error);

    if (original._retry) {
      logout();
      window.location.href = "/login";
      return Promise.reject(error);
    }
    original._retry = true;

    // se já está atualizando token, enfileira
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (newToken: string) => {
            if (!newToken) throw new Error("token vazio");
            original.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(original));
          },
          reject,
        });
      });
    }

    try {
      isRefreshing = true;

      const newToken = await refreshAccessToken(); // (seu auth.service já usa 'plain', ótimo)

      flushQueueSuccess(newToken);

      original.headers = original.headers ?? {};
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (e) {
      flushQueueError(e);
      logout();
      window.location.href = "/login";
      return Promise.reject(e);
    } finally {
      isRefreshing = false;
    }
  }
);