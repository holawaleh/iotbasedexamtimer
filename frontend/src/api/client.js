const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://iotbasedexamtimer.onrender.com/api';

function collectErrorMessages(value) {
  if (!value) return [];
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(collectErrorMessages);
  if (typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) =>
      collectErrorMessages(item).map((message) => `${key}: ${message}`),
    );
  }
  return [String(value)];
}

async function request(path, { token, method = 'GET', body } = {}) {
  const headers = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data.detail ||
      data.non_field_errors?.[0] ||
      collectErrorMessages(data).join(' ') ||
      'Request failed';
    const err = new Error(message);
    err.data = data;
    throw err;
  }

  return data;
}

export { API_BASE_URL };

export async function healthCheck() {
  try {
    return await request('/health/');
  } catch {
    const response = await fetch(`${API_BASE_URL}/token/`, {
      method: 'OPTIONS',
    });

    if (!response.ok) {
      throw new Error('Backend unavailable');
    }

    return { status: 'ok', service: 'token-endpoint' };
  }
}

export function login(username, password) {
  return request('/token/', {
    method: 'POST',
    body: { username, password },
  });
}

export function signup({ username, email, password, passwordConfirm }) {
  return request('/auth/signup/', {
    method: 'POST',
    body: {
      username,
      email,
      password,
      password_confirm: passwordConfirm,
    },
  });
}

export function getCurrentUser(token) {
  return request('/auth/me/', { token });
}

export function getHalls(token) {
  return request('/halls/', { token });
}

export function createHall(token, hall) {
  return request('/halls/', {
    token,
    method: 'POST',
    body: hall,
  });
}

export function createSession(token, session) {
  return request('/sessions/', {
    token,
    method: 'POST',
    body: session,
  });
}

export function activateSession(token, sessionId) {
  return request(`/sessions/${sessionId}/activate/`, {
    token,
    method: 'POST',
  });
}

export function finishSession(token, sessionId) {
  return request(`/sessions/${sessionId}/finish/`, {
    token,
    method: 'POST',
  });
}

export function getActiveSessionsCount(token) {
  return request('/sessions/active_count/', { token });
}
