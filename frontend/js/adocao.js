  /**
   * adocao.js — Lógica de Formulário de Adoção em Múltiplas Etapas
   * Coracao Animal — PIM III UNIP
   *
   * Processa:
   * - Carregando animais disponíveis (de animais.js)
   * - Navegação entre etapas do formulário
   * - Validação do formulário
   * - Envio da API
   */

  // API_BASE já declarado em animais.js
  let currentStep = 1;
  let selectedAnimalId = null;
  let adoptionFormData = {};

  // ─── Inicializar ao carregar página ─────────────────────────────────

  document.addEventListener('DOMContentLoaded', async () => {
    // Carrega animais da API
    await carregarAnimaisAdocao();
  });

  // ─── Carregar Animais para Adoção ───────────────────────────

  async function carregarAnimaisAdocao() {
    const grid = document.getElementById('selecaoAnimais');
    if (!grid) return;

    try {
      const animals = await fetchAnimals();
      const disponibles = animals.filter(a => a.statusAdocao === 'disponivel');

      if (disponibles.length === 0) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:2rem">
            <p style="color:var(--text-muted);font-size:14px">🐾 Nenhum animal disponível para adoção no momento.</p>
          </div>
        `;
        return;
      }

      grid.innerHTML = disponibles.map(animal => `
        <div class="animal-selection-card" onclick="selecionarAnimal(${animal.idAnimal}, this)">
          <div class="animal-card-photo">
            ${animal.fotoUrl
              ? `<img src="${animal.fotoUrl}" alt="${animal.nome}" />`
              : `<div class="photo-placeholder">${animal.especie === 'gato' ? '🐱' : '🐕'}</div>`
            }
          </div>
          <div class="animal-card-info">
            <div class="animal-card-name">${animal.nome}</div>
            <div class="animal-card-meta">${animal.raca || 'SRD'} · ${animal.idade ? animal.idade + 'a' : '—'}</div>
          </div>
        </div>
      `).join('');

    } catch (erro) {
      console.error('[Adoption] Erro ao carregar animais:', erro);
      grid.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:2rem">
          <p style="color:#e53935;font-size:14px">❌ Erro ao carregar animais. Tente novamente.</p>
        </div>
      `;
    }
  }

  // ─── Seleção de Animal ────────────────────────────────────────

  function selecionarAnimal(idAnimal, element) {
    // Remove seleção anterior
    document.querySelectorAll('.animal-selection-card').forEach(e => e.classList.remove('selecionado'));
    
    // Marca este como selecionado
    element.classList.add('selecionado');
    selectedAnimalId = idAnimal;
    
    console.log('[Adoption] Animal selecionado:', idAnimal);
  }

  // ─── Navegação do Formulário ────────────────────────────────

  function proximoStep() {
    if (currentStep === 1) {
      if (!selectedAnimalId) {
        alert('Por favor, selecione um animal para prosseguir.');
        return;
      }
    } else if (currentStep === 2) {
      if (!validarFormulario()) return;
    }

    // Oculta painel atual, mostra próximo
    hidePanels();
    currentStep++;
    showPanel(currentStep);

    // Atualiza indicador de etapa
    atualizarSteps();

    // Se estiver no painel de confirmação, mostra resumo
    if (currentStep === 3) {
      renderResumo();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function stepAnterior() {
    if (currentStep > 1) {
      hidePanels();
      currentStep--;
      showPanel(currentStep);
      atualizarSteps();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function hidePanels() {
    document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('ativo'));
  }

  function showPanel(step) {
    const panel = document.getElementById(`panel-${step}`);
    if (panel) panel.classList.add('ativo');
  }

  function atualizarSteps() {
    document.querySelectorAll('.step-item').forEach((step, i) => {
      const stepNum = i + 1;
      if (stepNum === currentStep) {
        step.classList.add('ativo');
        step.classList.remove('concluido');
      } else if (stepNum < currentStep) {
        step.classList.add('concluido');
        step.classList.remove('ativo');
      } else {
        step.classList.remove('ativo', 'concluido');
      }
    });

    document.querySelectorAll('.step-linha').forEach((line, i) => {
      if (i + 1 < currentStep) {
        line.classList.add('concluido');
      } else {
        line.classList.remove('concluido');
      }
    });
  }

  // ─── Validação do Formulário ────────────────────────────────

  function validarFormulario() {
    const campos = [
      { id: 'nomeCompleto', label: 'Nome completo' },
      { id: 'cpf', label: 'CPF' },
      { id: 'email', label: 'E-mail' },
      { id: 'telefone', label: 'Telefone' },
      { id: 'endereco', label: 'Endereço' },
    ];

    let valido = true;

    campos.forEach(campo => {
      const input = document.getElementById(campo.id);
      const erro = document.getElementById(`erro-${campo.id}`);

      if (!input.value.trim()) {
        input.classList.add('invalido');
        if (erro) {
          erro.textContent = `${campo.label} é obrigatório`;
          erro.classList.add('visivel');
        }
        valido = false;
      } else {
        input.classList.remove('invalido');
        if (erro) erro.classList.remove('visivel');
      }
    });

    // Validação de email
    const email = document.getElementById('email').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      const erroEmail = document.getElementById('erro-email');
      if (erroEmail) {
        erroEmail.textContent = 'E-mail inválido';
        erroEmail.classList.add('visivel');
      }
      valido = false;
    }

    // Acordo com termos
    if (!document.getElementById('termos').checked) {
      alert('Por favor, concorde com os termos de adoção responsável.');
      valido = false;
    }

    return valido;
  }

  // ─── Renderizar Resumo ─────────────────────────────────────────

  async function renderResumo() {
    const animals = await fetchAnimals();
    const animal = animals.find(a => a.idAnimal === selectedAnimalId);

    if (!animal) return;

    // Animal summary
    const resumoAnimal = document.getElementById('resumo-animal');
    if (resumoAnimal) {
      resumoAnimal.innerHTML = `
        <div style="display:flex;gap:12px;align-items:center">
          <div style="width:60px;height:60px;border-radius:8px;overflow:hidden;flex-shrink:0">
            ${animal.fotoUrl
              ? `<img src="${animal.fotoUrl}" alt="${animal.nome}" style="width:100%;height:100%;object-fit:cover" />`
              : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--bg-muted);font-size:28px">${animal.especie === 'gato' ? '🐱' : '🐕'}</div>`
            }
          </div>
          <div>
            <div style="font-weight:600;font-size:15px;color:var(--text)">${animal.nome}</div>
            <div style="font-size:13px;color:var(--text-muted)">${animal.raca || 'SRD'} · ${animal.idade ? animal.idade + ' ano(s)' : '—'} · ${animal.porte || '—'}</div>
          </div>
        </div>
      `;
    }

    // Adopter summary
    const resumoAdotante = document.getElementById('resumo-adotante');
    if (resumoAdotante) {
      resumoAdotante.innerHTML = `
        <div style="font-size:13px;color:var(--text-sec)">
          <div><strong>Nome:</strong> ${document.getElementById('nomeCompleto').value}</div>
          <div><strong>CPF:</strong> ${document.getElementById('cpf').value}</div>
          <div><strong>E-mail:</strong> ${document.getElementById('email').value}</div>
          <div><strong>Telefone:</strong> ${document.getElementById('telefone').value}</div>
          <div><strong>Endereço:</strong> ${document.getElementById('endereco').value}</div>
        </div>
      `;
    }
  }

  // ─── Enviar Adoção ────────────────────────────────────────

async function enviarAdocao() {
  const btn = document.getElementById('btnEnviar');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const adopterPayload = {
    nomeCompleto: document.getElementById('nomeCompleto').value,
    cpf:          document.getElementById('cpf').value,
    email:        document.getElementById('email').value,
    telefone:     document.getElementById('telefone').value,
    endereco:     document.getElementById('endereco').value,
  };

  try {
    // Tenta criar adotante via API
    const adopter = await fetch(`${API_BASE}/adotantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adopterPayload),
    });

    if (!adopter.ok) throw new Error('Erro ao criar perfil de adotante');
    const adopterData = await adopter.json();

    // Tenta criar adoção via API
    const adoption = await fetch(`${API_BASE}/adocoes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idAnimal:    selectedAnimalId,
        idAdotante:  adopterData.idAdotante,
        status:      'em_andamento',
        observacoes: document.getElementById('observacoes')?.value || '',
      }),
    });

    if (!adoption.ok) throw new Error('Erro ao registrar adoção');

    // ✅ Atualiza o animal para "em_processo" via API
    const animalRes = await fetch(`${API_BASE}/animais/${selectedAnimalId}`);
    if (animalRes.ok) {
      const animal = await animalRes.json();
      animal.statusAdocao = 'em_processo';
      await fetch(`${API_BASE}/animais/${selectedAnimalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(animal),
      });
      invalidateAnimalsCache();
    }

    mostrarSucesso();

  } catch (erro) {
    console.warn('[Adoption] API indisponível, salvando localmente:', erro);

    // ✅ Fallback: salva no localStorage com animalId para o admin poder atualizar depois
    const animals = await fetchAnimals().catch(() => []);
    const animal  = animals.find(a => a.idAnimal === selectedAnimalId);

    const localRecord = {
      animalId:   selectedAnimalId,           // ← campo que faltava
      animalName: animal?.nome || '—',
      adopter:    adopterPayload,
      date:       new Date().toISOString(),
      status:     'em_andamento',
      observacoes: document.getElementById('observacoes')?.value || '',
    };

    const existing = JSON.parse(localStorage.getItem('ca_adoptions') || '[]');
    existing.push(localRecord);
    localStorage.setItem('ca_adoptions', JSON.stringify(existing));

    // ✅ Atualiza o animal para "em_processo" no localStorage também
    const animaisRaw = localStorage.getItem('ca_animals');
    if (animaisRaw) {
      const animais = JSON.parse(animaisRaw);
      const idx = animais.findIndex(a => a.idAnimal === selectedAnimalId);
      if (idx !== -1) {
        animais[idx].statusAdocao = 'em_processo';
        localStorage.setItem('ca_animals', JSON.stringify(animais));
        invalidateAnimalsCache();
      }
    }

    mostrarSucesso();
  }
}

