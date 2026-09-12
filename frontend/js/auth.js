/**
 * auth.js — Autenticação e Gerenciamento de Sessão
 * Coracao Animal — PIM IV UNIP
 *
 * Agora usa a API real (JWT) em vez de credenciais fixas.
 * O token e os dados do usuario ficam no localStorage, mas quem decide
 * usuario/senha e o tipo (admin/user) e sempre o backend.
 */

const API_BASE = 'http://localhost:5000/api';

// ─── Chaves de Armazenamento ────────────────────────
const AUTH_KEYS = {
    TOKEN: 'ca_token',        // token JWT retornado pela API
    NAME: 'ca_user_name',    // nome de exibicao
    EMAIL: 'ca_user_email',
    TYPE: 'ca_user_type',    // 'user' | 'admin' — vem da API, nao e escolhido na tela
    EXPIRES: 'ca_token_expires',// data/hora de expiracao do token
    REDIRECT: 'ca_redirect',     // pagina para retornar apos login
};

// ─── Verificações de Estado ────────────────────────────

/** Retorna true se existe um token valido (nao expirado) */
function isLoggedIn() {
    const token = localStorage.getItem(AUTH_KEYS.TOKEN);
    if (!token) return false;

    const expiraEm = localStorage.getItem(AUTH_KEYS.EXPIRES);
    if (expiraEm && new Date(expiraEm) <= new Date()) {
        // Token expirado — limpa a sessao sozinho
        logout();
        return false;
    }
    return true;
}

/** Retorna true apenas se o usuario logado e admin (segundo a API) */
function isAdmin() {
    return isLoggedIn() && localStorage.getItem(AUTH_KEYS.TYPE) === 'admin';
}

/** Retorna o nome de exibicao */
function getUserName() {
    return localStorage.getItem(AUTH_KEYS.NAME) || 'Usuário';
}

/** Retorna o token JWT, para usar no cabecalho Authorization de outras chamadas */
function getToken() {
    return localStorage.getItem(AUTH_KEYS.TOKEN);
}

// ─── Login / Cadastro / Logout ──────────────────────────

/**
 * Tenta fazer login na API real.
 * @param {string} email
 * @param {string} senha
 * @returns {Promise<{success: boolean, message?: string, tipo?: string}>}
 */
async function attemptLogin(email, senha) {
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });

        const dados = await res.json();

        if (!res.ok) {
            return { success: false, message: dados.mensagem || 'E-mail ou senha incorretos' };
        }

        // Limpa sessao anterior e grava a nova
        Object.values(AUTH_KEYS).forEach(k => localStorage.removeItem(k));
        localStorage.setItem(AUTH_KEYS.TOKEN, dados.token);
        localStorage.setItem(AUTH_KEYS.NAME, dados.nomeCompleto);
        localStorage.setItem(AUTH_KEYS.EMAIL, dados.email);
        localStorage.setItem(AUTH_KEYS.TYPE, dados.tipo);
        localStorage.setItem(AUTH_KEYS.EXPIRES, dados.expiraEm);

        return { success: true, tipo: dados.tipo };
    } catch (erro) {
        return { success: false, message: 'Não foi possível conectar ao servidor' };
    }
}

/**
 * Cria uma nova conta (sempre tipo "user" — admin so e promovido manualmente no banco).
 * @returns {Promise<{success: boolean, message?: string}>}
 */
async function attemptRegister(nomeCompleto, email, senha) {
    try {
        const res = await fetch(`${API_BASE}/auth/registrar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nomeCompleto, email, senha })
        });

        const dados = await res.json();

        if (!res.ok) {
            return { success: false, message: dados.mensagem || 'Não foi possível criar a conta' };
        }

        Object.values(AUTH_KEYS).forEach(k => localStorage.removeItem(k));
        localStorage.setItem(AUTH_KEYS.TOKEN, dados.token);
        localStorage.setItem(AUTH_KEYS.NAME, dados.nomeCompleto);
        localStorage.setItem(AUTH_KEYS.EMAIL, dados.email);
        localStorage.setItem(AUTH_KEYS.TYPE, dados.tipo);
        localStorage.setItem(AUTH_KEYS.EXPIRES, dados.expiraEm);

        return { success: true };
    } catch (erro) {
        return { success: false, message: 'Não foi possível conectar ao servidor' };
    }
}

/** Limpa sessao e redireciona para a pagina inicial */
function logout() {
    Object.values(AUTH_KEYS).forEach(k => localStorage.removeItem(k));
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? '../index.html' : 'index.html';
}

// ─── Proteção de Rotas ─────────────────────────────────

function requireLogin(destination, message) {
    if (isLoggedIn()) {
        if (destination) window.location.href = destination;
        return;
    }
    if (destination) localStorage.setItem(AUTH_KEYS.REDIRECT, destination);
    if (message) localStorage.setItem('ca_login_msg', message);
    const inPages = window.location.pathname.includes('/pages/');
    window.location.href = inPages ? 'login.html' : 'pages/login.html';
}

function requireAdmin() {
    if (!isAdmin()) {
        const inPages = window.location.pathname.includes('/pages/');
        window.location.replace(inPages ? 'login.html' : 'pages/login.html');
    }
}

// ─── UI Condicional ────────────────────────────────────

function applyAuthVisibility() {
    const loggedIn = isLoggedIn();
    const admin = isAdmin();
    const name = getUserName();

    document.querySelectorAll('[data-auth]').forEach(el => {
        const rule = el.getAttribute('data-auth');
        if (rule === 'logged-in') el.style.display = loggedIn ? '' : 'none';
        if (rule === 'logged-out') el.style.display = !loggedIn ? '' : 'none';
        if (rule === 'admin') el.style.display = admin ? '' : 'none';
    });

    document.querySelectorAll('[data-username]').forEach(el => {
        el.textContent = name;
    });
}

document.addEventListener('DOMContentLoaded', applyAuthVisibility);