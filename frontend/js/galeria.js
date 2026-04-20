/*
 * galeria.js — Galeria completa de animais
 * Coração Animal — PIM III UNIP
 *
 * Funcionalidades:
 *  - Busca por nome, especie ou raca (parcial)
 *  - Filtros por especie, porte e status
 *  - Ordenacao por nome ou idade
 *  - Modal de detalhes
 *  - Botao "Cadastrar Animal" visivel apenas para logados
 *  - Todos os botoes de acao exigem login
 */

const API_URL = 'http://localhost:5000/api';

let todosAnimais  = [];
let filtroEspecie = 'todos';
let filtroPorte   = 'todos';
let filtroStatus  = 'disponivel';
let termoBusca    = '';
let ordemAtual    = 'nome';

/* ── Carrega animais da API ──────────────*/
async function carregarAnimais() {
  const grid = document.getElementById('animalGrid');
  grid.innerHTML = `<div class="loading" style="grid-column:1/-1">
    <div class="spinner"></div><p>Buscando animais...</p>
  </div>`;

  try {
    const res = await fetch(`${API_URL}/animais`);
    if (!res.ok) throw new Error('Erro na API');
    todosAnimais = await res.json();
    aplicarFiltros();
  } catch {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div style="font-size:48px;margin-bottom:12px">🔌</div>
        <p style="font-weight:600;margin-bottom:6px">API não conectada</p>
        <p style="font-size:13px;color:var(--text-muted)">Verifique se o backend está rodando em localhost:5000</p>
      </div>`;
  }
}

/* ── Aplica todos os filtros ─────────────*/
function aplicarFiltros() {
  let resultado = [...todosAnimais];

  // Filtro por especie
  if (filtroEspecie !== 'todos') {
    resultado = resultado.filter(a => a.especie === filtroEspecie);
  }

  // Filtro por porte
  if (filtroPorte !== 'todos') {
    resultado = resultado.filter(a =>
      a.porte && a.porte.toLowerCase() === filtroPorte
    );
  }

  // Filtro por status
  if (filtroStatus !== 'todos') {
    resultado = resultado.filter(a => a.statusAdocao === filtroStatus);
  }

  // Busca parcial por nome, especie ou raca
  if (termoBusca.trim() !== '') {
    const termo = termoBusca.toLowerCase().trim();
    resultado = resultado.filter(a =>
      a.nome.toLowerCase().includes(termo)           ||
      (a.especie && a.especie.toLowerCase().includes(termo)) ||
      (a.raca    && a.raca.toLowerCase().includes(termo))
    );
  }

  // Ordenacao
  resultado.sort((a, b) => {
    if (ordemAtual === 'nome')  return a.nome.localeCompare(b.nome);
    if (ordemAtual === 'idade') return (a.idade || 99) - (b.idade || 99);
    return 0;
  });

  // Atualiza contador
  const contador = document.getElementById('contador');
  if (contador) {
    contador.innerHTML = resultado.length > 0
      ? `<span>${resultado.length}</span> animal(is) encontrado(s)`
      : 'Nenhum animal encontrado com esses filtros';
  }

  renderizarGrid(resultado);
}

/* ── Gera HTML de um card ────────────────*/
function gerarCard(a) {
  const isGato  = a.especie === 'gato';
  const emoji   = isGato ? '🐱' : '🐕';
  const badge   = isGato ? 'Gato' : 'Cachorro';
  const disp    = a.statusAdocao === 'disponivel';
  const logado  = typeof estaLogado === 'function' && estaLogado();

  const statusMap = {
    disponivel:    { texto: 'Disponível',   cor: '#2e7d32', bg: '#e8f5e9' },
    em_processo:   { texto: 'Em processo',  cor: '#e65100', bg: '#fff3e0' },
    adotado:       { texto: 'Adotado',      cor: '#1565c0', bg: '#e3f2fd' },
    em_tratamento: { texto: 'Em tratamento',cor: '#c62828', bg: '#fce4ec' },
  };

  const status = statusMap[a.statusAdocao] || { texto: a.statusAdocao, cor: '#666', bg: '#eee' };

  return `
    <div class="animal-card" onclick="abrirModal(${a.idAnimal})">
      <div class="animal-foto">
        ${a.fotoUrl
          ? `<img src="${a.fotoUrl}" alt="Foto de ${a.nome}" loading="lazy" />`
          : `<div class="animal-foto-placeholder">${emoji}<span>Sem foto</span></div>`
        }
        <span class="animal-status-badge"
          style="background:${status.bg};color:${status.cor}">
          ${status.texto}
        </span>
      </div>
      <div class="animal-info">
        <div class="animal-nome-row">
          <div class="animal-nome">${a.nome}</div>
          <span class="animal-badge">${badge}</span>
        </div>
        <div class="animal-meta">
          ${a.raca || (isGato ? 'SRD' : 'Vira-lata')}
          ${a.idade ? ' · ' + a.idade + ' ano(s)' : ''}
          ${a.porte ? ' · ' + a.porte  : ''}
        </div>
        <div class="animal-desc">
          ${a.descricao || 'Animal disponível para adoção na ONG Coração Animal.'}
        </div>
        <button
          class="btn-outline-full"
          ${!disp ? 'disabled' : ''}
          onclick="event.stopPropagation();
            ${disp
              ? `exigirLogin('adocao.html', 'Faça login para iniciar o processo de adoção de ${a.nome}')`
              : 'void(0)'
            }">
          ${disp ? '🧡 Quero conhecer' : 'Indisponível'}
        </button>
      </div>
    </div>`;
}

/* ── Renderiza o grid ────────────────────*/
function renderizarGrid(animais) {
  const grid = document.getElementById('animalGrid');

  if (animais.length === 0) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div style="font-size:48px;margin-bottom:12px">🐾</div>
        <p>Nenhum animal encontrado com esses filtros.</p>
        <button onclick="limparFiltros()" style="margin-top:12px;background:var(--laranja);color:white;border:none;border-radius:50px;padding:8px 20px;cursor:pointer;font-family:'DM Sans',sans-serif">
          Limpar filtros
        </button>
      </div>`;
    return;
  }

  grid.innerHTML = animais.map(gerarCard).join('');
}

