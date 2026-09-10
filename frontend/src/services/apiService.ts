let envApiUrl = import.meta.env.VITE_API_URL;

// Si estamos navegando en Render (*.onrender.com), apuntar siempre al backend público en Render
if (typeof window !== 'undefined' && window.location.hostname.includes('.onrender.com')) {
  envApiUrl = 'https://saludpublica-backend.onrender.com';
} else if (!envApiUrl || envApiUrl === 'saludpublica-backend' || !envApiUrl.includes('.')) {
  envApiUrl = 'http://localhost:3001';
}

if (!envApiUrl.startsWith('http://') && !envApiUrl.startsWith('https://')) {
  envApiUrl = `https://${envApiUrl}`;
}

const API_URL = envApiUrl.replace(/\/+$/, '');

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

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = `${API_URL}${cleanPath}`;

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      headers,
    });
  } catch (netErr: any) {
    console.error(`[fetchAPI Network Error] URL: ${fullUrl}`, netErr);
    throw new Error(`Error de conexión hacia ${fullUrl} (${netErr.message || 'Failed to fetch'})`);
  }

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