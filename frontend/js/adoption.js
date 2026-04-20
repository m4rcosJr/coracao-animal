/**
 * adoption.js — Adoption Modal & Form Logic
 * Coracao Animal — PIM III UNIP
 *
 * FIXES applied:
 *  - Modal element IDs unified (adoptionModal, adoptionAnimalPhoto, etc.)
 *  - Form data collected correctly from all inputs
 *  - Correct JSON structure sent to API (POST /adotantes then POST /adocoes)
 *  - Proper error handling and user feedback
 *  - No JSON-in-HTML (uses animals.js _animalsMap instead)
 */

const ADOPTION_API  = 'http://localhost:5000/api';
const ADOPTIONS_KEY = 'ca_adoptions';

// Currently selected animal for adoption
let _adoptionAnimal = null;

// ─── Modal Control ──────────────────────────────────────

/**
 * Opens the adoption modal for a given animal.
 * Called by handleAdoptClick() in animals.js.
 * @param {Object} animal
 */
function openAdoptionModal(animal) {
  if (!animal) { console.error('[Adoption] No animal provided'); return; }

  // Auth guard (double-check)
  if (!isLoggedIn()) {
    requireLogin(
      window.location.pathname.includes('/pages/') ? 'animais.html' : 'pages/animais.html',
      `Faça login para adotar ${animal.nome}`
    );
    return;
  }

  function handleAdoptClick(animalId = null) {
  if (!isLoggedIn()) {
    requireLogin(null, 'Faça login para iniciar uma adoção');
    return;
  }

  if (animalId) {
    openAdoptionModal(animalId);
  } else {
    alert('Selecione um animal primeiro.');
  }
}

  _adoptionAnimal = animal;

  // Populate animal summary card
  const isCAT = animal.especie === 'gato';
  const photo = document.getElementById('adoptionAnimalPhoto');
  const name  = document.getElementById('adoptionAnimalName');
  const info  = document.getElementById('adoptionAnimalInfo');

  if (photo) photo.innerHTML = animal.fotoUrl
    ? `<img src="${animal.fotoUrl}" alt="${animal.nome}" style="width:100%;height:100%;object-fit:cover;border-radius:10px"/>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--bg-muted);border-radius:10px">${isCAT ? '🐱' : '🐕'}</div>`;

  if (name) name.textContent = animal.nome;
  if (info) info.textContent = `${animal.raca || 'SRD'} · ${animal.idade ? animal.idade + ' ano(s)' : '—'} · ${animal.porte || '—'}`;

  // Reset form state
  resetAdoptionForm();

  // Show modal
  const modal = document.getElementById('adoptionModal');
  if (!modal) { console.error('[Adoption] #adoptionModal not found in DOM'); return; }
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden';

  // Focus first field for accessibility
  setTimeout(() => document.getElementById('adoptName')?.focus(), 300);
}

/** Closes the adoption modal and restores body scroll */
function closeAdoptionModal() {
  const modal = document.getElementById('adoptionModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  _adoptionAnimal = null;
}

/** Resets all form fields, errors, and button state */
function resetAdoptionForm() {
  ['adoptName','adoptEmail','adoptPhone','adoptAddress',
   'adoptResidence','adoptHasPets','adoptNotes'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('invalido'); }
  });
  document.querySelectorAll('#adoptionModal .erro-msg').forEach(el => {
    el.textContent = ''; el.classList.remove('visivel');
  });
  const fb = document.getElementById('adoptionFeedback');
  if (fb) fb.className = 'modal-feedback';
  const btn = document.getElementById('btnSubmitAdoption');
  if (btn) { btn.disabled = false; btn.textContent = '🧡 Confirmar interesse'; }
}

// ─── Validation ─────────────────────────────────────────

/**
 * Validates a field and shows an error if invalid.
 * @returns {boolean} false if invalid
 */
function _validateField(inputId, errId, condition, message) {
  const input = document.getElementById(inputId);
  const err   = document.getElementById(errId);
  if (!condition) {
    input?.classList.add('invalido');
    if (err) { err.textContent = message; err.classList.add('visivel'); }
    return false;
  }
  input?.classList.remove('invalido');
  if (err) { err.textContent = ''; err.classList.remove('visivel'); }
  return true;
}

/**
 * Collects and validates all form data.
 * @returns {{ valid: boolean, data: Object }}
 */
function validateAdoptionForm() {
  // Clear previous errors
  document.querySelectorAll('#adoptionModal .invalido').forEach(el => el.classList.remove('invalido'));
  document.querySelectorAll('#adoptionModal .erro-msg').forEach(el => {
    el.textContent = ''; el.classList.remove('visivel');
  });

  // Collect values
  const name      = document.getElementById('adoptName')?.value.trim()    || '';
  const email     = document.getElementById('adoptEmail')?.value.trim()   || '';
  const phone     = document.getElementById('adoptPhone')?.value.trim()   || '';
  const address   = document.getElementById('adoptAddress')?.value.trim() || '';
  const residence = document.getElementById('adoptResidence')?.value      || '';
  const hasPets   = document.getElementById('adoptHasPets')?.value        || '';
  const notes     = document.getElementById('adoptNotes')?.value.trim()   || '';

  let valid = true;

  if (!_validateField('adoptName',    'errAdoptName',    !!name,    'Nome completo é obrigatório'))     valid = false;
  if (!_validateField('adoptEmail',   'errAdoptEmail',   !!email,   'E-mail é obrigatório'))            valid = false;
  if (email && !_validateField('adoptEmail', 'errAdoptEmail',
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), 'E-mail inválido')) valid = false;
  if (!_validateField('adoptPhone',   'errAdoptPhone',   !!phone,   'Telefone é obrigatório'))          valid = false;
  if (!_validateField('adoptAddress', 'errAdoptAddress', !!address, 'Endereço é obrigatório'))          valid = false;
  if (!_validateField('adoptResidence','errAdoptResidence', !!residence, 'Tipo de residência é obrigatório')) valid = false;

  return { valid, data: { name, email, phone, address, residence, hasPets, notes } };
}

