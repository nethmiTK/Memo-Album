const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');        // General token (used by both roles)
};

export const getUser = () => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const getUserRole = (): string | null => {
  const user = getUser();
  return user?.role || null;
};

export const isPhotographer = () => getUserRole() === 'photographer';
export const isCustomer = () => getUserRole() === 'customer';

export const authHeaders = (): Record<string, string> => {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Universal API fetch function
 */
export const apiFetch = async (
  path: string,
  options: RequestInit = {}
): Promise<Response> => {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers as Record<string, string> || {}),
    },
  });
  return res;
};

/**
 * Helper to check if response is unauthorized and redirect to login
 */
export const handleAuthError = (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/auth/login';
  }
};

export default API_URL;