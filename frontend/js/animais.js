/**
 * animals.js — Animal Data Layer (atualizado com suporte a upload de imagem)
 * Coracao Animal — PIM III UNIP
 *
 * MUDANCA PRINCIPAL:
 *   addAnimal() agora envia multipart/form-data em vez de JSON
 *   para suportar upload de arquivo de imagem diretamente.
 *
 * POR QUE multipart/form-data?
 *   JSON nao consegue transmitir arquivos binarios (imagens).
 *   multipart/form-data e o formato padrao para formularios com arquivos,
 *   assim como <form enctype="multipart/form-data"> no HTML.
 */

const API_BASE  = 'http://localhost:5000/api';
const LOCAL_KEY = 'ca_animals';

// Cache em memoria — evita chamadas repetidas na mesma sessao
let _animalsCache = null;

// ─── Data Layer ──────────────────────────────────────────

/**
 * Busca todos os animais da API.
 * Fallback: localStorage, depois dados de exemplo.
 * @returns {Promise<Array>}
 */
async function fetchAnimals() {
  if (_animalsCache) return _animalsCache;

  try {
    console.log('[Animals] Buscando da API...');
    const res = await fetch(`${API_BASE}/animais`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const apiData = await res.json();

    // ✅ Mescla dados da API com alterações locais de status
    // O localStorage pode ter status mais recentes (ex: em_processo, adotado)
    // que ainda não foram persistidos na API (modo offline/fallback)
    const localRaw = localStorage.getItem(LOCAL_KEY);
    const localData = localRaw ? JSON.parse(localRaw) : [];

    // Cria mapa de status locais por ID
    const localStatusMap = {};
    localData.forEach(a => {
      if (a.idAnimal) localStatusMap[a.idAnimal] = a.statusAdocao;
    });

    // Aplica status local sobre dado da API (status local tem prioridade)
    const merged = apiData.map(a => {
      const localStatus = localStatusMap[a.idAnimal];
      // Só sobrescreve se o status local for mais restritivo que "disponivel"
      if (localStatus && localStatus !== 'disponivel') {
        return { ...a, statusAdocao: localStatus };
      }
      return a;
    });

    _animalsCache = merged;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(merged));
    console.log(`[Animals] ${merged.length} animais carregados (API + status local)`);
    return merged;

  } catch (err) {
    console.warn('[Animals] API indisponível, usando fallback:', err.message);
    return getLocalAnimals();
  }
}

/**
 * Cadastra um novo animal enviando multipart/form-data.
 *
 * POR QUE FormData em vez de JSON.stringify?
 *   - JSON nao suporta arquivos binarios (imagens)
 *   - FormData monta automaticamente o multipart/form-data
 *   - O Content-Type e definido automaticamente pelo browser
 *     (NAO defina Content-Type manualmente com FormData!)
 *
 * @param {Object}  animal   - dados do animal (nome, especie, etc.)
 * @param {File}    [foto]   - arquivo de imagem (opcional)
 * @returns {Promise<Object>} animal salvo com ID e fotoUrl
 */
async function addAnimal(animal, foto = null) {
  try {
    // Monta o FormData com todos os campos
    const formData = new FormData();
    formData.append('Nome',         animal.nome        || '');
    formData.append('Especie',      animal.especie     || '');
    formData.append('Raca',         animal.raca        || '');
    formData.append('Idade',        animal.idade?.toString() || '');
    formData.append('Porte',        animal.porte       || '');
    formData.append('StatusAdocao', animal.statusAdocao || 'disponivel');
    formData.append('Descricao',    animal.descricao   || '');

    // Adiciona o arquivo de imagem (se fornecido)
    // O nome 'Foto' deve bater exatamente com o campo IFormFile no DTO do C#
    if (foto) {
      formData.append('Foto', foto);
    }

    // IMPORTANTE: NAO defina 'Content-Type': 'multipart/form-data' manualmente!
    // O browser define automaticamente com o boundary correto.
    // Se voce definir manualmente, o boundary fica faltando e o servidor rejeita.
    const res = await fetch(`${API_BASE}/animais`, {
      method: 'POST',
      body:   formData,
      // SEM headers — o browser define o Content-Type automaticamente
    });

    if (!res.ok) {
      const erro = await res.json().catch(() => ({}));
      throw new Error(erro.mensagem || `HTTP ${res.status}`);
    }

    const saved = await res.json();
    console.log('[Animals] Animal salvo na API, ID:', saved.idAnimal, 'FotoUrl:', saved.fotoUrl);

    // Atualiza o cache local
    const all = getLocalAnimals();
    all.push(saved);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
    _animalsCache = all;
    return saved;

  } catch (err) {
    // Se a API estiver offline, salva apenas localmente
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
      console.warn('[Animals] API offline — salvando localmente');
      return _saveLocalOnly(animal, foto);
    }
    throw err;
  }
}

