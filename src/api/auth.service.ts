import { api } from './axios';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
}

export async function login(
  username: string,
  password: string
): Promise<LoginResponse> {
  const response = await api.post<LoginResponse>(
    '/autenticacao/login',
    {
      username,
      password,
    }
  );

  return response.data;
}
