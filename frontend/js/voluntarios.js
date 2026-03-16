/* ─────────────────────────────────────────
   CORACAO ANIMAL — Logica da Pagina de Voluntarios
   voluntarios.js
   Contem: selecao de area, formulario,
           envio para API, lista de voluntarios
───────────────────────────────────────── */

const API_URL = 'http://localhost:5000/api';

// Area de atuacao selecionada pelo usuario
let areaSelecionada = '';

/* ── Seleciona uma area de atuacao ───────*/
function selecionarArea(area, card) {
  // Remove selecao anterior
  document.querySelectorAll('.area-card')
    .forEach(c => c.classList.remove('selecionada'));

  // Marca o card clicado
  card.classList.add('selecionada');

  // Salva a area e preenche o select do formulario
  areaSelecionada = area;
  const selectArea = document.getElementById('areaAtuacao');
  selectArea.value = area;
}

/* ── Valida os campos obrigatorios ───────*/
function validarFormulario() {
  let valido = true;

  const campos = [
    { id: 'nomeCompleto', msg: 'Nome completo e obrigatorio' },
    { id: 'email',        msg: 'E-mail e obrigatorio' },
  ];

  campos.forEach(campo => {
    const input = document.getElementById(campo.id);
    const erro  = document.getElementById(`erro-${campo.id}`);

    if (!input.value.trim()) {
      input.classList.add('invalido');
      if (erro) { erro.textContent = campo.msg; erro.classList.add('visivel'); }
      valido = false;
    } else {
      input.classList.remove('invalido');
      if (erro) erro.classList.remove('visivel');
    }
  });

  // Valida o formato do e-mail
  const emailInput = document.getElementById('email');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailInput.value && !emailRegex.test(emailInput.value)) {
    emailInput.classList.add('invalido');
    const erroEmail = document.getElementById('erro-email');
    if (erroEmail) { erroEmail.textContent = 'E-mail invalido'; erroEmail.classList.add('visivel'); }
    valido = false;
  }

  return valido;
}

/* ── Envia o cadastro para a API ─────────*/
async function enviarCadastro() {
  if (!validarFormulario()) return;

  const btn = document.getElementById('btnCadastrar');
  btn.textContent = 'Enviando...';
  btn.disabled = true;

  try {
    // Monta o objeto conforme esperado pela API
    const voluntarioData = {
      nomeCompleto: document.getElementById('nomeCompleto').value,
      email:        document.getElementById('email').value,
      telefone:     document.getElementById('telefone').value || '',
      areaAtuacao:  document.getElementById('areaAtuacao').value || areaSelecionada,
    };

    const resposta = await fetch(`${API_URL}/voluntarios`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(voluntarioData),
    });

    if (!resposta.ok) throw new Error('Erro ao cadastrar voluntario');

    // Mostra a tela de sucesso
    document.getElementById('formVoluntarioWrap').style.display = 'none';
    document.getElementById('sucessoWrap').classList.add('visivel');

    // Recarrega a lista de voluntarios
    carregarVoluntarios();

  } catch (erro) {
    alert('Ocorreu um erro ao cadastrar. Verifique se o backend esta rodando.');
    btn.textContent = 'Quero ser voluntario';
    btn.disabled = false;
  }
}

/* ── Carrega a lista de voluntarios ──────*/
async function carregarVoluntarios() {
  const grid = document.getElementById('voluntariosGrid');
  if (!grid) return;

  try {
    const resposta = await fetch(`${API_URL}/voluntarios`);
    if (!resposta.ok) throw new Error('Erro na API');

    const voluntarios = await resposta.json();

    if (voluntarios.length === 0) {
      grid.innerHTML = `
        <div class="empty" style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-secondary)">
          <p>Nenhum voluntario cadastrado ainda. Seja o primeiro!</p>
        </div>
      `;
      return;
    }

    // Gera as iniciais do nome para o avatar
    grid.innerHTML = voluntarios.map(v => {
      const partes   = v.nomeCompleto.trim().split(' ');
      const iniciais = partes.length >= 2
        ? partes[0][0] + partes[partes.length - 1][0]
        : partes[0][0];

      return `
        <div class="voluntario-card">
          <div class="voluntario-avatar">${iniciais.toUpperCase()}</div>
          <div class="voluntario-nome">${v.nomeCompleto}</div>
          <div class="voluntario-area">${v.areaAtuacao || 'Area nao informada'}</div>
          <span class="voluntario-tag">Voluntario ativo</span>
        </div>
      `;
    }).join('');

  } catch (erro) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1;text-align:center;padding:2rem;color:var(--text-secondary)">
        <p>Nao foi possivel carregar os voluntarios.</p>
      </div>
    `;
  }
}

// Inicializa
carregarVoluntarios();