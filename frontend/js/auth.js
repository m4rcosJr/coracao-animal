/**
 * auth.js - Authentication & Session Management
 * Coracao Animal - PIM III UNIP
 *
 * Handles login, logout, session persistence,
 * route protection, and conditional UI rendering.
 */

// ─── Storage Keys ────────────────────────────
const AUTH_KEYS = {
  USER:     'ca_user_auth',
  ADMIN:    'ca_admin_auth',
  REDIRECT: 'ca_redirect',
  NAME:     'ca_user_name',
  TYPE:     'ca_user_type',  // 'user' | 'admin'
};

// ─── Credentials (frontend simulation) ───────
const CREDENTIALS = {
  user:  { username: 'usuario', password: 'coracao123' },
  admin: { username: 'admin',   password: 'coracao2025' },
};

// ─── Core Auth Functions ──────────────────────

/** Returns true if any user (regular or admin) is logged in */
function isLoggedIn() {
  return localStorage.getItem(AUTH_KEYS.USER)  === 'true'
      || localStorage.getItem(AUTH_KEYS.ADMIN) === 'true';
}

/** Returns true only if the logged-in user is admin */
function isAdmin() {
  return localStorage.getItem(AUTH_KEYS.ADMIN) === 'true';
}

/** Returns the display name of the logged-in user */
function getUserName() {
  return localStorage.getItem(AUTH_KEYS.NAME) || 'Usuário';
}

/** Returns the user type: 'admin', 'user', or null */
function getUserType() {
  return localStorage.getItem(AUTH_KEYS.TYPE) || null;
}

// ─── Login & Logout ───────────────────────────

/**
 * Attempts login with given credentials.
 * @param {string} username
 * @param {string} password
 * @param {'user'|'admin'} type
 * @returns {{ success: boolean, message: string }}
 */
function attemptLogin(username, password, type) {
  const cred = CREDENTIALS[type];
  if (!cred) return { success: false, message: 'Invalid user type' };

  if (username === cred.username && password === cred.password) {
    // Clear previous session
    clearSession();

    // Set new session in localStorage (persists across tabs/reload)
    if (type === 'admin') {
      localStorage.setItem(AUTH_KEYS.ADMIN, 'true');
      localStorage.setItem(AUTH_KEYS.NAME, 'Administrador');
    } else {
      localStorage.setItem(AUTH_KEYS.USER, 'true');
      localStorage.setItem(AUTH_KEYS.NAME, username);
    }
    localStorage.setItem(AUTH_KEYS.TYPE, type);

    return { success: true, message: 'Login successful' };
  }

  return { success: false, message: 'Invalid username or password' };
}

/** Clears all session data from localStorage */
function clearSession() {
  Object.values(AUTH_KEYS).forEach(key => localStorage.removeItem(key));
}

/** Logs out and redirects to homepage */
function logout() {
  clearSession();
  const isInPages = window.location.pathname.includes('/pages/');
  window.location.href = isInPages ? '../index.html' : 'index.html';
}

// ─── Route Protection ─────────────────────────

/**
 * Requires login to access a page/action.
 * Saves destination so user is redirected after login.
 * @param {string} destination - URL to redirect after login
 * @param {string} [message]   - Optional message shown on login page
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

/** Protects admin-only pages. Redirects if not admin. */
function requireAdmin() {
  if (!isAdmin()) {
    const inPages = window.location.pathname.includes('/pages/');
    window.location.replace(inPages ? 'login.html' : 'pages/login.html');
  }
}

/** Protects any page requiring login. */
function requireAuth() {
  if (!isLoggedIn()) {
    const currentPage = window.location.pathname.split('/').pop();
    localStorage.setItem(AUTH_KEYS.REDIRECT, currentPage);
    const inPages = window.location.pathname.includes('/pages/');
    window.location.replace(inPages ? 'login.html' : 'pages/login.html');
  }
}

// ─── Conditional UI Rendering ─────────────────

/**
 * Shows/hides elements based on auth state.
 * Uses data attributes on HTML elements:
 *   data-auth="logged-in"  → visible only when logged in
 *   data-auth="logged-out" → visible only when logged out
 *   data-auth="admin"      → visible only when admin
 */
function applyAuthVisibility() {
  const loggedIn = isLoggedIn();
  const admin    = isAdmin();
  const name     = getUserName();

  document.querySelectorAll('[data-auth]').forEach(el => {
    const rule = el.getAttribute('data-auth');
    switch (rule) {
      case 'logged-in':  el.style.display = loggedIn ? '' : 'none'; break;
      case 'logged-out': el.style.display = !loggedIn ? '' : 'none'; break;
      case 'admin':      el.style.display = admin ? '' : 'none'; break;
    }
  });

  // Update username display elements
  document.querySelectorAll('[data-username]').forEach(el => {
    el.textContent = name;
  });
}

// Apply visibility on DOM ready
document.addEventListener('DOMContentLoaded', applyAuthVisibility);