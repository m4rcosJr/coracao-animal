/**
 * dashboard.js — Dashboard Analítico Funcional
 * Coração Animal — PIM III UNIP
 *
 * Busca dados REAIS da API em localhost:5000.
 * Fallback automático para localStorage quando API está offline.
 *
 * IDs dos elementos no index.html:
 *   dash-total-animals | dash-available | dash-adoptions
 *   dash-month-adoptions | dash-adopters | dash-raised
 *   dash-rate | dash-rate-bar | dash-adopted (hero)
 *   monthlyChart (canvas do gráfico)
 */

const DASH_API = 'http://localhost:5000/api';

// ─── Estado ────────────────────────────────────────────────────────
let _dashStats = null;  // cache dos dados para redesenhar o gráfico

// ─── 1. BUSCA DE DADOS ─────────────────────────────────────────────

/**
 * Busca todos os dados necessários da API em paralelo.
 * Se qualquer endpoint falhar, usa localStorage como fallback.
 * @returns {Promise<Object>} estatísticas calculadas
 */
async function loadDashboardData() {
  mostrarLoading(true);

  let animais = [], adotantes = [], adocoes = [], doacoes = [];
  let usouAPI = false;

  try {
    console.log('[Dashboard] Buscando dados da API...');

    // Busca os 4 endpoints em paralelo para ser mais rápido
    const resultados = await Promise.allSettled([
      fetch(`${DASH_API}/animais`,    { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : []),
      fetch(`${DASH_API}/adotantes`,  { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : []),
      fetch(`${DASH_API}/adocoes`,    { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : []),
      fetch(`${DASH_API}/doacoes`,    { signal: AbortSignal.timeout(5000) }).then(r => r.ok ? r.json() : []),
    ]);

    // Extrai valor ou array vazio para cada endpoint
    animais   = resultados[0].status === 'fulfilled' ? resultados[0].value : [];
    adotantes = resultados[1].status === 'fulfilled' ? resultados[1].value : [];
    adocoes   = resultados[2].status === 'fulfilled' ? resultados[2].value : [];
    doacoes   = resultados[3].status === 'fulfilled' ? resultados[3].value : [];

    // Considera que usou a API se pelo menos animais respondeu
    usouAPI = animais.length > 0 || adocoes.length > 0;

    console.log('[Dashboard] API respondeu:', {
      animais: animais.length,
      adotantes: adotantes.length,
      adocoes: adocoes.length,
      doacoes: doacoes.length,
    });

  } catch (erro) {
    console.warn('[Dashboard] API indisponível:', erro.message);
  }

  // Mescla dados da API com registros locais (adoções feitas pelo formulário do site)
  const adocoesLocais = JSON.parse(localStorage.getItem('ca_adoptions') || '[]');
  const animaisLocais = JSON.parse(localStorage.getItem('ca_animals')   || '[]');

  // Se a API não retornou nada, usa o localStorage
  if (!usouAPI) {
    animais = animaisLocais;
    adocoes = adocoesLocais;
    console.log('[Dashboard] Usando dados do localStorage');
  } else {
    // Mescla: adiciona adoções locais que não vieram da API
    const idsAPI = new Set(adocoes.map(a => a.idAdocao));
    adocoesLocais.forEach(local => {
      if (!idsAPI.has(local.id)) adocoes.push(local);
    });
  }

  // Calcula as estatísticas
  const stats = calcularEstatisticas(animais, adotantes, adocoes, doacoes, !usouAPI);
  mostrarLoading(false);
  return stats;
}

// ─── 2. CÁLCULO DAS ESTATÍSTICAS ───────────────────────────────────

/**
 * Calcula todas as métricas a partir dos arrays de dados.
 * Também calcula os dados mensais REAIS para o gráfico.
 * @param {Array} animais
 * @param {Array} adotantes
 * @param {Array} adocoes
 * @param {Array} doacoes
 * @param {boolean} simulado - se veio do localStorage
 * @returns {Object}
 */
function calcularEstatisticas(animais, adotantes, adocoes, doacoes, simulado) {
  const agora = new Date();
  const mesAtual = agora.getMonth();
  const anoAtual = agora.getFullYear();

  // Contagens básicas
  const totalAnimais    = animais.length;
  const disponiveis     = animais.filter(a => a.statusAdocao === 'disponivel').length;
  const adotados        = animais.filter(a => a.statusAdocao === 'adotado').length;
  const totalAdocoes    = adocoes.length;
  const totalAdotantes  = adotantes.length;
  const totalArrecadado = doacoes.reduce((soma, d) => soma + (d.valor || d.Valor || 0), 0);

  // Adoções deste mês — lê a data de cada adoção
  const adocoesMes = adocoes.filter(a => {
    const data = new Date(
      a.dataAdocao || a.DataAdocao ||   // campo da API C#
      a.date       ||                    // campo do localStorage
      0
    );
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  }).length;

  // Taxa de adoção = adotados / (total + adotados) * 100
  const taxa = (totalAnimais + adotados) > 0
    ? Math.round((adotados / (totalAnimais + adotados)) * 100)
    : 0;

  // Monta arrays mensais REAIS para o gráfico (12 meses do ano atual)
  const adocoesPorMes  = contarPorMes(adocoes, 'dataAdocao', 'DataAdocao', 'date', anoAtual);
  const doacoesPorMes  = contarPorMes(doacoes, 'dataDoacao', 'DataDoacao', 'date', anoAtual);

  console.log('[Dashboard] Estatísticas calculadas:', {
    totalAnimais, disponiveis, adotados, totalAdocoes, adocoesMes, taxa, simulado
  });

  return {
    totalAnimais,
    disponiveis,
    adotados,
    totalAdocoes,
    adocoesMes,
    totalAdotantes,
    totalArrecadado,
    taxa,
    simulado,
    adocoesPorMes,   // array[12] com contagem real por mês
    doacoesPorMes,   // array[12] com contagem real por mês
  };
}

/**
 * Conta registros por mês para um determinado ano.
 * Aceita múltiplos nomes de campo de data (API vs localStorage).
 * @param {Array}  lista - array de objetos
 * @param {string} ...campos - nomes possíveis do campo de data
 * @param {number} ano
 * @returns {number[]} array de 12 posições (Jan=0 ... Dez=11)
 */
function contarPorMes(lista, ...args) {
  // Último argumento é o ano, os anteriores são nomes de campos
  const ano = args.pop();
  const campos = args;
  const contagem = new Array(12).fill(0);

  lista.forEach(item => {
    // Tenta cada nome de campo até encontrar uma data válida
    let dataStr = null;
    for (const campo of campos) {
      if (item[campo]) { dataStr = item[campo]; break; }
    }
    if (!dataStr) return;

    const data = new Date(dataStr);
    if (isNaN(data.getTime())) return;
    if (data.getFullYear() !== ano) return;

    contagem[data.getMonth()]++;
  });

  return contagem;
}

// ─── 3. RENDERIZAÇÃO ───────────────────────────────────────────────

/**
 * Atualiza todos os elementos do dashboard com os dados calculados.
 * @param {Object} stats - retorno de calcularEstatisticas()
 */
function renderDashboard(stats) {
  // Mapa: ID do elemento → valor e formato
  const mapa = {
    'dash-total-animals':   { valor: stats.totalAnimais,    formato: 'numero'  },
    'dash-available':       { valor: stats.disponiveis,     formato: 'numero'  },
    'dash-adoptions':       { valor: stats.totalAdocoes,    formato: 'numero'  },
    'dash-month-adoptions': { valor: stats.adocoesMes,      formato: 'numero'  },
    'dash-adopters':        { valor: stats.totalAdotantes,  formato: 'numero'  },
    'dash-raised':          { valor: stats.totalArrecadado, formato: 'moeda'   },
    'dash-rate':            { valor: stats.taxa,            formato: 'percent' },
    'dash-adopted':         { valor: stats.totalAdocoes,    formato: 'numero'  }, // hero - vidas transformadas
  };

  Object.entries(mapa).forEach(([id, { valor, formato }]) => {
    animarContador(id, valor, formato);
  });

  // Barra de progresso da taxa de adoção
  const barra = document.getElementById('dash-rate-bar');
  if (barra) {
    setTimeout(() => { barra.style.width = stats.taxa + '%'; }, 400);
  }

  // Badge "dados simulados" — aparece só quando a API está offline
  document.querySelectorAll('.dash-simulated-badge').forEach(el => {
    el.style.display = stats.simulado ? 'inline-flex' : 'none';
  });

  // Badges de fonte no cabeçalho do gráfico
  const apiBadge     = document.getElementById('dashFonteLabel');
  const offlineBadge = document.getElementById('dashOfflineLabel');
  if (apiBadge)     apiBadge.style.display     = stats.simulado ? 'none'         : 'inline-block';
  if (offlineBadge) offlineBadge.style.display  = stats.simulado ? 'inline-block' : 'none';

  // Desenha o gráfico com dados reais
  desenharGrafico(stats.adocoesPorMes, stats.doacoesPorMes);

  // Salva referência global para redesenho ao trocar tema
  window._dashStats = stats;
}

/**
 * Anima um contador de 0 até o valor final com easing suave.
 * @param {string} id - ID do elemento
 * @param {number} valorFinal
 * @param {'numero'|'moeda'|'percent'} formato
 */
function animarContador(id, valorFinal, formato) {
  const el = document.getElementById(id);
  if (!el) return;

  const duracao = 1400;
  const inicio  = performance.now();

  function atualizar(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    const ease      = 1 - Math.pow(1 - progresso, 3); // cubic ease-out
    const valor     = Math.round(valorFinal * ease);

    if (formato === 'moeda') {
      el.textContent = valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } else if (formato === 'percent') {
      el.textContent = valor + '%';
    } else {
      el.textContent = valor.toLocaleString('pt-BR');
    }

    if (progresso < 1) requestAnimationFrame(atualizar);
  }

  requestAnimationFrame(atualizar);
}

// ─── 4. GRÁFICO ────────────────────────────────────────────────────

/**
 * Desenha o gráfico de barras mensais com dados reais da API.
 * Usa Canvas 2D nativo (sem dependências externas).
 * @param {number[]} adocoes  - array[12] contagens por mês
 * @param {number[]} doacoes  - array[12] contagens por mês
 */
function desenharGrafico(adocoes, doacoes) {
  const canvas = document.getElementById('monthlyChart');
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  const W    = canvas.width  = canvas.offsetWidth || 600;
  const H    = canvas.height = 220;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  const PAD    = { top: 24, right: 16, bottom: 50, left: 48 };
  const areaW  = W - PAD.left - PAD.right;
  const areaH  = H - PAD.top  - PAD.bottom;
  const meses  = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const maxVal = Math.max(...adocoes, ...doacoes, 1); // evita divisão por zero
  const largB  = (areaW / meses.length) * 0.30; // largura de cada barra

  const COR_ADOCAO  = '#e05c2a';
  const COR_DOACAO  = '#4a7c59';
  const COR_TEXTO   = dark ? 'rgba(240,232,221,0.5)' : 'rgba(61,43,31,0.45)';
  const COR_GRID    = dark ? 'rgba(240,232,221,0.07)' : 'rgba(61,43,31,0.07)';

  ctx.clearRect(0, 0, W, H);

  // ── Linhas de grade e labels do eixo Y ──────────────────────────
  const passos = 5;
  for (let i = 0; i <= passos; i++) {
    const y = PAD.top + (areaH / passos) * i;

    ctx.strokeStyle = COR_GRID;
    ctx.lineWidth   = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(PAD.left, y);
    ctx.lineTo(W - PAD.right, y);
    ctx.stroke();
    ctx.setLineDash([]);

    const labelVal = Math.round(maxVal * (1 - i / passos));
    ctx.fillStyle  = COR_TEXTO;
    ctx.font       = '11px DM Sans, Arial, sans-serif';
    ctx.textAlign  = 'right';
    ctx.fillText(labelVal, PAD.left - 6, y + 4);
  }

  // ── Barras por mês ───────────────────────────────────────────────
  meses.forEach((mes, i) => {
    const slotW  = areaW / meses.length;
    const centroX = PAD.left + i * slotW + slotW / 2;

    // Barra de adoções (laranja, esquerda)
    const altAdocao = adocoes[i] > 0 ? Math.max((adocoes[i] / maxVal) * areaH, 3) : 0;
    if (altAdocao > 0) {
      ctx.fillStyle = COR_ADOCAO;
      ctx.beginPath();
      ctx.roundRect(
        centroX - largB - 2,
        PAD.top + areaH - altAdocao,
        largB, altAdocao,
        [3, 3, 0, 0]
      );
      ctx.fill();

      // Valor em cima da barra (se > 0)
      if (adocoes[i] > 0) {
        ctx.fillStyle = COR_ADOCAO;
        ctx.font      = '10px DM Sans, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(adocoes[i], centroX - largB / 2 - 2, PAD.top + areaH - altAdocao - 4);
      }
    }

    // Barra de doações (verde, direita)
    const altDoacao = doacoes[i] > 0 ? Math.max((doacoes[i] / maxVal) * areaH, 3) : 0;
    if (altDoacao > 0) {
      ctx.fillStyle = COR_DOACAO;
      ctx.beginPath();
      ctx.roundRect(
        centroX + 2,
        PAD.top + areaH - altDoacao,
        largB, altDoacao,
        [3, 3, 0, 0]
      );
      ctx.fill();

      if (doacoes[i] > 0) {
        ctx.fillStyle = COR_DOACAO;
        ctx.font      = '10px DM Sans, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(doacoes[i], centroX + largB / 2 + 2, PAD.top + areaH - altDoacao - 4);
      }
    }

    // Label do mês no eixo X
    ctx.fillStyle  = COR_TEXTO;
    ctx.font       = '11px DM Sans, Arial, sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText(mes, centroX, H - PAD.bottom + 16);

    // Destaque no mês atual
    const agora = new Date();
    if (i === agora.getMonth()) {
      ctx.strokeStyle = dark ? 'rgba(224,92,42,0.3)' : 'rgba(224,92,42,0.2)';
      ctx.lineWidth   = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(centroX, PAD.top);
      ctx.lineTo(centroX, PAD.top + areaH);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  });

  // ── Legenda ──────────────────────────────────────────────────────
  const legendaY = H - 12;
  [
    [COR_ADOCAO, 'Adoções'],
    [COR_DOACAO, 'Doações'],
  ].forEach(([cor, label], i) => {
    const x = PAD.left + i * 100;
    ctx.fillStyle = cor;
    ctx.beginPath();
    ctx.roundRect(x, legendaY - 8, 12, 10, 2);
    ctx.fill();
    ctx.fillStyle  = COR_TEXTO;
    ctx.font       = '11px DM Sans, Arial, sans-serif';
    ctx.textAlign  = 'left';
    ctx.fillText(label, x + 16, legendaY);
  });

  // Nota "dados reais" ou "sem dados ainda"
  const temDados = adocoes.some(v => v > 0) || doacoes.some(v => v > 0);
  if (!temDados) {
    ctx.fillStyle  = COR_TEXTO;
    ctx.font       = '13px DM Sans, Arial, sans-serif';
    ctx.textAlign  = 'center';
    ctx.fillText('Nenhuma adoção ou doação registrada ainda', W / 2, H / 2);
  }
}

// ─── 5. LOADING STATE ──────────────────────────────────────────────

/**
 * Mostra/oculta o estado de carregamento nos cards.
 * Enquanto carrega, exibe "..." nos valores.
 * @param {boolean} carregando
 */
function mostrarLoading(carregando) {
  const ids = [
    'dash-total-animals', 'dash-available', 'dash-adoptions',
    'dash-month-adoptions', 'dash-adopters', 'dash-raised',
    'dash-rate', 'dash-adopted',
  ];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    if (carregando) {
      el.textContent = '...';
      el.style.opacity = '0.4';
    } else {
      el.style.opacity = '1';
    }
  });
}

// ─── 6. REDESENHO AO TROCAR TEMA ───────────────────────────────────

// Redesenha o gráfico automaticamente quando o usuário troca dark/light mode
new MutationObserver(() => {
  if (window._dashStats) {
    desenharGrafico(window._dashStats.adocoesPorMes, window._dashStats.doacoesPorMes);
  }
}).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-theme'],
});

// ─── 7. INICIALIZAÇÃO ──────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const stats = await loadDashboardData();
  window._dashStats = stats;
  renderDashboard(stats);
});