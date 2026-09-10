const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const getToken = () => localStorage.getItem('token');

export function setToken(token: string) {
  localStorage.setItem('token', token);
}

export function clearToken() {
  localStorage.removeItem('token');
}

export async function fetchAPI<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof body === 'object' && body !== null
        ? (Array.isArray(body.message)
            ? body.message.join(', ')
            : body.message) || 'Error en la solicitud'
        : body || 'Error en la solicitud';

    const error = new Error(message);
    (error as any).status = response.status;
    throw error;
  }

  return body as T;
}

export const api = {
  get: <T>(path: string) => fetchAPI<T>(path),
  post: <T>(path: string, data?: unknown) =>
    fetchAPI<T>(path, { method: 'POST', body: JSON.stringify(data ?? {}) }),
  put: <T>(path: string, data?: unknown) =>
    fetchAPI<T>(path, { method: 'PUT', body: JSON.stringify(data ?? {}) }),
  delete: <T>(path: string) => fetchAPI<T>(path, { method: 'DELETE' }),
};