/* ── Limpa todos os filtros ──────────────*/
function limparFiltros() {
  filtroEspecie = 'todos';
  filtroPorte   = 'todos';
  filtroStatus  = 'disponivel';
  termoBusca    = '';

  // Reseta botoes ativos
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.filtro-btn[onclick*="todos"]').forEach(b => b.classList.add('active'));

  // Limpa campo de busca
  const busca = document.getElementById('inputBusca');
  if (busca) busca.value = '';

  aplicarFiltros();
}

/* ── Modal de detalhes ───────────────────*/
function abrirModal(id) {
  const a = todosAnimais.find(x => x.idAnimal === id);
  if (!a) return;

  const isGato = a.especie === 'gato';
  const emoji  = isGato ? '🐱' : '🐕';
  const disp   = a.statusAdocao === 'disponivel';

  // Foto
  const fotoEl = document.getElementById('modalFoto');
  fotoEl.innerHTML = `
    ${a.fotoUrl
      ? `<img src="${a.fotoUrl}" alt="Foto de ${a.nome}" style="width:100%;height:100%;object-fit:cover"/>`
      : `<div class="animal-foto-placeholder" style="height:100%">${emoji}</div>`
    }
    <button class="modal-fechar" onclick="fecharModal()">✕</button>`;

  // Dados
  document.getElementById('modalNome').textContent  = a.nome;
  document.getElementById('modalBadge').textContent = isGato ? 'Gato' : 'Cachorro';
  document.getElementById('modalMeta').innerHTML    = `
    <strong>Raça:</strong> ${a.raca || 'SRD'} &nbsp;·&nbsp;
    <strong>Idade:</strong> ${a.idade ? a.idade + ' ano(s)' : 'Não informada'} &nbsp;·&nbsp;
    <strong>Porte:</strong> ${a.porte || 'Não informado'}`;
  document.getElementById('modalDesc').textContent  =
    a.descricao || 'Sem descrição disponível para este animal.';

  // Botao de adotar
  const btn = document.getElementById('modalBtnAdotar');
  btn.disabled    = !disp;
  btn.textContent = disp ? '🧡 Quero adotar' : 'Indisponível';
  btn.onclick     = disp
    ? () => exigirLogin('adocao.html', `Faça login para adotar ${a.nome}`)
    : null;

  document.getElementById('modalOverlay').classList.add('aberto');
  document.body.style.overflow = 'hidden';
}

function fecharModal() {
  document.getElementById('modalOverlay').classList.remove('aberto');
  document.body.style.overflow = '';
}

/* ── Handlers de filtro ──────────────────*/
function setFiltroEspecie(v, btn) {
  filtroEspecie = v;
  document.querySelectorAll('.grupo-especie').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltros();
}

function setFiltroPorte(v, btn) {
  filtroPorte = v;
  document.querySelectorAll('.grupo-porte').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltros();
}

function setFiltroStatus(v, btn) {
  filtroStatus = v;
  document.querySelectorAll('.grupo-status').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltros();
}

function onOrdem(v) {
  ordemAtual = v;
  aplicarFiltros();
}

// Busca com debounce — espera 300ms apos digitar
let debounceTimer;
function onBusca(v) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    termoBusca = v;
    aplicarFiltros();
  }, 300);
}

// Inicializa
carregarAnimais();