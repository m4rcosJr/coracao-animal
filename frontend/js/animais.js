/**
 * animals.js — Animal Data Layer
 * Coracao Animal — PIM III UNIP
 *
 * Single source of truth for animal data.
 * Fetches from API with localStorage fallback.
 * Used by ALL pages that display or manage animals.
 */

const API_BASE    = 'http://localhost:5000/api';
const LOCAL_KEY   = 'ca_animals';

// In-memory cache (avoids redundant fetches within a page session)
let _animalsCache = null;

// ─── Data Layer ────────────────────────────────────────

/**
 * Fetches all animals. Uses cache if available.
 * Falls back to localStorage, then to default sample data.
 * @returns {Promise<Array>}
 */
async function fetchAnimals() {
  if (_animalsCache) return _animalsCache;

  try {
    console.log('[Animals] Fetching from API...');
    const res = await fetch(`${API_BASE}/animais`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    _animalsCache = data;
    localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    console.log(`[Animals] ${data.length} animals loaded from API`);
    return data;
  } catch (err) {
    console.warn('[Animals] API unavailable, using fallback:', err.message);
    return getLocalAnimals();
  }
}

/** Returns animals from localStorage, or default sample data */
function getLocalAnimals() {
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_KEY));
    if (stored && stored.length) {
      _animalsCache = stored;
      return stored;
    }
  } catch {}
  // Default sample animals for demo/offline mode
  const defaults = [
    { idAnimal:1, nome:'Rex',   especie:'cao',  raca:'Labrador',  idade:3, porte:'grande',  statusAdocao:'disponivel',   descricao:'Cachorro carinhoso e brincalhão, adora crianças.', fotoUrl:'' },
    { idAnimal:2, nome:'Mia',   especie:'gato', raca:'SRD',       idade:2, porte:'pequeno', statusAdocao:'disponivel',   descricao:'Gatinha dócil e independente, adora carinho.', fotoUrl:'' },
    { idAnimal:3, nome:'Thor',  especie:'cao',  raca:'Vira-lata', idade:1, porte:'medio',   statusAdocao:'disponivel',   descricao:'Filhote leal e protetor, ótimo companheiro.', fotoUrl:'' },
    { idAnimal:4, nome:'Luna',  especie:'gato', raca:'Persa',     idade:4, porte:'medio',   statusAdocao:'adotado',      descricao:'Já encontrou uma família amorosa!', fotoUrl:'' },
    { idAnimal:5, nome:'Bolt',  especie:'cao',  raca:'Beagle',    idade:2, porte:'medio',   statusAdocao:'disponivel',   descricao:'Energético e inteligente, adora passear.', fotoUrl:'' },
    { idAnimal:6, nome:'Simba', especie:'gato', raca:'Siamês',    idade:3, porte:'medio',   statusAdocao:'em_tratamento',descricao:'Em recuperação — em breve disponível.', fotoUrl:'' },
  ];
  localStorage.setItem(LOCAL_KEY, JSON.stringify(defaults));
  _animalsCache = defaults;
  return defaults;
}

/**
 * Adds a new animal via API (fallback: localStorage).
 * @param {Object} animal
 * @returns {Promise<Object>} saved animal with ID
 */
async function addAnimal(animal) {
  try {
    console.log('[Animals] Enviando para API:', animal);
    const res = await fetch(`${API_BASE}/animais`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(animal),
    });
    
    const responseText = await res.text();
    console.log('[Animals] Response status:', res.status, 'Body:', responseText);
    
    if (res.ok) {
      const saved = JSON.parse(responseText);
      console.log('[Animals] Saved to API:', saved.idAnimal);
      // Update local cache
      const all = getLocalAnimals();
      all.push(saved);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
      _animalsCache = all;
      return saved;
    }
    
    // Se não for ok, tenta pegar mensagem de erro do servidor
    let errorMsg = `HTTP ${res.status}`;
    try {
      const errorData = JSON.parse(responseText);
      errorMsg = errorData.message || errorData.error || errorMsg;
    } catch {}
    
    throw new Error(errorMsg);
  } catch (err) {
    console.error('[Animals] API save failed:', err.message);
    
    // Só salva localmente se for erro de conexão
    if (err.message.includes('Failed to fetch') || !navigator.onLine) {
      console.warn('[Animals] No internet, saving locally as fallback');
      const all = getLocalAnimals();
      const newId = all.length ? Math.max(...all.map(a => a.idAnimal || 0)) + 1 : 1;
      const saved = { ...animal, idAnimal: newId };
      all.push(saved);
      localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
      _animalsCache = all;
      return saved;
    }
    
    // Relança o erro real
    throw err;
  }
}

/**
 * Updates an animal by ID.
 * @param {number} id
 * @param {Object} updates
 */
