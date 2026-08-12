const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
const TOKEN_KEY = 'primeauto_access_token';

const entityRoutes = {
  Client: 'clients',
  DamageType: 'damage-types',
  ServiceCategory: 'service-categories',
  ServiceOrder: 'service-orders',
  ServiceType: 'service-types',
  StockItem: 'stock-items',
  StockMovement: 'stock-movements',
};

const getToken = () => localStorage.getItem(TOKEN_KEY);

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const error = new Error(data?.message || data?.error || 'Erro na requisição');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

function buildEntityClient(name) {
  const route = entityRoutes[name];
  const basePath = `/entities/${route}`;

  return {
    list: (sort = '-created_date', limit = 100) =>
      request(`${basePath}?sort=${encodeURIComponent(sort)}&limit=${limit}`),
    filter: (filters = {}, sort = '-created_date', limit = 100) => {
      const params = new URLSearchParams({ sort, limit: String(limit) });
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });
      return request(`${basePath}?${params.toString()}`);
    },
    get: (id) => request(`${basePath}/${id}`),
    create: (body) => request(basePath, { method: 'POST', body }),
    update: (id, body) => request(`${basePath}/${id}`, { method: 'PUT', body }),
    delete: (id) => request(`${basePath}/${id}`, { method: 'DELETE' }),
    subscribe: (callback, intervalMs = 15000) => {
      const interval = window.setInterval(callback, intervalMs);
      return () => window.clearInterval(interval);
    },
  };
}

const entities = Object.fromEntries(
  Object.keys(entityRoutes).map((name) => [name, buildEntityClient(name)])
);

export const api = {
  auth: {
    loginViaEmailPassword: async (email, password) => {
      const result = await request('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      if (result?.access_token) localStorage.setItem(TOKEN_KEY, result.access_token);
      return result;
    },
    register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
    verifyOtp: async (payload) => {
      const result = await request('/auth/verify-otp', { method: 'POST', body: payload });
      if (result?.access_token) localStorage.setItem(TOKEN_KEY, result.access_token);
      return result;
    },
    resendOtp: (email) => request('/auth/resend-otp', { method: 'POST', body: { email } }),
    me: () => request('/auth/me'),
    logout: (redirectTo = '/login') => {
      localStorage.removeItem(TOKEN_KEY);
      if (redirectTo) window.location.href = redirectTo;
    },
    loginWithProvider: (provider, redirectTo = '/') => {
      const url = new URL(`${API_URL}/auth/oauth/${provider}`, window.location.origin);
      url.searchParams.set('redirect_to', redirectTo);
      window.location.href = url.toString();
    },
    resetPasswordRequest: (email) =>
      request('/auth/forgot-password', { method: 'POST', body: { email } }),
    resetPassword: (payload) =>
      request('/auth/reset-password', { method: 'POST', body: payload }),
    setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
    redirectToLogin: (redirectTo = window.location.href) => {
      const url = new URL('/login', window.location.origin);
      url.searchParams.set('redirect_to', redirectTo);
      window.location.href = url.toString();
    },
  },
  entities,
  integrations: {
    Core: {
      UploadFile: async ({ file }) => {
        const form = new FormData();
        form.append('file', file);
        return request('/uploads', { method: 'POST', body: form });
      },
    },
  },
};