/** Salva animal apenas no localStorage (modo offline) */
async function _saveLocalOnly(animal, foto) {
  const all   = getLocalAnimals();
  const newId = all.length ? Math.max(...all.map(a => a.idAnimal || 0)) + 1 : 1;

  // Se tem foto, gera preview local via FileReader
  let fotoUrl = animal.fotoUrl || '';
  if (foto) {
    fotoUrl = await new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result); // base64 para preview local
      reader.readAsDataURL(foto);
    });
  }

  const saved = { ...animal, idAnimal: newId, fotoUrl };
  all.push(saved);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  _animalsCache = all;
  return saved;
}

/**
 * Atualiza um animal existente (com suporte a nova foto).
 * @param {number} id
 * @param {Object} updates
 * @param {File}   [foto]
 */
async function updateAnimal(id, updates, foto = null) {
  const all = getLocalAnimals();
  const idx = all.findIndex(a => a.idAnimal === id);
  if (idx === -1) throw new Error('Animal nao encontrado');

  try {
    const formData = new FormData();
    formData.append('Nome',         updates.nome         || all[idx].nome);
    formData.append('Especie',      updates.especie      || all[idx].especie      || '');
    formData.append('Raca',         updates.raca         || all[idx].raca         || '');
    formData.append('Idade',        (updates.idade       ?? all[idx].idade        ?? '').toString());
    formData.append('Porte',        updates.porte        || all[idx].porte        || '');
    formData.append('StatusAdocao', updates.statusAdocao || all[idx].statusAdocao || 'disponivel');
    formData.append('Descricao',    updates.descricao    || all[idx].descricao    || '');
    if (foto) formData.append('Foto', foto);

    const res = await fetch(`${API_BASE}/animais/${id}`, { method:'PUT', body:formData });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
  } catch (err) {
    console.warn('[Animals] API update falhou, atualizando localmente:', err.message);
  }

  const updated = { ...all[idx], ...updates, idAnimal: id };
  all[idx] = updated;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  _animalsCache = all;
  return updated;
}

/**
 * Remove um animal pelo ID.
 * @param {number} id
 */
async function deleteAnimal(id) {
  const all = getLocalAnimals().filter(a => a.idAnimal !== id);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  _animalsCache = all;
  try { await fetch(`${API_BASE}/animais/${id}`, { method:'DELETE' }); }
  catch (err) { console.warn('[Animals] API delete falhou:', err.message); }
}

/** Invalida o cache para forcar novo fetch na proxima chamada */
function invalidateAnimalsCache() { _animalsCache = null; }

// ─── Filtragem ───────────────────────────────────────────

/**
 * Filtra e ordena um array de animais.
 * @param {Array}  animals
 * @param {Object} opts
 */
function filterAnimals(animals, { species='all', size='all', status='disponivel', search='', sort='name' } = {}) {
  let r = [...animals];
  if (species !== 'all') r = r.filter(a => a.especie === species);
  if (size    !== 'all') r = r.filter(a => a.porte?.toLowerCase() === size);
  if (status  !== 'all') r = r.filter(a => a.statusAdocao === status);
  if (search.trim()) {
    const q = search.toLowerCase();
    r = r.filter(a =>
      a.nome?.toLowerCase().includes(q)    ||
      a.especie?.toLowerCase().includes(q) ||
      a.raca?.toLowerCase().includes(q)
    );
  }
  r.sort((a, b) => sort === 'age'
    ? (a.idade||99) - (b.idade||99)
    : a.nome.localeCompare(b.nome)
  );
  return r;
}

// ─── Geração de Card ─────────────────────────────────────

const STATUS_MAP = {
  disponivel:    { label:'Disponível',    bg:'#e8f5e9', color:'#2e7d32' },
  em_processo:   { label:'Em processo',   bg:'#fff3e0', color:'#e65100' },
  adotado:       { label:'Adotado',       bg:'#e3f2fd', color:'#1565c0' },
  em_tratamento: { label:'Em tratamento', bg:'#fce4ec', color:'#c62828' },
};