async function updateAnimal(id, updates) {
  const all = getLocalAnimals();
  const idx = all.findIndex(a => a.idAnimal === id);
  if (idx === -1) throw new Error('Animal not found');

  const updated = { ...all[idx], ...updates, idAnimal: id };
  all[idx] = updated;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  _animalsCache = all;

  try {
    await fetch(`${API_BASE}/animais/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(updated),
    });
  } catch (err) {
    console.warn('[Animals] API update failed, updated locally only:', err.message);
  }

  return updated;
}

/**
 * Deletes an animal by ID.
 * @param {number} id
 */
async function deleteAnimal(id) {
  const all = getLocalAnimals().filter(a => a.idAnimal !== id);
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
  _animalsCache = all;

  try {
    await fetch(`${API_BASE}/animais/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('[Animals] API delete failed, deleted locally only:', err.message);
  }
}

/** Invalidates the in-memory cache (forces re-fetch next call) */
function invalidateAnimalsCache() {
  _animalsCache = null;
}

// ─── Filtering ─────────────────────────────────────────

/**
 * Filters and sorts an animal array.
 * @param {Array}  animals
 * @param {Object} opts
 */
function filterAnimals(animals, { species='all', size='all', status='disponivel', search='', sort='name' } = {}) {
  let result = [...animals];
  if (species !== 'all')  result = result.filter(a => a.especie === species);
  if (size    !== 'all')  result = result.filter(a => a.porte?.toLowerCase() === size);
  if (status  !== 'all')  result = result.filter(a => a.statusAdocao === status);
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(a =>
      a.nome?.toLowerCase().includes(q)    ||
      a.especie?.toLowerCase().includes(q) ||
      a.raca?.toLowerCase().includes(q)
    );
  }
  result.sort((a, b) => sort === 'age'
    ? (a.idade || 99) - (b.idade || 99)
    : a.nome.localeCompare(b.nome)
  );
  return result;
}

// ─── Card Generation ───────────────────────────────────

const STATUS_MAP = {
  disponivel:    { label: 'Disponível',    bg: '#e8f5e9', color: '#2e7d32' },
  em_processo:   { label: 'Em processo',   bg: '#fff3e0', color: '#e65100' },
  adotado:       { label: 'Adotado',       bg: '#e3f2fd', color: '#1565c0' },
  em_tratamento: { label: 'Em tratamento', bg: '#fce4ec', color: '#c62828' },
};

/**
 * Generates HTML for a single animal card.
 *
 * FIX: stores animal data in window._animalsMap by ID so onclick can
 * safely retrieve it without embedding JSON in HTML attributes
 * (which causes quote-escaping bugs).
 *
 * @param {Object}  animal
 * @param {boolean} showAdoptBtn
 * @returns {string} HTML string
 */
function generateAnimalCard(animal, showAdoptBtn = true) {
  // Store in global map so onclick can look up by ID (avoids JSON-in-HTML bug)
  if (!window._animalsMap) window._animalsMap = {};
  window._animalsMap[animal.idAnimal] = animal;

  const isCAT  = animal.especie === 'gato';
  const emoji  = isCAT ? '🐱' : '🐕';
  const badge  = isCAT ? 'Gato' : 'Cachorro';
  const avail  = animal.statusAdocao === 'disponivel';
  const status = STATUS_MAP[animal.statusAdocao] || { label: animal.statusAdocao, bg:'#eee', color:'#666' };

  // Tenta recuperar foto do localStorage se não tiver URL oficial
  let photoSrc = animal.fotoUrl;
  if (!photoSrc || photoSrc.trim() === '') {
    const stored = localStorage.getItem('ca_photo_preview');
    if (stored) photoSrc = stored;
  }

  return `
    <div class="animal-card" onclick="openAnimalDetail(${animal.idAnimal})" role="article" aria-label="Animal ${animal.nome}">
      <div class="animal-foto">
        ${photoSrc && photoSrc.trim() !== ''
          ? `<img 
              src="${photoSrc}" 
              alt="Foto de ${animal.nome}" 
              loading="lazy"
              onerror="this.onerror=null;this.src='../img/default.jpg';"
            />`
          : `<div class="animal-foto-placeholder">${emoji}<span>Sem foto</span></div>`
        }
      <div class="animal-info">
  <div class="animal-nome-row">
    <div class="animal-nome">${animal.nome}</div>
    <span class="animal-badge">${badge}</span>
  </div>

  <div class="animal-meta">
    ${animal.raca || (isCAT ? 'SRD' : 'Vira-lata')}
    ${animal.idade ? ' · ' + animal.idade + ' ano(s)' : ''}
    ${animal.porte ? ' · ' + animal.porte : ''}
  </div>

  <div class="animal-desc">
    ${animal.descricao || 'Animal disponível para adoção na ONG Coração Animal.'}
  </div>

  ${showAdoptBtn ? `
    <button class="btn-outline-full"
      ${!avail ? 'disabled' : ''}
      onclick="event.stopPropagation(); handleAdoptClick(${animal.id || animal.idAnimal})"
      aria-label="${avail ? 'Adotar ' + animal.nome : 'Indisponível'}">
      ${avail ? '🧡 Quero adotar' : 'Indisponível'}
    </button>
  ` : ''}
</div>
</div>`;
}

/**
 * Global handler for the "Adopt" button click.
 * Looks up animal from the map (avoids JSON-in-HTML).
 * Checks auth, then opens the adoption modal.
 * @param {number} animalId
 */
function handleAdoptClick(animalId) {
  const animal = window._animalsMap?.[animalId];
  if (!animal) { console.error('[Animals] Animal not found in map:', animalId); return; }

  if (!isLoggedIn()) {
    requireLogin(
      window.location.pathname.includes('/pages/') ? 'animais.html' : 'pages/animais.html',
      `Faça login para adotar ${animal.nome}`
    );
    return;
  }

  // Call the adoption modal (defined in adoption.js)
  if (typeof openAdoptionModal === 'function') {
    openAdoptionModal(animal);
  } else {
    console.error('[Animals] openAdoptionModal not loaded');
  }
}

/**
 * Opens the animal detail modal (if it exists on the page).
 * @param {number} animalId
 */
function openAnimalDetail(animalId) {
  const animal = window._animalsMap?.[animalId];
  if (!animal) return;
  if (typeof showAnimalModal === 'function') showAnimalModal(animal);
}