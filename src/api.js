import { auth } from './firebase'

const BASE = import.meta.env.DEV
  ? 'http://localhost:3000'
  : 'https://newsapi-nu.vercel.app'

async function getToken() {
  await auth.authStateReady()
  const user = auth.currentUser
  if (!user) return null
  try {
    return await user.getIdToken()
  } catch {
    return null
  }
}

async function authHeaders(json = false) {
  const token = await getToken()
  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}

// ── Admin (single call for all data) ─────────────────────────────────────
export async function fetchAdminData() {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/api/admin`, { headers, cache: 'no-store' })
  return res.json()
}

export async function fetchAnalytics() {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/api/admin/analytics`, { headers, cache: 'no-store' })
  return await res.json()
}

// ── Auth ──────────────────────────────────────────────────────────────────
export async function apiLogin(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  return res.json()
}

export async function apiSignup(name, email, password) {
  const res = await fetch(`${BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  })
  return res.json()
}

// ── News / Articles ───────────────────────────────────────────────────────
export async function fetchArticles(category = 'general') {
  const res = await fetch(`${BASE}/api/news?category=${category}`)
  return res.json()
}

export async function fetchArticleBySlug(slug) {
  const res = await fetch(`${BASE}/api/articles/${slug}`)
  return res.json()
}

// ── API Keys ──────────────────────────────────────────────────────────────
export async function fetchApiKeys() {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/api/keys`, { headers })
  return res.json()
}

export async function createApiKey(name) {
  const headers = await authHeaders(true)
  const res = await fetch(`${BASE}/api/keys`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ name }),
  })
  return res.json()
}

export async function deleteApiKey(id) {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/api/keys/${id}`, { method: 'DELETE', headers })
  return res.json()
}

// ── User Management (Admin) ───────────────────────────────────────────────
export async function deleteUser(uid) {
  const headers = await authHeaders()
  const res = await fetch(`${BASE}/api/admin/users/${uid}`, { method: 'DELETE', headers })
  return res.json()
}

export async function blockUser(uid) {
  const headers = await authHeaders(true)
  const res = await fetch(`${BASE}/api/admin/users/${uid}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ action: 'block' }),
  })
  return res.json()
}

export async function unblockUser(uid) {
  const headers = await authHeaders(true)
  const res = await fetch(`${BASE}/api/admin/users/${uid}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ action: 'unblock' }),
  })
  return res.json()
}

export async function upgradePlan(uid, plan) {
  const headers = await authHeaders(true)
  const action = plan === 'pro' ? 'upgrade_pro' : plan === 'enterprise' ? 'upgrade_enterprise' : 'downgrade_free'
  const res = await fetch(`${BASE}/api/admin/users/${uid}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ action }),
  })
  return res.json()
}
