/* ─────────────────────────────────────────
   CORACAO ANIMAL — Logica da Pagina de Doacoes
   doacoes.js
   Contem: selecao de valor, formulario,
           envio para API e tela de sucesso
───────────────────────────────────────── */

const API_URL = 'http://localhost:5000/api';

// Valor selecionado pelo usuario (em reais)
let valorSelecionado = 0;

// Flag que indica se o usuario escolheu valor customizado
let valorCustomizado = false;

/* ── Seleciona um valor predefinido ──────*/
function selecionarValor(valor, btn) {
  // Remove selecao de todos os botoes de valor
  document.querySelectorAll('.btn-valor, .btn-valor-outro')
    .forEach(b => b.classList.remove('selecionado'));

  // Marca o botao clicado como selecionado
  btn.classList.add('selecionado');

  // Salva o valor selecionado
  valorSelecionado = valor;
  valorCustomizado = false;

  // Esconde o campo de valor customizado
  document.getElementById('inputValorWrap').classList.remove('visivel');

  // Atualiza o resumo do valor na tela
  atualizarResumo();
}

/* ── Ativa o campo de valor customizado ──*/
function ativarValorCustomizado(btn) {
  // Remove selecao dos botoes predefinidos
  document.querySelectorAll('.btn-valor')
    .forEach(b => b.classList.remove('selecionado'));

  // Marca o botao "outro valor" como selecionado
  btn.classList.add('selecionado');

  // Mostra o campo de input customizado
  document.getElementById('inputValorWrap').classList.add('visivel');

  // Foca no campo para facilitar a digitacao
  document.getElementById('valorCustom').focus();

  valorCustomizado = true;
  valorSelecionado = 0;
  atualizarResumo();
}

/* ── Atualiza o valor customizado ────────*/
function onValorCustom(input) {
  // Converte o valor digitado para numero
  const v = parseFloat(input.value) || 0;
  valorSelecionado = v;
  atualizarResumo();
}

/* ── Atualiza o resumo do valor na tela ──*/
function atualizarResumo() {
  const resumoEl = document.getElementById('resumoValor');
  const btnDoar  = document.getElementById('btnDoar');

  if (valorSelecionado > 0) {
    // Formata como moeda brasileira: R$ 50,00
    resumoEl.textContent = valorSelecionado.toLocaleString('pt-BR', {
      style:    'currency',
      currency: 'BRL'
    });
    btnDoar.disabled = false;
  } else {
    resumoEl.textContent = 'R$ 0,00';
    btnDoar.disabled = true;
  }
}

/* ── Alterna visibilidade dos dados pessoais */
function onAnonimo(checkbox) {
  const camposDados = document.getElementById('camposDados');

  // Se marcou anonimo, esconde os campos pessoais
  // Se desmarcou, mostra os campos
  camposDados.style.display = checkbox.checked ? 'none' : 'block';
}

/* ── Envia a doacao para a API ───────────*/
async function enviarDoacao() {
  // Valida o valor antes de enviar
  if (valorSelecionado <= 0) {
    alert('Por favor, selecione ou informe um valor para a doacao.');
    return;
  }

  const btnDoar = document.getElementById('btnDoar');
  btnDoar.textContent = 'Enviando...';
  btnDoar.disabled = true;

  try {
    const anonimo = document.getElementById('anonimo').checked;

    // Monta o objeto de doacao conforme esperado pela API
    const doacaoData = {
      // Se for anonima, nao envia id_adotante (fica null no banco)
      idAdotante:      null,
      valor:           valorSelecionado,
      formaPagamento:  document.getElementById('formaPagamento').value,
      statusPagamento: 'confirmado',
      descricao:       document.getElementById('descricao').value || '',
    };

    // Se nao for anonima, cadastra o doador primeiro
    if (!anonimo) {
      const nome  = document.getElementById('nomeDoador').value.trim();
      const email = document.getElementById('emailDoador').value.trim();

      // Valida os campos obrigatorios do doador
      if (!nome || !email) {
        alert('Por favor, preencha seu nome e e-mail ou marque a opcao de doacao anonima.');
        btnDoar.textContent = 'Confirmar doacao';
        btnDoar.disabled = false;
        return;
      }

      // Cadastra o adotante/doador na API
      const resAdotante = await fetch(`${API_URL}/adotantes`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomeCompleto: nome,
          cpf:          '000.000.000-00', // CPF ficticio para doadores
          email:        email,
          telefone:     document.getElementById('telefoneDoador').value || '',
          endereco:     '',
        }),
      });

      if (resAdotante.ok) {
        const adotante = await resAdotante.json();
        doacaoData.idAdotante = adotante.idAdotante;
      }
    }

    // Envia a doacao para a API
    const resDoacao = await fetch(`${API_URL}/doacoes`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(doacaoData),
    });

    if (!resDoacao.ok) throw new Error('Erro ao registrar doacao');

    // Mostra a tela de sucesso
    document.getElementById('formDoacaoWrap').style.display = 'none';
    document.getElementById('sucessoWrap').classList.add('visivel');

  } catch (erro) {
    alert('Ocorreu um erro ao processar a doacao. Verifique se o backend esta rodando.');
    btnDoar.textContent = 'Confirmar doacao';
    btnDoar.disabled = false;
  }
}

// Inicializa com o botao de doacao desabilitado
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btnDoar').disabled = true;
});