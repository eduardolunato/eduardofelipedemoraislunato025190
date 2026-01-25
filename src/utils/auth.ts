export function saveTokens(
  accessToken: string,
  refreshToken: string
) {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  
  // ✅ Dispara evento customizado
  window.dispatchEvent(new CustomEvent('auth-token-changed', { 
    detail: { hasToken: true } 
  }));
}

export function getAccessToken() {
  return localStorage.getItem('access_token');
}

export function getRefreshToken() {
  return localStorage.getItem('refresh_token');
}

export function clearTokens() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  
  // ✅ Dispara evento customizado
  window.dispatchEvent(new CustomEvent('auth-token-changed', { 
    detail: { hasToken: false } 
  }));
}