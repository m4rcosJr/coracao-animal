/* ─────────────────────────────────────────
   CORACAO ANIMAL — Logica da Galeria
   galeria.js
   Contem: busca, filtros, ordenacao e modal
───────────────────────────────────────── */

const API_URL = 'http://localhost:5000/api';

// Armazena todos os animais buscados da API
let todosAnimais = [];

// Filtros ativos no momento
let filtroEspecie = 'todos';
let filtroPorte   = 'todos';
let filtroStatus  = 'disponivel';
let termoBusca    = '';
let ordemAtual    = 'nome';

/* ── Busca os animais na API ─────────────*/
async function carregarAnimais() {
  const grid = document.getElementById('animalGrid');

  try {
    const resposta = await fetch(`${API_URL}/animais`);
    if (!resposta.ok) throw new Error('Erro na API');

    const animais = await resposta.json();
    todosAnimais = animais;

    // Aplica os filtros e renderiza
    aplicarFiltros();

  } catch (erro) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div class="empty-icon">🔌</div>
        <p>Nao foi possivel conectar a API.</p>
        <p style="font-size:12px;margin-top:6px;">
          Verifique se o backend esta rodando em localhost:5000
        </p>
      </div>
    `;
  }
}

/* ── Aplica todos os filtros ativos ──────*/
function aplicarFiltros() {
  let resultado = [...todosAnimais];

  // Filtro por especie (cao ou gato)
  if (filtroEspecie !== 'todos') {
    resultado = resultado.filter(a => a.especie === filtroEspecie);
  }

  // Filtro por porte (pequeno, medio, grande)
  if (filtroPorte !== 'todos') {
    resultado = resultado.filter(a => a.porte === filtroPorte);
  }

  // Filtro por status (disponivel, adotado, etc.)
  if (filtroStatus !== 'todos') {
    resultado = resultado.filter(a => a.statusAdocao === filtroStatus);
  }

  // Filtro por termo de busca (nome ou raca)
  if (termoBusca.trim() !== '') {
    const termo = termoBusca.toLowerCase();
    resultado = resultado.filter(a =>
      a.nome.toLowerCase().includes(termo) ||
      (a.raca && a.raca.toLowerCase().includes(termo))
    );
  }

  // Ordenacao
  resultado = ordenar(resultado, ordemAtual);

  // Atualiza o contador de resultados
  const contador = document.getElementById('contador');
  if (contador) {
    contador.innerHTML = `<span>${resultado.length}</span> animal(is) encontrado(s)`;
  }

  // Renderiza o resultado final
  renderizarGrid(resultado);
}

/* ── Ordena os animais ───────────────────*/
function ordenar(animais, criterio) {
  return [...animais].sort((a, b) => {
    if (criterio === 'nome')  return a.nome.localeCompare(b.nome);
    if (criterio === 'idade') return (a.idade || 99) - (b.idade || 99);
    return 0;
  });
}

/* ── Renderiza o grid de cards ───────────*/
function renderizarGrid(animais) {
  const grid = document.getElementById('animalGrid');

  if (animais.length === 0) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div class="empty-icon">🐾</div>
        <p>Nenhum animal encontrado com esses filtros.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = animais.map(animal => {
    const isGato    = animal.especie === 'gato';
    const emoji     = isGato ? '🐱' : '🐕';
    const bgClass   = isGato ? 'gato-bg' : 'cao-bg';
    const disponivel = animal.statusAdocao === 'disponivel';

    const statusTexto = {
      'disponivel':    'Disponivel',
      'em_processo':   'Em processo',
      'adotado':       'Adotado',
      'em_tratamento': 'Em tratamento'
    }[animal.statusAdocao] || animal.statusAdocao;

    return `
      <div class="animal-card" onclick="abrirModal(${animal.idAnimal})">
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
            ${animal.raca || (isGato ? 'Gato' : 'Cao')} &middot;
            ${animal.idade ? animal.idade + ' ano(s)' : 'Idade desconhecida'} &middot;
            ${animal.porte || 'Porte nao informado'}
          </div>
          <div class="animal-tags">
            <span class="tag">${isGato ? '🐱 Gato' : '🐕 Cao'}</span>
            ${animal.porte ? `<span class="tag">${animal.porte}</span>` : ''}
          </div>
          ${animal.descricao
            ? `<div class="animal-desc">${animal.descricao}</div>`
            : ''
          }
          <button
            class="btn-adotar"
            ${!disponivel ? 'disabled' : ''}
            onclick="event.stopPropagation(); window.location.href='adocao.html'">
            ${disponivel ? 'Quero adotar' : 'Indisponivel'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Abre o modal de detalhes ────────────*/
function abrirModal(idAnimal) {
  const animal = todosAnimais.find(a => a.idAnimal === idAnimal);
  if (!animal) return;

  const isGato  = animal.especie === 'gato';
  const emoji   = isGato ? '🐱' : '🐕';
  const bgClass = isGato ? 'gato-bg' : 'cao-bg';
  const disponivel = animal.statusAdocao === 'disponivel';

  // Preenche o modal com os dados do animal
  document.getElementById('modalFoto').innerHTML = animal.fotoUrl
    ? `<img src="${animal.fotoUrl}" alt="${animal.nome}" />`
    : `<div class="animal-foto-placeholder ${bgClass}" style="width:100%;height:100%">${emoji}</div>`;

  document.getElementById('modalNome').textContent = animal.nome;

  document.getElementById('modalMeta').textContent =
    `${animal.raca || (isGato ? 'Gato' : 'Cao')} · ${animal.idade ? animal.idade + ' ano(s)' : 'Idade desconhecida'} · ${animal.porte || '—'}`;

  document.getElementById('modalTags').innerHTML = `
    <span class="tag">${isGato ? '🐱 Gato' : '🐕 Cao'}</span>
    ${animal.porte ? `<span class="tag">${animal.porte}</span>` : ''}
    <span class="tag status-${animal.statusAdocao}" style="position:static">
      ${disponivel ? 'Disponivel' : animal.statusAdocao}
    </span>
  `;

  document.getElementById('modalDesc').textContent =
    animal.descricao || 'Sem descricao disponivel para este animal.';

  // Botao de adotar no modal
  const btnAdotar = document.getElementById('modalBtnAdotar');
  btnAdotar.textContent = disponivel ? 'Quero adotar' : 'Indisponivel';
  btnAdotar.disabled = !disponivel;
  if (disponivel) {
    btnAdotar.onclick = () => window.location.href = 'adocao.html';
  }

  // Abre o modal
  document.getElementById('modalOverlay').classList.add('aberto');
}

/* ── Fecha o modal ───────────────────────*/
function fecharModal() {
  document.getElementById('modalOverlay').classList.remove('aberto');
}

/* ── Handlers de filtro ──────────────────*/

// Atualiza o filtro de especie e re-aplica
function setFiltroEspecie(especie, btn) {
  filtroEspecie = especie;
  document.querySelectorAll('.grupo-especie .filtro-btn')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltros();
}

// Atualiza o filtro de porte e re-aplica
function setFiltroPorte(porte, btn) {
  filtroPorte = porte;
  document.querySelectorAll('.grupo-porte .filtro-btn')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltros();
}

// Atualiza o filtro de status e re-aplica
function setFiltroStatus(status, btn) {
  filtroStatus = status;
  document.querySelectorAll('.grupo-status .filtro-btn')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  aplicarFiltros();
}

// Atualiza o termo de busca com debounce (espera 300ms antes de filtrar)
let debounceTimer;
function onBusca(valor) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    termoBusca = valor;
    aplicarFiltros();
  }, 300);
}

// Atualiza a ordenacao e re-aplica
function onOrdem(valor) {
  ordemAtual = valor;
  aplicarFiltros();
}

// Inicializa
carregarAnimais();