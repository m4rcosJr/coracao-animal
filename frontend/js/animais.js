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
 *
 * PIM IV — AUTENTICACAO:
 *   addAnimal, updateAnimal e deleteAnimal agora exigem estar logado como
 *   admin (a API rejeita com 401 sem o token). O token vem de getToken(),
 *   definido em auth.js.
 */

if (typeof window.API_BASE === 'undefined') {
    window.API_BASE = 'https://coracaoanimal-api-fqegfpe7avcda5cy.chilecentral-01.azurewebsites.net/api';
}
const API_BASE  = window.API_BASE;
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

        const localRaw = localStorage.getItem(LOCAL_KEY);
        const localData = localRaw ? JSON.parse(localRaw) : [];

        const localStatusMap = {};
        localData.forEach(a => {
            if (a.idAnimal) localStatusMap[a.idAnimal] = a.statusAdocao;
        });

        const merged = apiData.map(a => {
            const localStatus = localStatusMap[a.idAnimal];
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
 * Exige login de admin (rota protegida).
 *
 * @param {Object}  animal   - dados do animal (nome, especie, etc.)
 * @param {File}    [foto]   - arquivo de imagem (opcional)
 * @returns {Promise<Object>} animal salvo com ID e fotoUrl
 */
async function addAnimal(animal, foto = null) {
    try {
        const formData = new FormData();
        formData.append('Nome', animal.nome || '');
        formData.append('Especie', animal.especie || '');
        formData.append('Raca', animal.raca || '');
        formData.append('Idade', animal.idade?.toString() || '');
        formData.append('Porte', animal.porte || '');
        formData.append('StatusAdocao', animal.statusAdocao || 'disponivel');
        formData.append('Descricao', animal.descricao || '');

        if (foto) {
            formData.append('Foto', foto);
        }

        // IMPORTANTE: NAO defina 'Content-Type' manualmente — o browser define
        // sozinho com o boundary correto quando usamos FormData.
        // O header Authorization pode ser adicionado normalmente junto.
        const res = await fetch(`${API_BASE}/animais`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData,
        });

        if (res.status === 401 || res.status === 403) {
            throw new Error('Sua sessão de admin expirou ou é inválida. Faça login novamente.');
        }

        if (!res.ok) {
            const erro = await res.json().catch(() => ({}));
            throw new Error(erro.mensagem || `HTTP ${res.status}`);
        }

        const saved = await res.json();
        console.log('[Animals] Animal salvo na API, ID:', saved.idAnimal, 'FotoUrl:', saved.fotoUrl);

        const all = getLocalAnimals();
        all.push(saved);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
        _animalsCache = all;
        return saved;

    } catch (err) {
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
            console.warn('[Animals] API offline — salvando localmente');
            return _saveLocalOnly(animal, foto);
        }
        throw err;
    }
}

/** Salva animal apenas no localStorage (modo offline) */
async function _saveLocalOnly(animal, foto) {
    const all = getLocalAnimals();
    const newId = all.length ? Math.max(...all.map(a => a.idAnimal || 0)) + 1 : 1;

    let fotoUrl = animal.fotoUrl || '';
    if (foto) {
        fotoUrl = await new Promise(resolve => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
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
 * Exige login de admin (rota protegida).
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
        formData.append('Nome', updates.nome || all[idx].nome);
        formData.append('Especie', updates.especie || all[idx].especie || '');
        formData.append('Raca', updates.raca || all[idx].raca || '');
        formData.append('Idade', (updates.idade ?? all[idx].idade ?? '').toString());
        formData.append('Porte', updates.porte || all[idx].porte || '');
        formData.append('StatusAdocao', updates.statusAdocao || all[idx].statusAdocao || 'disponivel');
        formData.append('Descricao', updates.descricao || all[idx].descricao || '');
        if (foto) formData.append('Foto', foto);

        const res = await fetch(`${API_BASE}/animais/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: formData
        });

        if (res.status === 401 || res.status === 403) {
            throw new Error('Sua sessão de admin expirou ou é inválida. Faça login novamente.');
        }
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
 * Exige login de admin (rota protegida).
 * @param {number} id
 */
async function deleteAnimal(id) {
    const all = getLocalAnimals().filter(a => a.idAnimal !== id);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
    _animalsCache = all;
    try {
        await fetch(`${API_BASE}/animais/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
    } catch (err) {
        console.warn('[Animals] API delete falhou:', err.message);
    }
}

/** Invalida o cache para forcar novo fetch na proxima chamada */
function invalidateAnimalsCache() { _animalsCache = null; }

// ─── Filtragem ───────────────────────────────────────────

function filterAnimals(animals, { species = 'all', size = 'all', status = 'disponivel', search = '', sort = 'name' } = {}) {
    let r = [...animals];
    if (species !== 'all') r = r.filter(a => a.especie === species);
    if (size !== 'all') r = r.filter(a => a.porte?.toLowerCase() === size);
    if (status !== 'all') r = r.filter(a => a.statusAdocao === status);
    if (search.trim()) {
        const q = search.toLowerCase();
        r = r.filter(a =>
            a.nome?.toLowerCase().includes(q) ||
            a.especie?.toLowerCase().includes(q) ||
            a.raca?.toLowerCase().includes(q)
        );
    }
    r.sort((a, b) => sort === 'age'
        ? (a.idade || 99) - (b.idade || 99)
        : a.nome.localeCompare(b.nome)
    );
    return r;
}

// ─── Geração de Card ─────────────────────────────────────

const STATUS_MAP = {
    disponivel: { label: 'Disponível', bg: '#e8f5e9', color: '#2e7d32' },
    em_processo: { label: 'Em processo', bg: '#fff3e0', color: '#e65100' },
    adotado: { label: 'Adotado', bg: '#e3f2fd', color: '#1565c0' },
    em_tratamento: { label: 'Em tratamento', bg: '#fce4ec', color: '#c62828' },
};

function generateAnimalCard(animal, showAdoptBtn = true) {
    if (!window._animalsMap) window._animalsMap = {};
    window._animalsMap[animal.idAnimal] = animal;

    const isCAT = animal.especie === 'gato';
    const emoji = isCAT ? '🐱' : '🐕';
    const badge = isCAT ? 'Gato' : 'Cachorro';
    const avail = animal.statusAdocao === 'disponivel';
    const status = STATUS_MAP[animal.statusAdocao] || { label: animal.statusAdocao, bg: '#eee', color: '#666' };

    const fotoSrc = animal.fotoUrl
        ? (animal.fotoUrl.startsWith('/uploads/')
            ? 'https://coracaoanimal-api-fqegfpe7avcda5cy.chilecentral-01.azurewebsites.net' + animal.fotoUrl
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

function openAnimalDetail(animalId) {
    const animal = window._animalsMap?.[animalId];
    if (animal && typeof showAnimalModal === 'function') {
        showAnimalModal(animal);
    }
}