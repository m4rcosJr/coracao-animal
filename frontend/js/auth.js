/**
 * auth.js — Authentication & Session Management
 * Coracao Animal — PIM III UNIP
 *
 * Uses localStorage (persists across tabs and reloads).
 * Exposes global functions used across all pages.
 */

// ─── Storage Keys ─────────────────────────────────────
const AUTH_KEYS = {
  USER:     'ca_user_auth',    // 'true' when user is logged in
  ADMIN:    'ca_admin_auth',   // 'true' when admin is logged in
  REDIRECT: 'ca_redirect',     // page to return to after login
  NAME:     'ca_user_name',    // display name
  TYPE:     'ca_user_type',    // 'user' | 'admin'
};

// ─── Credentials (frontend simulation) ────────────────
const CREDENTIALS = {
  user:  { username: 'usuario', password: 'coracao123' },
  admin: { username: 'admin',   password: 'coracao2025' },
};

// ─── State Checks ──────────────────────────────────────

/** Returns true if any user (regular or admin) is logged in */
function isLoggedIn() {
  return localStorage.getItem(AUTH_KEYS.USER)  === 'true'
      || localStorage.getItem(AUTH_KEYS.ADMIN) === 'true';
}

/** Returns true only if the logged-in user is admin */
function isAdmin() {
  return localStorage.getItem(AUTH_KEYS.ADMIN) === 'true';
}

/** Returns the display name */
function getUserName() {
  return localStorage.getItem(AUTH_KEYS.NAME) || 'Usuário';
}

// ─── Login / Logout ────────────────────────────────────

/**
 * Attempts login. Returns { success, message }.
 * @param {string} username
 * @param {string} password
 * @param {'user'|'admin'} type
 */
function attemptLogin(username, password, type) {
  const cred = CREDENTIALS[type];
  if (!cred) return { success: false, message: 'Tipo inválido' };

  if (username === cred.username && password === cred.password) {
    // Clear previous session first
    Object.values(AUTH_KEYS).forEach(k => localStorage.removeItem(k));

    if (type === 'admin') {
      localStorage.setItem(AUTH_KEYS.ADMIN, 'true');
      localStorage.setItem(AUTH_KEYS.NAME, 'Administrador');
    } else {
      localStorage.setItem(AUTH_KEYS.USER, 'true');
      localStorage.setItem(AUTH_KEYS.NAME, username);
    }
    localStorage.setItem(AUTH_KEYS.TYPE, type);
    return { success: true };
  }

  return { success: false, message: 'Usuário ou senha incorretos' };
}

/** Clears session and redirects to homepage */
function logout() {
  Object.values(AUTH_KEYS).forEach(k => localStorage.removeItem(k));
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? '../index.html' : 'index.html';
}

// ─── Route Protection ──────────────────────────────────

/**
 * If not logged in: saves destination and redirects to login.
 * If logged in: redirects immediately.
 * @param {string} destination
 * @param {string} [message] - shown on login page
 */
function requireLogin(destination, message) {
  if (isLoggedIn()) {
    if (destination) window.location.href = destination;
    return;
  }
  if (destination) localStorage.setItem(AUTH_KEYS.REDIRECT, destination);
  if (message)     localStorage.setItem('ca_login_msg', message);
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? 'login.html' : 'pages/login.html';
}

/** Redirects non-admins to login */
function requireAdmin() {
  if (!isAdmin()) {
    const inPages = window.location.pathname.includes('/pages/');
    window.location.replace(inPages ? 'login.html' : 'pages/login.html');
  }
}

// ─── Conditional UI ────────────────────────────────────

/**
 * Shows/hides elements based on auth state using data-auth attribute:
 *   data-auth="logged-in"  → visible only when logged in
 *   data-auth="logged-out" → visible only when logged out
 *   data-auth="admin"      → visible only for admins
 */
function applyAuthVisibility() {
  const loggedIn = isLoggedIn();
  const admin    = isAdmin();
  const name     = getUserName();

  document.querySelectorAll('[data-auth]').forEach(el => {
    const rule = el.getAttribute('data-auth');
    if (rule === 'logged-in')  el.style.display = loggedIn ? '' : 'none';
    if (rule === 'logged-out') el.style.display = !loggedIn ? '' : 'none';
    if (rule === 'admin')      el.style.display = admin ? '' : 'none';
  });

  document.querySelectorAll('[data-username]').forEach(el => {
    el.textContent = name;
  });
}

document.addEventListener('DOMContentLoaded', applyAuthVisibility);