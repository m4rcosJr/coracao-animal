/* ─────────────────────────────────────────
   CORACAO ANIMAL — Gerenciamento de Tema
   tema.js
   Contem: dark/light mode com localStorage
───────────────────────────────────────── */

/**
 * Inicializa o tema ao carregar a pagina.
 * Verifica se o usuario ja escolheu um tema antes.
 * Se nao, aplica o dark como padrao.
 */
function inicializarTema() {
  const temaSalvo = localStorage.getItem('tema') || 'dark';
  aplicarTema(temaSalvo);
}

/**
 * Aplica o tema no HTML e atualiza o botao da navbar.
 * @param {string} tema - 'dark' ou 'light'
 */
function aplicarTema(tema) {
  // Aplica o atributo data-theme no elemento HTML
  // As variaveis CSS mudam automaticamente conforme o tema
  document.documentElement.setAttribute('data-theme', tema);

  // Atualiza o icone e texto do botao de tema na navbar
  const icone = document.getElementById('temaIcone');
  const texto = document.getElementById('temaTexto');

  if (!icone || !texto) return;

  if (tema === 'dark') {
    icone.textContent = '🌙';
    texto.textContent = 'Dark';
  } else {
    icone.textContent = '☀️';
    texto.textContent = 'Light';
  }
}

/**
 * Alterna entre dark e light.
 * Salva a escolha no localStorage para persistir entre paginas.
 */
function alternarTema() {
  const temaAtual = document.documentElement.getAttribute('data-theme');
  const novoTema = temaAtual === 'dark' ? 'light' : 'dark';
  aplicarTema(novoTema);
  localStorage.setItem('tema', novoTema);
}

// Inicializa o tema assim que o script e carregado
inicializarTema();