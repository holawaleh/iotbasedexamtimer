const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

async function request(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.detail || data.non_field_errors?.[0] || 'Request failed';
    throw new Error(message);
  }

  return data;
}

export function login(username, password) {
  return request('/token/', {
    method: 'POST',
    body: { username, password },
  });
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
