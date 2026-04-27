/**
 * recomendacao.js — Integração com o serviço de ML
 * Consome a API Python em localhost:5001
 */

const ML_API = 'http://localhost:5001';

/**
 * Busca recomendações de animais baseadas no perfil do adotante.
 * @param {Object} perfil - { especiePreferida, espacoDisponivel, experiencia }
 * @param {Array}  animais - lista de animais disponíveis
 * @returns {Promise<Array>} animais ordenados por compatibilidade
 */
async function buscarRecomendacoes(perfil, animais) {
  try {
    const res = await fetch(`${ML_API}/recomendar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ perfil, animais }),
    });
    if (!res.ok) throw new Error(`ML API erro ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[ML] Serviço indisponível, retornando sem ordenação:', err.message);
    return animais; // fallback: retorna sem recomendação
  }
}

/**
 * Abre o modal de perfil para coletar preferências do adotante
 * e exibe os animais recomendados.
 */
function abrirModalRecomendacao() {
  // Remove modal anterior se existir
  document.getElementById('mlModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'mlModal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:500;
    display:flex;align-items:center;justify-content:center;
    padding:1rem;backdrop-filter:blur(4px)
  `;

  modal.innerHTML = `
    <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:1.5rem;
                width:100%;max-width:440px;padding:2rem;font-family:'DM Sans',sans-serif">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.5rem">
        <div style="font-family:'Playfair Display',serif;font-size:20px;font-weight:700;color:var(--text)">
          🤖 Encontre seu match
        </div>
        <button onclick="document.getElementById('mlModal').remove()"
                style="background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted)">✕</button>
      </div>

      <div style="display:flex;flex-direction:column;gap:1rem">
        <div>
          <label style="font-size:13px;color:var(--text-sec);display:block;margin-bottom:6px">
            Qual animal prefere?
          </label>
          <select id="mlEspecie" style="width:100%;padding:10px 14px;border-radius:10px;
            border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:14px">
            <option value="cao">🐕 Cão</option>
            <option value="gato">🐱 Gato</option>
          </select>
        </div>

        <div>
          <label style="font-size:13px;color:var(--text-sec);display:block;margin-bottom:6px">
            Espaço disponível na sua casa
          </label>
          <select id="mlEspaco" style="width:100%;padding:10px 14px;border-radius:10px;
            border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:14px">
            <option value="pequeno">Apartamento pequeno</option>
            <option value="medio">Apartamento grande / Casa</option>
            <option value="grande">Casa com quintal</option>
          </select>
        </div>

        <div>
          <label style="font-size:13px;color:var(--text-sec);display:block;margin-bottom:6px">
            Experiência com animais
          </label>
          <select id="mlExperiencia" style="width:100%;padding:10px 14px;border-radius:10px;
            border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:14px">
            <option value="nenhuma">Nunca tive animal</option>
            <option value="alguma">Já tive animal antes</option>
            <option value="muita">Tenho ou tive vários</option>
          </select>
        </div>
      </div>

      <button onclick="executarRecomendacao()"
              style="width:100%;margin-top:1.5rem;background:var(--laranja);color:white;
                     border:none;border-radius:50px;padding:12px;font-size:15px;
                     font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif">
        🔍 Ver animais compatíveis
      </button>
    </div>
  `;

  document.body.appendChild(modal);
}

async function executarRecomendacao() {
  const perfil = {
    especiePreferida: document.getElementById('mlEspecie').value,
    espacoDisponivel: document.getElementById('mlEspaco').value,
    experiencia:      document.getElementById('mlExperiencia').value,
  };

  // Fecha o modal
  document.getElementById('mlModal')?.remove();

  // Busca animais disponíveis
  const todosAnimais = await fetchAnimals();
  const disponiveis  = todosAnimais.filter(a => a.statusAdocao === 'disponivel');

  // Chama o ML
  const recomendados = await buscarRecomendacoes(perfil, disponiveis);

  // Renderiza no grid com badge de compatibilidade
  const grid = document.getElementById('animalGrid');
  if (!grid) return;

  if (!recomendados.length) {
    grid.innerHTML = '<div class="empty"><p>🐾 Nenhum animal disponível.</p></div>';
    return;
  }

  grid.innerHTML = recomendados.map(a => {
    const card = generateAnimalCard(a, true);
    // Injeta badge de compatibilidade se disponível
    if (a.compatibilidade !== undefined) {
      return card.replace(
        'class="animal-card"',
        `class="animal-card" data-compat="${a.compatibilidade}"`
      ).replace(
        '</div></div>',
        `<div style="padding:0 1rem 1rem;font-size:12px;color:var(--laranja);font-weight:600;font-family:'DM Sans',sans-serif">
          🤖 ${a.compatibilidade}% compatível
        </div></div>`
      );
    }
    return card;
  }).join('');

  // Mostra aviso de resultado
  showNotification(`${recomendados.length} animais ordenados por compatibilidade!`, 'success');
}