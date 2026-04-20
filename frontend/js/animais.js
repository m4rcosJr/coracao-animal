/**
 * animals.js - Animal Registry & Listing
 * Coracao Animal - PIM III UNIP
 *
 * Handles fetching from API, localStorage fallback,
 * filtering, searching, and CRUD for animals.
 */

const ANIMALS_API  = 'http://localhost:5000/api/animais';
const ANIMALS_KEY  = 'ca_animals'; // localStorage key for offline data

// ─── Data Layer ───────────────────────────────

/**
 * Fetches all animals from API, falls back to localStorage.
 * @returns {Promise<Array>} Array of animal objects
 */
async function fetchAnimals() {
  try {
    const res = await fetch(ANIMALS_API);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    // Cache in localStorage for offline use
    localStorage.setItem(ANIMALS_KEY, JSON.stringify(data));
    console.log(`[Animals] Loaded ${data.length} animals from API`);
    return data;
  } catch (err) {
    console.warn('[Animals] API unavailable, using localStorage:', err.message);
    return getLocalAnimals();
  }
}

/** Returns animals stored in localStorage */
function getLocalAnimals() {
  try {
    return JSON.parse(localStorage.getItem(ANIMALS_KEY)) || getDefaultAnimals();
  } catch {
    return getDefaultAnimals();
  }
}

/** Default sample data when no API or cache is available */
function getDefaultAnimals() {
  return [
    { idAnimal: 1, nome: 'Rex',   especie: 'cao',  raca: 'Labrador',  idade: 3, porte: 'grande',  statusAdocao: 'disponivel',  descricao: 'Cachorro carinhoso e brincalhão, adora crianças.', fotoUrl: '' },
    { idAnimal: 2, nome: 'Mia',   especie: 'gato', raca: 'SRD',       idade: 2, porte: 'pequeno', statusAdocao: 'disponivel',  descricao: 'Gatinha dócil e independente, adora carinho.', fotoUrl: '' },
    { idAnimal: 3, nome: 'Thor',  especie: 'cao',  raca: 'Vira-lata', idade: 1, porte: 'medio',   statusAdocao: 'disponivel',  descricao: 'Filhote leal e protetor, ótimo companheiro.', fotoUrl: '' },
    { idAnimal: 4, nome: 'Luna',  especie: 'gato', raca: 'Persa',     idade: 4, porte: 'medio',   statusAdocao: 'adotado',     descricao: 'Encontrou uma família amorosa!', fotoUrl: '' },
    { idAnimal: 5, nome: 'Bolt',  especie: 'cao',  raca: 'Beagle',    idade: 2, porte: 'medio',   statusAdocao: 'disponivel',  descricao: 'Energético e inteligente, adora passear.', fotoUrl: '' },
    { idAnimal: 6, nome: 'Simba', especie: 'gato', raca: 'Siamês',    idade: 3, porte: 'medio',   statusAdocao: 'em_tratamento', descricao: 'Em recuperação, em breve disponível.', fotoUrl: '' },
  ];
}

/** Saves animals array to localStorage */
function saveLocalAnimals(animals) {
  localStorage.setItem(ANIMALS_KEY, JSON.stringify(animals));
}

/**
 * Adds a new animal to localStorage (and tries API).
 * @param {Object} animal - animal data from form
 * @returns {Promise<Object>} saved animal with generated id
 */
async function addAnimal(animal) {
  // Try posting to API first
  try {
    const res = await fetch(ANIMALS_API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(animal),
    });
    if (res.ok) {
      const saved = await res.json();
      console.log('[Animals] Saved to API:', saved);
      // Also update localStorage cache
      const all = getLocalAnimals();
      all.push(saved);
      saveLocalAnimals(all);
      return saved;
    }
  } catch (err) {
    console.warn('[Animals] API unavailable, saving locally:', err.message);
  }

  // Fallback: save to localStorage with generated ID
  const all = getLocalAnimals();
  const newId = all.length > 0 ? Math.max(...all.map(a => a.idAnimal || 0)) + 1 : 1;
  const saved = { ...animal, idAnimal: newId };
  all.push(saved);
  saveLocalAnimals(all);
  console.log('[Animals] Saved to localStorage:', saved);
  return saved;
}

