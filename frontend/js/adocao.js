/**
 * adoption.js - Adoption Form & Process Management
 * Coracao Animal - PIM III UNIP
 *
 * Handles the full adoption modal flow:
 *  1. Open modal with selected animal
 *  2. Validate form inputs
 *  3. Submit to API (with localStorage fallback)
 *  4. Show success/error feedback
 */

const ADOPTIONS_API = 'http://localhost:5000/api';
const ADOPTIONS_KEY = 'ca_adoptions'; // localStorage key

// Currently selected animal for adoption
let _selectedAnimal = null;

// ─── Modal Control ────────────────────────────

/**
 * Opens the adoption modal for a specific animal.
 * Requires the user to be logged in.
 * @param {number|Object} animalIdOrObj - animal ID or object
 */
async function openAdoptionModal(animalIdOrObj) {
  // Auth check
  if (!isLoggedIn()) {
    requireLogin('animais.html', 'Faça login para iniciar uma adoção');
    return;
  }

  // Resolve animal object
  let animal;
  if (typeof animalIdOrObj === 'object') {
    animal = animalIdOrObj;
  } else {
    const all = getLocalAnimals ? getLocalAnimals() : [];
    animal = all.find(a => a.idAnimal === animalIdOrObj);
  }

  if (!animal) {
    showNotification('Animal não encontrado.', 'error');
    return;
  }

  _selectedAnimal = animal;

  // Populate animal summary in modal
  const isCAT = animal.especie === 'gato';
  const emoji  = isCAT ? '🐱' : '🐕';

  const fotoEl = document.getElementById('adoptionAnimalPhoto');
  const nameEl = document.getElementById('adoptionAnimalName');
  const infoEl = document.getElementById('adoptionAnimalInfo');

  if (fotoEl) fotoEl.innerHTML = animal.fotoUrl
    ? `<img src="${animal.fotoUrl}" alt="${animal.nome}" style="width:100%;height:100%;object-fit:cover;border-radius:10px"/>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:48px;background:var(--bg-muted);border-radius:10px">${emoji}</div>`;

  if (nameEl) nameEl.textContent = animal.nome;
  if (infoEl) infoEl.textContent =
    `${animal.raca || 'SRD'} · ${animal.idade ? animal.idade + ' ano(s)' : '—'} · ${animal.porte || '—'}`;

  // Reset form
  resetAdoptionForm();

  // Show modal
  const modal = document.getElementById('adoptionModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  // Focus first field
  setTimeout(() => document.getElementById('adoptName')?.focus(), 300);
}

/** Closes the adoption modal */
function closeAdoptionModal() {
  const modal = document.getElementById('adoptionModal');
  if (modal) modal.style.display = 'none';
  document.body.style.overflow = '';
  _selectedAnimal = null;
}

/** Resets all form fields and error states */
function resetAdoptionForm() {
  const fields = ['adoptName','adoptEmail','adoptPhone','adoptAddress',
                  'adoptResidence','adoptHasPets','adoptNotes'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = ''; el.classList.remove('invalido'); }
  });

  // Clear error messages
  document.querySelectorAll('#adoptionModal .erro-msg').forEach(el => {
    el.textContent = '';
    el.classList.remove('visivel');
  });

  // Reset feedback
  const fb = document.getElementById('adoptionFeedback');
  if (fb) fb.className = 'modal-feedback';

  // Reset button
  const btn = document.getElementById('btnSubmitAdoption');
  if (btn) { btn.disabled = false; btn.textContent = '🧡 Confirmar interesse'; }
}

// ─── Validation ───────────────────────────────

/**
 * Marks a field as invalid with an error message.
 * @param {string} fieldId - input element ID
 * @param {string} errId   - error message element ID
 * @param {string} message - error message
 */
function setFieldError(fieldId, errId, message) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (field) field.classList.add('invalido');
  if (err)   { err.textContent = message; err.classList.add('visivel'); }
}

/**
 * Validates the adoption form.
 * @returns {{ valid: boolean, data: Object }}
 */
