/**
 * auth.js — Autenticação e Gerenciamento de Sessão
 * Coracao Animal — PIM III UNIP
 *
 * Usa localStorage (persiste entre abas e recarregamentos).
 * Expõe funções globais usadas em todas as páginas.
 */

// ─── Chaves de Armazenamento ────────────────────────
const AUTH_KEYS = {
  USER:     'ca_user_auth',    // 'true' quando usuário está logado
  ADMIN:    'ca_admin_auth',   // 'true' quando admin está logado
  REDIRECT: 'ca_redirect',     // página para retornar após login
  NAME:     'ca_user_name',    // nome de exibição
  TYPE:     'ca_user_type',    // 'user' | 'admin'
};

// ─── Credenciais (simulação frontend) ──────────────────
const CREDENTIALS = {
  user:  { username: 'usuario', password: 'coracao123' },
  admin: { username: 'admin',   password: 'coracao2026' },
};

// ─── Verificações de Estado ────────────────────────────

/** Retorna true se algum usuário (regular ou admin) está logado */
function isLoggedIn() {
  return localStorage.getItem(AUTH_KEYS.USER)  === 'true'
      || localStorage.getItem(AUTH_KEYS.ADMIN) === 'true';
}

/** Retorna true apenas se o usuário logado é admin */
function isAdmin() {
  return localStorage.getItem(AUTH_KEYS.ADMIN) === 'true';
}

/** Retorna o nome de exibição */
function getUserName() {
  return localStorage.getItem(AUTH_KEYS.NAME) || 'Usuário';
}

// ─── Login / Logout ────────────────────────────────────

/**
 * Tenta fazer login. Retorna { success, message }.
 * @param {string} username
 * @param {string} password
 * @param {'user'|'admin'} type
 */
function attemptLogin(username, password, type) {
  const cred = CREDENTIALS[type];
  if (!cred) return { success: false, message: 'Tipo inválido' };

  if (username === cred.username && password === cred.password) {
    // Limpa sessão anterior primeiro
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

/** Limpa sessão e redireciona para a página inicial */
function logout() {
  Object.values(AUTH_KEYS).forEach(k => localStorage.removeItem(k));
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? '../index.html' : 'index.html';
}

// ─── Proteção de Rotas ─────────────────────────────────

/**
 * Se não estiver logado: salva destino e redireciona para login.
 * Se estiver logado: redireciona imediatamente.
 * @param {string} destination
 * @param {string} [message] - mostrado na página de login
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

/** Redireciona não-admins para login */
function requireAdmin() {
  if (!isAdmin()) {
    const inPages = window.location.pathname.includes('/pages/');
    window.location.replace(inPages ? 'login.html' : 'pages/login.html');
  }
}

// ─── UI Condicional ────────────────────────────────────

/**
 * Mostra/oculta elementos com base no estado de autenticação usando atributo data-auth:
 *   data-auth="logged-in"  → visível apenas quando logado
 *   data-auth="logged-out" → visível apenas quando não logado
 *   data-auth="admin"      → visível apenas para admins
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