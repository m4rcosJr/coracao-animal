/* galeria.js — Galeria completa de animais com filtros e modal */

const API_URL = 'http://localhost:5000/api';
let todosAnimais = [], filtroEspecie='todos', filtroPorte='todos',
    filtroStatus='disponivel', termoBusca='', ordemAtual='nome';

async function carregarAnimais() {
  const grid = document.getElementById('animalGrid');
  try {
    const res = await fetch(`${API_URL}/animais`);
    if (!res.ok) throw new Error();
    todosAnimais = await res.json();
    aplicarFiltros();
  } catch {
    grid.innerHTML = `<div class="loading"><p>🔌 API não conectada.</p></div>`;
  }
}

function aplicarFiltros() {
  let r = [...todosAnimais];
  if (filtroEspecie !== 'todos') r = r.filter(a => a.especie === filtroEspecie);
  if (filtroPorte   !== 'todos') r = r.filter(a => a.porte === filtroPorte);
  if (filtroStatus  !== 'todos') r = r.filter(a => a.statusAdocao === filtroStatus);
  if (termoBusca.trim()) {
    const t = termoBusca.toLowerCase();
    r = r.filter(a => a.nome.toLowerCase().includes(t) || (a.raca && a.raca.toLowerCase().includes(t)));
  }
  r = [...r].sort((a,b) => ordemAtual === 'nome' ? a.nome.localeCompare(b.nome) : (a.idade||99)-(b.idade||99));
  const el = document.getElementById('contador');
  if (el) el.innerHTML = `<span>${r.length}</span> animal(is) encontrado(s)`;
  renderizarGrid(r);
}

function gerarCard(a) {
  const isGato = a.especie === 'gato';
  const badge  = isGato ? 'Gato' : 'Cachorro';
  const disp   = a.statusAdocao === 'disponivel';
  return `
    <div class="animal-card" onclick="abrirModal(${a.idAnimal})">
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
          onclick="event.stopPropagation(); exigirLogin('adocao.html')">
          ${disp ? '🧡 Quero conhecer' : 'Indisponível'}
        </button>
      </div>
    </div>`;
}

function renderizarGrid(animais) {
  const grid = document.getElementById('animalGrid');
  grid.innerHTML = animais.length ? animais.map(gerarCard).join('') : `<div class="empty"><p>🐾 Nenhum animal encontrado.</p></div>`;
}

function abrirModal(id) {
  const a = todosAnimais.find(x => x.idAnimal === id);
  if (!a) return;
  const isGato = a.especie === 'gato';
  document.getElementById('modalFoto').innerHTML =
    (a.fotoUrl ? `<img src="${a.fotoUrl}" alt="${a.nome}" style="width:100%;height:100%;object-fit:cover"/>` : `<div class="animal-foto-placeholder" style="height:100%">${isGato?'🐱':'🐕'}</div>`)
    + `<button class="modal-fechar" onclick="fecharModal()">✕</button>`;
  document.getElementById('modalNome').textContent = a.nome;
  document.getElementById('modalBadge').textContent = isGato ? 'Gato' : 'Cachorro';
  document.getElementById('modalMeta').textContent = `${a.raca||(isGato?'SRD':'Vira-lata')} · ${a.idade?a.idade+' ano(s)':'—'} · ${a.porte||'—'}`;
  document.getElementById('modalDesc').textContent = a.descricao || 'Sem descrição disponível.';
  const btn = document.getElementById('modalBtnAdotar');
  const disp = a.statusAdocao === 'disponivel';
  btn.disabled = !disp;
  btn.textContent = disp ? '🧡 Quero adotar' : 'Indisponível';
  // Botao do modal tambem exige login
  btn.onclick = () => exigirLogin('adocao.html');
  document.getElementById('modalOverlay').classList.add('aberto');
}

function fecharModal() { document.getElementById('modalOverlay').classList.remove('aberto'); }

function setFiltroEspecie(v,b) { filtroEspecie=v; document.querySelectorAll('.grupo-especie').forEach(x=>x.classList.remove('active')); b.classList.add('active'); aplicarFiltros(); }
function setFiltroPorte(v,b)   { filtroPorte=v;   document.querySelectorAll('.grupo-porte').forEach(x=>x.classList.remove('active'));   b.classList.add('active'); aplicarFiltros(); }
function setFiltroStatus(v,b)  { filtroStatus=v;  document.querySelectorAll('.grupo-status').forEach(x=>x.classList.remove('active'));  b.classList.add('active'); aplicarFiltros(); }
let dt; function onBusca(v) { clearTimeout(dt); dt=setTimeout(()=>{ termoBusca=v; aplicarFiltros(); },300); }
function onOrdem(v) { ordemAtual=v; aplicarFiltros(); }

carregarAnimais();