/**
 * Deletes an animal by ID from localStorage.
 * @param {number} id
 */
async function deleteAnimal(id) {
  try {
    await fetch(`${ANIMALS_API}/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('[Animals] API delete failed, removing locally:', err.message);
  }
  const all = getLocalAnimals().filter(a => a.idAnimal !== id);
  saveLocalAnimals(all);
}

/**
 * Updates an animal by ID.
 * @param {number} id
 * @param {Object} updates
 */
async function updateAnimal(id, updates) {
  try {
    await fetch(`${ANIMALS_API}/${id}`, {
      method:  'PUT',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ idAnimal: id, ...updates }),
    });
  } catch (err) {
    console.warn('[Animals] API update failed, updating locally:', err.message);
  }
  const all = getLocalAnimals().map(a => a.idAnimal === id ? { ...a, ...updates } : a);
  saveLocalAnimals(all);
}

// ─── Filtering & Search ───────────────────────

/**
 * Filters an array of animals based on criteria.
 * @param {Array}  animals
 * @param {Object} filters - { species, size, status, search }
 * @returns {Array}
 */
function filterAnimals(animals, { species = 'all', size = 'all', status = 'disponivel', search = '', sort = 'name' }) {
  let result = [...animals];

  if (species !== 'all') result = result.filter(a => a.especie === species);
  if (size    !== 'all') result = result.filter(a => a.porte?.toLowerCase() === size);
  if (status  !== 'all') result = result.filter(a => a.statusAdocao === status);

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    result = result.filter(a =>
      a.nome?.toLowerCase().includes(q)    ||
      a.especie?.toLowerCase().includes(q) ||
      a.raca?.toLowerCase().includes(q)
    );
  }

  result.sort((a, b) => {
    if (sort === 'name')  return a.nome.localeCompare(b.nome);
    if (sort === 'age')   return (a.idade || 99) - (b.idade || 99);
    return 0;
  });

  return result;
}

// ─── Card Generation ──────────────────────────

const STATUS_MAP = {
  disponivel:    { label: 'Disponível',    bg: '#e8f5e9', color: '#2e7d32' },
  em_processo:   { label: 'Em processo',   bg: '#fff3e0', color: '#e65100' },
  adotado:       { label: 'Adotado',       bg: '#e3f2fd', color: '#1565c0' },
  em_tratamento: { label: 'Em tratamento', bg: '#fce4ec', color: '#c62828' },
};

/**
 * Generates HTML for a single animal card.
 * @param {Object}  animal
 * @param {boolean} showAdoptBtn - show "Adopt" button (requires login)
 * @returns {string} HTML string
 */
function generateAnimalCard(animal, showAdoptBtn = true) {
  const isCAT    = animal.especie === 'gato';
  const emoji    = isCAT ? '🐱' : '🐕';
  const badge    = isCAT ? 'Gato' : 'Cachorro';
  const avail    = animal.statusAdocao === 'disponivel';
  const status   = STATUS_MAP[animal.statusAdocao] || { label: animal.statusAdocao, bg: '#eee', color: '#666' };
  const animalJS = JSON.stringify(animal).replace(/"/g, '&quot;');

  return `
    <div class="animal-card" role="article" aria-label="Animal ${animal.nome}">
      <div class="animal-foto">
        ${animal.fotoUrl
          ? `<img src="${animal.fotoUrl}" alt="Foto de ${animal.nome}" loading="lazy"/>`
          : `<div class="animal-foto-placeholder">${emoji}<span>Sem foto</span></div>`
        }
        <span class="animal-status-badge"
          style="background:${status.bg};color:${status.color};position:absolute;top:10px;right:10px;padding:4px 12px;border-radius:50px;font-size:11px;font-weight:600;font-family:'DM Sans',sans-serif">
          ${status.label}
        </span>
      </div>
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
            onclick="event.stopPropagation(); openAdoptionModal(${animal.idAnimal})"
            aria-label="${avail ? 'Adotar ' + animal.nome : 'Indisponível'}">
            ${avail ? '🧡 Quero adotar' : 'Indisponível'}
          </button>
        ` : ''}
      </div>
    </div>`;
}