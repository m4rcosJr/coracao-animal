/*
 * auth.js — Sistema de autenticacao do frontend
 *
 * Gerencia login/logout e protecao de acoes que exigem autenticacao.
 *
 * Como funciona:
 * 1. Qualquer botao de acao (adotar, doar, voluntario) chama exigirLogin()
 * 2. Se o usuario nao estiver logado, salva a pagina de destino e redireciona para login
 * 3. Apos o login, redireciona automaticamente para onde o usuario queria ir
 * 4. O admin tem protecao separada — so admin pode acessar
 */

// Chave do sessionStorage para usuario comum (adotante)
const CHAVE_USER  = 'coracao_user_auth';

// Chave do sessionStorage para admin
const CHAVE_ADMIN = 'coracao_admin_auth';

// Chave para salvar o destino apos login
const CHAVE_REDIRECT = 'coracao_redirect';

/* ── Verifica se usuario esta logado ─────*/
function estaLogado() {
  return sessionStorage.getItem(CHAVE_USER) === 'true'
      || sessionStorage.getItem(CHAVE_ADMIN) === 'true';
}

/* ── Verifica se e admin ─────────────────*/
function eAdmin() {
  return sessionStorage.getItem(CHAVE_ADMIN) === 'true';
}

/*
 * Exige login antes de executar uma acao.
 * Se nao estiver logado, salva o destino e vai para o login.
 *
 * @param {string} destino - URL para redirecionar apos login
 *                           ex: 'adocao.html', 'doacoes.html'
 */
function exigirLogin(destino) {
  if (estaLogado()) {
    // Ja esta logado — vai direto para o destino
    window.location.href = destino;
  } else {
    // Salva o destino para redirecionar apos o login
    sessionStorage.setItem(CHAVE_REDIRECT, destino);

    // Descobre o prefixo do caminho (raiz ou pages/)
    const estaEmPages = window.location.pathname.includes('/pages/');
    const caminhoLogin = estaEmPages ? 'login.html' : 'pages/login.html';

    window.location.href = caminhoLogin;
  }
}

/*
 * Protege a pagina do admin.
 * Chame no topo do admin.html — redireciona se nao for admin.
 */
function protegerAdmin() {
  if (!eAdmin()) {
    window.location.replace('login.html');
  }
}

/*
 * Realiza o logout do usuario comum ou admin.
 */
function fazerLogout() {
  sessionStorage.removeItem(CHAVE_USER);
  sessionStorage.removeItem(CHAVE_ADMIN);
  sessionStorage.removeItem(CHAVE_REDIRECT);

  const estaEmPages = window.location.pathname.includes('/pages/');
  window.location.href = estaEmPages ? '../index.html' : 'index.html';
}