/**
 * Gera HTML do card de um animal.
 *
 * CORREÇÃO DO BUG PRINCIPAL:
 *   Antes: onclick="abrirModal(${JSON.stringify(animal).replace(/\"/g,\"'\")})"
 *   Problema: aspas simples dentro de aspas duplas quebravam o HTML parser
 *
 *   Agora: onclick="handleAdoptClick(${animal.idAnimal})"
 *   O animal é buscado pelo ID no window._animalsMap — sem JSON no HTML.
 *
 * @param {Object}  animal
 * @param {boolean} showAdoptBtn
 * @returns {string}
 */
function generateAnimalCard(animal, showAdoptBtn = true) {
  // Armazena no mapa global para busca por ID
  if (!window._animalsMap) window._animalsMap = {};
  window._animalsMap[animal.idAnimal] = animal;

  const isCAT  = animal.especie === 'gato';
  const emoji  = isCAT ? '🐱' : '🐕';
  const badge  = isCAT ? 'Gato' : 'Cachorro';
  const avail  = animal.statusAdocao === 'disponivel';
  const status = STATUS_MAP[animal.statusAdocao] || { label:animal.statusAdocao, bg:'#eee', color:'#666' };

  const fotoSrc = animal.fotoUrl
    ? (animal.fotoUrl.startsWith('/uploads/')
        ? 'http://localhost:5000' + animal.fotoUrl
        : animal.fotoUrl)
    : null;

  let html = '<div class="animal-card" onclick="openAnimalDetail(' + animal.idAnimal + ')" role="article">';
  html += '<div class="animal-foto">';
  
  if (fotoSrc) {
    html += '<img src="' + fotoSrc + '" alt="Foto de ' + animal.nome + '" loading="lazy" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\'"/>';
    html += '<div class="animal-foto-placeholder" style="display:none">' + emoji + '<span>Foto indisponível</span></div>';
  } else {
    html += '<div class="animal-foto-placeholder">' + emoji + '<span>Sem foto</span></div>';
  }
  
  html += '<span class="animal-status-badge" style="background:' + status.bg + ';color:' + status.color + ';position:absolute;top:10px;right:10px;padding:4px 12px;border-radius:50px;font-size:11px;font-weight:600;font-family:\'DM Sans\',sans-serif">';
  html += status.label;
  html += '</span></div>';
  
  html += '<div class="animal-info">';
  html += '<div class="animal-nome-row">';
  html += '<div class="animal-nome">' + animal.nome + '</div>';
  html += '<span class="animal-badge">' + badge + '</span>';
  html += '</div>';
  
  html += '<div class="animal-meta">';
  html += animal.raca || (isCAT ? 'SRD' : 'Vira-lata');
  if (animal.idade) html += ' · ' + animal.idade + ' ano(s)';
  if (animal.porte) html += ' · ' + animal.porte;
  html += '</div>';
  
  html += '<div class="animal-desc">';
  html += animal.descricao || 'Animal disponível para adoção na ONG Coração Animal.';
  html += '</div>';
  
  if (showAdoptBtn) {
    html += '<button class="btn-outline-full" ' + (avail ? '' : 'disabled') + ' onclick="event.stopPropagation(); handleAdoptClick(' + animal.idAnimal + ')">';
    html += avail ? '🧡 Quero adotar' : 'Indisponível';
    html += '</button>';
  }
  
  html += '</div></div>';
  
  return html;
}

/**
 * Handler do clique em "Quero adotar".
 * Busca o animal pelo ID (sem JSON no HTML).
 * @param {number} animalId
 */
function handleAdoptClick(animalId) {
  const animal = window._animalsMap?.[animalId];
  if (!animal) { console.error('[Animals] Animal nao encontrado no mapa:', animalId); return; }

  if (!isLoggedIn()) {
    requireLogin(
      window.location.pathname.includes('/pages/') ? 'animais.html' : 'pages/animais.html',
      `Faça login para adotar ${animal.nome}`
    );
    return;
  }

  if (typeof openAdoptionModal === 'function') {
    openAdoptionModal(animal);
  } else {
    console.error('[Animals] openAdoptionModal nao carregado');
  }
}

/**
 * Abre o modal de detalhes do animal.
 * @param {number} animalId
 */
function openAnimalDetail(animalId) {
  const animal = window._animalsMap?.[animalId];
  if (animal && typeof showAnimalModal === 'function') {
    showAnimalModal(animal);
  }
}