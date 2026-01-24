import axios from "axios";
import { getRefreshToken, saveTokens, clearTokens } from "@/utils/auth";

const plain = axios.create({
  baseURL: "https://pet-manager-api.geia.vip",
});

type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  refresh_expires_in?: number;
};

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("Sem refresh token");

  const { data } = await plain.put<RefreshResponse>("/autenticacao/refresh", {
    refresh_token: refreshToken,
  });

  saveTokens(data.access_token, data.refresh_token);
  return data.access_token;
}

export function logout() {
  clearTokens();
}