function validateAdoptionForm() {
  // Clear previous errors
  document.querySelectorAll('#adoptionModal .invalido').forEach(el => el.classList.remove('invalido'));
  document.querySelectorAll('#adoptionModal .erro-msg').forEach(el => {
    el.textContent = '';
    el.classList.remove('visivel');
  });

  const data = {
    name:      document.getElementById('adoptName')?.value.trim()      || '',
    email:     document.getElementById('adoptEmail')?.value.trim()     || '',
    phone:     document.getElementById('adoptPhone')?.value.trim()     || '',
    address:   document.getElementById('adoptAddress')?.value.trim()   || '',
    residence: document.getElementById('adoptResidence')?.value        || '',
    hasPets:   document.getElementById('adoptHasPets')?.value          || '',
    notes:     document.getElementById('adoptNotes')?.value.trim()     || '',
  };

  let valid = true;

  if (!data.name)
    { setFieldError('adoptName',  'errAdoptName',  'Nome completo é obrigatório'); valid = false; }
  if (!data.email)
    { setFieldError('adoptEmail', 'errAdoptEmail', 'E-mail é obrigatório'); valid = false; }
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
    { setFieldError('adoptEmail', 'errAdoptEmail', 'E-mail inválido'); valid = false; }
  if (!data.phone)
    { setFieldError('adoptPhone', 'errAdoptPhone', 'Telefone é obrigatório'); valid = false; }
  if (!data.address)
    { setFieldError('adoptAddress', 'errAdoptAddress', 'Endereço é obrigatório'); valid = false; }
  if (!data.residence)
    { setFieldError('adoptResidence', 'errAdoptResidence', 'Tipo de residência é obrigatório'); valid = false; }

  return { valid, data };
}

// ─── Submission ───────────────────────────────

/** Handles form submission: validates, submits, shows feedback */
async function submitAdoption() {
  if (!_selectedAnimal) return;

  const { valid, data } = validateAdoptionForm();
  if (!valid) {
    showAdoptionFeedback('error', '❌ Corrija os campos destacados antes de enviar.');
    return;
  }

  const btn = document.getElementById('btnSubmitAdoption');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando...'; }

  // Build adoption record
  const record = {
    id:         Date.now(),
    animalId:   _selectedAnimal.idAnimal,
    animalName: _selectedAnimal.nome,
    date:       new Date().toISOString(),
    status:     'pending',
    adopter:    data,
  };

  try {
    console.log('[Adoption] Submitting:', record);

    // Step 1: Create adopter via API
    const adopterRes = await fetch(`${ADOPTIONS_API}/adotantes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nomeCompleto: data.name,
        cpf:          '000.000.000-00',
        email:        data.email,
        telefone:     data.phone,
        endereco:     data.address,
      }),
    });

    let adopterId = null;
    if (adopterRes.ok) {
      const adopter = await adopterRes.json();
      adopterId = adopter.idAdotante;
      console.log('[Adoption] Adopter created, ID:', adopterId);
    }

    // Step 2: Register adoption via API
    const adoptionRes = await fetch(`${ADOPTIONS_API}/adocoes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idAnimal:    _selectedAnimal.idAnimal,
        idAdotante:  adopterId,
        status:      'em_andamento',
        observacoes: `Residência: ${data.residence}. Tem outros pets: ${data.hasPets}. ${data.notes}`,
      }),
    });

    if (!adoptionRes.ok) throw new Error('API adoption failed');
    console.log('[Adoption] Adoption registered via API');

  } catch (err) {
    console.warn('[Adoption] API unavailable, saving locally:', err.message);
  }

  // Always save to localStorage (as backup / for dashboard)
  saveAdoptionLocally(record);

  // Show success
  showAdoptionFeedback('success',
    `✅ Interesse em ${_selectedAnimal.nome} registrado! Entraremos em contato no e-mail ${data.email} em até 48h.`
  );

  showNotification(`Interesse em ${_selectedAnimal.nome} enviado com sucesso!`, 'success');

  setTimeout(() => closeAdoptionModal(), 3000);
}

/** Saves adoption record to localStorage */
function saveAdoptionLocally(record) {
  const all = JSON.parse(localStorage.getItem(ADOPTIONS_KEY) || '[]');
  all.push(record);
  localStorage.setItem(ADOPTIONS_KEY, JSON.stringify(all));
}

/** Returns all locally stored adoptions */
function getLocalAdoptions() {
  return JSON.parse(localStorage.getItem(ADOPTIONS_KEY) || '[]');
}

/** Shows feedback message inside the modal */
function showAdoptionFeedback(type, message) {
  const el = document.getElementById('adoptionFeedback');
  if (!el) return;
  el.textContent  = message;
  el.className    = `modal-feedback ${type === 'success' ? 'sucesso' : 'erro'}`;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ─── Phone Mask ───────────────────────────────
function maskPhone(input) {
  let v = input.value.replace(/\D/g, '');
  v = v.replace(/^(\d{2})(\d)/,  '($1) $2');
  v = v.replace(/(\d{5})(\d)/,   '$1-$2');
  input.value = v.substring(0, 15);
}