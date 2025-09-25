// Point this to your API
const API_BASE = 'http://localhost:4000';

function setToken(token) { localStorage.setItem('token', token); }
function getToken() { return localStorage.getItem('token'); }
function clearToken() { localStorage.removeItem('token'); }

async function api(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_BASE + path, { ...options, headers });
  if (!res.ok) {
    let msg = 'Request failed';
    try { const j = await res.json(); msg = j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}