// ── Helper: exibe tela de sucesso ──────────────────────────
function mostrarSucesso() {
  const formWrap   = document.getElementById('formWrap');
  const sucessoWrap = document.getElementById('sucessoWrap');
  if (formWrap)    formWrap.style.display = 'none';
  if (sucessoWrap) sucessoWrap.classList.add('visivel');
}
  // ─── Estilo para animal selecionado ────────────────────────

  const style = document.createElement('style');
  style.textContent = `
    .animal-selection-card {
      border: 2px solid var(--border);
      border-radius: 12px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .animal-selection-card:hover {
      border-color: var(--laranja);
      background: rgba(224, 92, 42, 0.03);
    }
    .animal-selection-card.selecionado {
      border-color: var(--laranja);
      background: rgba(224, 92, 42, 0.1);
      box-shadow: 0 0 0 2px rgba(224, 92, 42, 0.2);
    }
    .animal-card-photo {
      width: 100%;
      height: 140px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--bg-muted);
    }
    .animal-card-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }
    .animal-card-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .animal-card-name {
      font-weight: 600;
      font-size: 14px;
      color: var(--text);
    }
    .animal-card-meta {
      font-size: 12px;
      color: var(--text-muted);
    }
    .step-item.concluido::before {
      content: '✓';
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: #4a7c59;
      font-weight: bold;
    }
    .step-linha.concluido {
      background: #4a7c59;
    }
  `;
  document.head.appendChild(style);
