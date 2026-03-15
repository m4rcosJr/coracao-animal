/* ─────────────────────────────────────────
   CORACAO ANIMAL — Logica de Animais
   animais.js
   Contem: busca na API, renderizacao e filtros
───────────────────────────────────────── */

// URL base da API — aponta para o backend ASP.NET Core
const API_URL = 'http://localhost:5000/api';

// Armazena todos os animais buscados da API
// Usado para filtrar sem precisar buscar novamente
let todosAnimais = [];

/**
 * Busca os animais na API e renderiza na tela.
 * Chamada automaticamente ao carregar a pagina.
 */
async function carregarAnimais() {
  const grid = document.getElementById('animalGrid');
  if (!grid) return;

  try {
    // Faz requisicao GET para o endpoint de animais
    const resposta = await fetch(`${API_URL}/animais`);

    // Se a API nao respondeu corretamente, lanca um erro
    if (!resposta.ok) throw new Error('Erro ao buscar animais');

    // Converte a resposta para JSON
    const animais = await resposta.json();
    todosAnimais = animais;

    // Filtra apenas os disponiveis para a home
    const disponiveis = animais.filter(a => a.statusAdocao === 'disponivel');

    // Atualiza o numero de disponiveis nas estatisticas do hero
    const totalEl = document.getElementById('totalDisponiveis');
    if (totalEl) totalEl.textContent = disponiveis.length;

    // Renderiza os primeiros 6 animais disponiveis
    renderizarAnimais(disponiveis.slice(0, 6));

  } catch (erro) {
    // Se der erro (ex: API nao esta rodando), mostra mensagem amigavel
    grid.innerHTML = `
      <div class="empty" style="grid-column: 1/-1;">
        <div class="empty-icon">🔌</div>
        <p>Nao foi possivel conectar a API.</p>
        <p style="font-size:12px;margin-top:6px;">
          Verifique se o backend esta rodando em localhost:5000
        </p>
      </div>
    `;
  }
}

/**
 * Gera o HTML de um card de animal.
 * @param {Object} animal - objeto animal vindo da API
 * @returns {string} HTML do card
 */
function gerarCardAnimal(animal) {
  // Define o emoji e fundo conforme a especie
  const isGato = animal.especie === 'gato';
  const emoji = isGato ? '🐱' : '🐕';
  const bgClass = isGato ? 'gato-bg' : 'cao-bg';

  // Define o texto do status
  const statusTexto = {
    'disponivel':  'Disponível',
    'em_processo': 'Em processo',
    'adotado':     'Adotado',
    'em_tratamento': 'Em tratamento'
  }[animal.statusAdocao] || animal.statusAdocao;

  return `
    <div class="animal-card" onclick="window.location.href='pages/animais.html'">
      <div class="animal-foto">
        ${animal.fotoUrl
          ? `<img src="${animal.fotoUrl}" alt="${animal.nome}" />`
          : `<div class="animal-foto-placeholder ${bgClass}">${emoji}</div>`
        }
        <span class="status-badge status-${animal.statusAdocao}">
          ${statusTexto}
        </span>
      </div>
      <div class="animal-info">
        <div class="animal-nome">${animal.nome}</div>
        <div class="animal-meta">
          ${animal.raca || (isGato ? 'Gato' : 'Cão')} ·
          ${animal.idade ? animal.idade + ' ano(s)' : 'Idade desconhecida'} ·
          ${animal.porte || '—'}
        </div>
        <div class="animal-tags">
          <span class="tag">${isGato ? '🐱 Gato' : '🐕 Cão'}</span>
          ${animal.porte ? `<span class="tag">${animal.porte}</span>` : ''}
        </div>
        <button
          class="btn-adotar"
          onclick="event.stopPropagation(); window.location.href='pages/adocao.html'">
          Quero adotar
        </button>
      </div>
    </div>
  `;
}

/**
 * Renderiza uma lista de animais no grid.
 * @param {Array} animais - lista de objetos animal
 */
function renderizarAnimais(animais) {
  const grid = document.getElementById('animalGrid');
  if (!grid) return;

  if (animais.length === 0) {
    grid.innerHTML = `
      <div class="empty" style="grid-column: 1/-1;">
        <div class="empty-icon">🐾</div>
        <p>Nenhum animal encontrado com esse filtro.</p>
      </div>
    `;
    return;
  }

  // Gera e injeta o HTML de todos os cards
  grid.innerHTML = animais.map(gerarCardAnimal).join('');
}

/**
 * Filtra os animais por especie.
 * @param {string} especie - 'todos', 'cao' ou 'gato'
 * @param {HTMLElement} botao - botao clicado para ativar o estilo
 */
function filtrar(especie, botao) {
  // Remove a classe active de todos os botoes de filtro
  document.querySelectorAll('.filtro-btn')
    .forEach(b => b.classList.remove('active'));

  // Adiciona active no botao clicado
  botao.classList.add('active');

  // Filtra os animais disponiveis conforme a especie escolhida
  const disponiveis = todosAnimais.filter(a => a.statusAdocao === 'disponivel');
  const filtrados = especie === 'todos'
    ? disponiveis
    : disponiveis.filter(a => a.especie === especie);

  // Renderiza os animais filtrados (max 6 na home)
  renderizarAnimais(filtrados.slice(0, 6));
}

// Carrega os animais ao iniciar a pagina
carregarAnimais();