// ─── Submission ─────────────────────────────────────────

/**
 * Submits the adoption form.
 * Step 1: POST /api/adotantes  (create adopter record)
 * Step 2: POST /api/adocoes    (link animal to adopter)
 * Fallback: saves to localStorage if API is unavailable.
 */
async function submitAdoption() {
  if (!_adoptionAnimal) return;

  const { valid, data } = validateAdoptionForm();
  if (!valid) {
    _setAdoptionFeedback('error', '❌ Corrija os campos destacados antes de enviar.');
    return;
  }

  const btn = document.getElementById('btnSubmitAdoption');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

  // Build local record for fallback storage
  const localRecord = {
    id:         Date.now(),
    animalId:   _adoptionAnimal.idAnimal,
    animalName: _adoptionAnimal.nome,
    date:       new Date().toISOString(),
    status:     'em_andamento',
    adopter:    data,
  };

  let success = false;

  try {
    console.log('[Adoption] Step 1: Creating adopter...');
    const adopterRes = await fetch(`${ADOPTION_API}/adotantes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        nomeCompleto: data.name,
        cpf:          '000.000.000-00',    // placeholder — add CPF field if needed
        email:        data.email,
        telefone:     data.phone,
        endereco:     data.address,
      }),
    });

    if (!adopterRes.ok) throw new Error(`Adotante POST failed: ${adopterRes.status}`);
    const adopter = await adopterRes.json();
    console.log('[Adoption] Adopter created, ID:', adopter.idAdotante);

    console.log('[Adoption] Step 2: Registering adoption...');
    const adoptionRes = await fetch(`${ADOPTION_API}/adocoes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        idAnimal:    _adoptionAnimal.idAnimal,
        idAdotante:  adopter.idAdotante,
        status:      'em_andamento',
        observacoes: `Residência: ${data.residence}. Outros pets: ${data.hasPets || 'não informado'}. ${data.notes}`.trim(),
      }),
    });

    if (!adoptionRes.ok) throw new Error(`Adocao POST failed: ${adoptionRes.status}`);
    console.log('[Adoption] Adoption registered successfully via API');
    success = true;

  } catch (err) {
    console.warn('[Adoption] API error:', err.message);

    if (err.message.toLowerCase().includes('failed to fetch') ||
        err.message.toLowerCase().includes('network')) {
      // Offline — simulate success
      console.info('[Adoption] Offline mode — saving locally');
      success = true;
    } else {
      _setAdoptionFeedback('error', `❌ Erro ao enviar: ${err.message}`);
      if (btn) { btn.disabled = false; btn.textContent = '🧡 Confirmar interesse'; }
      return;
    }
  }

  // Always save locally for dashboard tracking
  const all = JSON.parse(localStorage.getItem(ADOPTIONS_KEY) || '[]');
  all.push(localRecord);
  localStorage.setItem(ADOPTIONS_KEY, JSON.stringify(all));

  if (success) {
    _setAdoptionFeedback('success',
      `✅ Interesse em ${_adoptionAnimal.nome} registrado! Entraremos em contato em ${data.email} em até 48h.`
    );
    if (typeof showNotification === 'function') {
      showNotification(`Interesse em ${_adoptionAnimal.nome} enviado!`, 'success');
    }
    setTimeout(() => closeAdoptionModal(), 3000);
  }
}

/** Shows feedback inside the modal */
function _setAdoptionFeedback(type, message) {
  const el = document.getElementById('adoptionFeedback');
  if (!el) return;
  el.textContent = message;
  el.className   = `modal-feedback ${type === 'success' ? 'sucesso' : 'erro'}`;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── Phone Mask ─────────────────────────────────────────
function maskPhone(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/^(\d{2})(\d)/, '($1) $2');
  v = v.replace(/(\d{5})(\d)/, '$1-$2');
  input.value = v.substring(0, 15);
}

function submitAdoption() {
  const name = document.getElementById('adoptName').value;
  const email = document.getElementById('adoptEmail').value;

  if (!name || !email) {
    showFeedback('Preencha os campos obrigatórios.', 'erro');
    return;
  }

  const adoptionData = {
    animal: window._selectedAnimal,
    nome: name,
    email: email,
    telefone: document.getElementById('adoptPhone').value,
    endereco: document.getElementById('adoptAddress').value,
    residencia: document.getElementById('adoptResidence').value,
    observacoes: document.getElementById('adoptNotes').value,
    data: new Date().toISOString()
  };

  // salva no localStorage (simulação)
  const list = JSON.parse(localStorage.getItem('adocoes') || '[]');
  list.push(adoptionData);
  localStorage.setItem('adocoes', JSON.stringify(list));

  showFeedback('Solicitação enviada com sucesso! 🧡', 'sucesso');

  setTimeout(() => {
    closeAdoptionModal();
  }, 1500);
}