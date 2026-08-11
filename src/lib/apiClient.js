const USERS_API = "/api/users";
const AUTH_API = "/api/auth";

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok) {
    const error = data?.error || `Request failed with status ${res.status}`;
    throw new Error(error);
  }
  return data;
}

export async function registerUser(user) {
  return fetchJson(USERS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
}

export async function sendOtp(email, phone) {
  return fetchJson(`${AUTH_API}/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, phone }),
  });
}

export async function verifyOtp(email, otp) {
  return fetchJson(`${AUTH_API}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp }),
  });
}

export async function loginUser(email, password) {
  return fetchJson(`${AUTH_API}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

// Mints a session cookie for a user already authenticated client-side via
// Firebase (Google sign-in) — see src/app/api/auth/session/route.js.
export async function establishSession(user) {
  return fetchJson(`${AUTH_API}/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
}

export async function logoutUser() {
  return fetchJson(`${AUTH_API}/logout`, { method: "POST" });
}
