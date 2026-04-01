/* animais.js — Cards de animais da home com redirecionamento para login */

const API_URL = 'http://localhost:5000/api';
let todosAnimais = [];

async function carregarAnimais() {
  const grid = document.getElementById('animalGrid');
  try {
    const res = await fetch(`${API_URL}/animais`);
    if (!res.ok) throw new Error();
    const animais = await res.json();
    todosAnimais = animais;
    const disp = animais.filter(a => a.statusAdocao === 'disponivel');
    const el = document.getElementById('statDisponiveis');
    if (el) el.textContent = disp.length;
    renderizar(disp.slice(0, 6));
  } catch {
    grid.innerHTML = `<div class="loading"><p>🔌 API não conectada. Rode o backend em localhost:5000</p></div>`;
  }
}

function gerarCard(a) {
  const isGato = a.especie === 'gato';
  const badge  = isGato ? 'Gato' : 'Cachorro';
  const disp   = a.statusAdocao === 'disponivel';
  return `
    <div class="animal-card">
      <div class="animal-foto">
        ${a.fotoUrl
          ? `<img src="${a.fotoUrl}" alt="${a.nome}" />`
          : `<div class="animal-foto-placeholder">${isGato ? '🐱' : '🐕'}<span>Foto não disponível</span></div>`
        }
      </div>
      <div class="animal-info">
        <div class="animal-nome-row">
          <div class="animal-nome">${a.nome}</div>
          <span class="animal-badge">${badge}</span>
        </div>
        <div class="animal-meta">${a.raca || (isGato ? 'SRD' : 'Vira-lata')} · ${a.idade ? a.idade + ' ano(s)' : '—'}</div>
        <div class="animal-desc">${a.descricao || 'Animal disponível para adoção na ONG Coração Animal.'}</div>
        <button
          class="btn-outline-full"
          ${!disp ? 'disabled' : ''}
          onclick="exigirLogin('pages/adocao.html')">
          🧡 Quero conhecer
        </button>
      </div>
    </div>`;
}

function renderizar(animais) {
  const grid = document.getElementById('animalGrid');
  if (!animais.length) {
    grid.innerHTML = `<div class="empty"><p>🐾 Nenhum animal encontrado.</p></div>`;
    return;
  }
  grid.innerHTML = animais.map(gerarCard).join('');
}

function filtrar(especie, btn) {
  document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const disp = todosAnimais.filter(a => a.statusAdocao === 'disponivel');
  renderizar((especie === 'todos' ? disp : disp.filter(a => a.especie === especie)).slice(0, 6));
}

carregarAnimais();