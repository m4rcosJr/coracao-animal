// ============================================================
// auth.js — Módulo de Autenticação Coração Animal
// Login fictício: dados simulados, sem backend real
// ============================================================

const Auth = {
  TOKEN_KEY: 'ca_token',
  USER_KEY:  'ca_user',

  // ── Usuários fictícios ──────────────────────────────────
  FAKE_USERS: [
    {
      id: 1,
      nome: 'Admin Coração Animal',
      email: 'admin@coracaoanimal.org',
      senha: 'admin123',
      role: 'admin',
      avatar: 'A'
    },
    {
      id: 2,
      nome: 'Maria Silva',
      email: 'maria@email.com',
      senha: '123456',
      role: 'usuario',
      avatar: 'M'
    },
    {
      id: 3,
      nome: 'João Santos',
      email: 'joao@email.com',
      senha: '123456',
      role: 'usuario',
      avatar: 'J'
    }
  ],

  // ── Gerenciamento de sessão ─────────────────────────────
  setSession(user) {
    // Gera token fictício
    const token = btoa(JSON.stringify({ id: user.id, role: user.role, ts: Date.now() }));
    const userData = { id: user.id, nome: user.nome, email: user.email, role: user.role, avatar: user.avatar };
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(userData));
  },

  clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  },

  getUser() {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u) : null;
  },

  getToken() {
    return localStorage.getItem(this.TOKEN_KEY);
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user?.role === 'admin';
  },

  // ── Login fictício ──────────────────────────────────────
  login(email, senha) {
    const user = this.FAKE_USERS.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha
    );
    if (user) {
      this.setSession(user);
      return { success: true, user };
    }
    return { success: false, message: 'E-mail ou senha incorretos.' };
  },

  // ── Cadastro fictício ───────────────────────────────────
  register(nome, email, senha) {
    const existe = this.FAKE_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existe) {
      return { success: false, message: 'Este e-mail já está cadastrado.' };
    }
    const newUser = {
      id: this.FAKE_USERS.length + 1,
      nome,
      email,
      senha,
      role: 'usuario',
      avatar: nome.charAt(0).toUpperCase()
    };
    this.FAKE_USERS.push(newUser);
    this.setSession(newUser);
    return { success: true, user: newUser };
  },

  logout() {
    this.clearSession();
    window.location.href = this._getBasePath() + 'index.html';
  },

  // ── Guards de rota ──────────────────────────────────────
  requireLogin(redirectAfter = null) {
    if (!this.isLoggedIn()) {
      if (redirectAfter) {
        sessionStorage.setItem('ca_redirect', redirectAfter);
      }
      window.location.href = this._getBasePath() + 'pages/login.html';
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.isLoggedIn() || !this.isAdmin()) {
      sessionStorage.setItem('ca_redirect', window.location.href);
      window.location.href = this._getBasePath() + 'pages/login.html';
      return false;
    }
    return true;
  },

  redirectAfterLogin() {
    const dest = sessionStorage.getItem('ca_redirect');
    sessionStorage.removeItem('ca_redirect');
    if (dest) {
      window.location.href = dest;
    } else {
      const user = this.getUser();
      window.location.href = this._getBasePath() + (user?.role === 'admin' ? 'pages/admin.html' : 'index.html');
    }
  },

  // ── Helpers ─────────────────────────────────────────────
  _getBasePath() {
    const path = window.location.pathname;
    if (path.includes('/pages/')) return '../';
    return '';
  },

  // ── Renderiza navbar dinâmica ───────────────────────────
  // Chame Auth.renderNavbar('nav-auth-slot') nos HTMLs existentes
  renderNavbar(slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return;

    if (this.isLoggedIn()) {
      const user = this.getUser();
      slot.innerHTML = `
        <div class="nav-user">
          <div class="nav-avatar" title="${user.nome}">${user.avatar}</div>
          <span class="nav-user-name">${user.nome.split(' ')[0]}</span>
          ${user.role === 'admin' ? '<a href="../pages/admin.html" class="nav-admin-badge">Admin</a>' : ''}
          <button onclick="Auth.logout()" class="btn-logout">Sair</button>
        </div>
      `;
    } else {
      slot.innerHTML = `
        <a href="${this._getBasePath()}pages/login.html" class="btn-login-nav">Entrar / Cadastrar</a>
      `;
    }
  }
};

// Expõe globalmente
window.Auth = Auth;