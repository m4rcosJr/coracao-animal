/**
 * dashboard.js - Analytics Dashboard
 * Coracao Animal - PIM III UNIP
 *
 * Fetches data from API (with localStorage fallback),
 * calculates statistics, renders charts.
 * Designed for future ML integration.
 */

const DASHBOARD_API = 'http://localhost:5000/api';

// ─── Data Fetching ────────────────────────────

/**
 * Loads all dashboard data in parallel.
 * Falls back to localStorage / simulated data.
 * @returns {Promise<Object>} dashboard stats object
 */
async function loadDashboardData() {
  try {
    const [animals, adopters, adoptions, donations, volunteers] = await Promise.all([
      fetch(`${DASHBOARD_API}/animais`).then(r => r.ok ? r.json() : []),
      fetch(`${DASHBOARD_API}/adotantes`).then(r => r.ok ? r.json() : []),
      fetch(`${DASHBOARD_API}/adocoes`).then(r => r.ok ? r.json() : []),
      fetch(`${DASHBOARD_API}/doacoes`).then(r => r.ok ? r.json() : []),
      fetch(`${DASHBOARD_API}/voluntarios`).then(r => r.ok ? r.json() : []),
    ]);

    console.log('[Dashboard] Data from API:', { animals: animals.length, adoptions: adoptions.length });

    return buildStats(animals, adopters, adoptions, donations, volunteers, false);

  } catch (err) {
    console.warn('[Dashboard] API unavailable, using local data:', err.message);

    // Merge API animals with locally registered ones
    const localAnimals     = getLocalAnimals ? getLocalAnimals() : [];
    const localAdoptions   = getLocalAdoptions ? getLocalAdoptions() : [];

    return buildStats(localAnimals, [], localAdoptions, [], [], true);
  }
}

/**
 * Builds the statistics object from raw data arrays.
 * @param {Array}   animals
 * @param {Array}   adopters
 * @param {Array}   adoptions
 * @param {Array}   donations
 * @param {Array}   volunteers
 * @param {boolean} simulated
 * @returns {Object} stats
 */
function buildStats(animals, adopters, adoptions, donations, volunteers, simulated) {
  const now       = new Date();
  const thisMonth = now.getMonth();
  const thisYear  = now.getFullYear();

  // Adoptions this month (from localStorage records)
  const localAdoptions = getLocalAdoptions ? getLocalAdoptions() : [];
  const allAdoptions   = [...adoptions, ...localAdoptions];

  const adoptionsThisMonth = allAdoptions.filter(a => {
    const d = new Date(a.date || a.dataAdocao || 0);
    return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
  }).length;

  // Monthly breakdown for chart (last 12 months)
  const monthlyData = buildMonthlyData(allAdoptions, donations);

  return {
    totalAnimals:        animals.length          || (simulated ? 38  : 0),
    available:           animals.filter(a => a.statusAdocao === 'disponivel').length || (simulated ? 24 : 0),
    adopted:             animals.filter(a => a.statusAdocao === 'adotado').length    || (simulated ? 247 : 0),
    inTreatment:         animals.filter(a => a.statusAdocao === 'em_tratamento').length || (simulated ? 4 : 0),
    totalAdopters:       adopters.length         || (simulated ? 189 : 0),
    totalAdoptions:      adoptions.length        || (simulated ? 247 : 0),
    adoptionsThisMonth:  adoptionsThisMonth      || (simulated ? 18  : 0),
    totalDonations:      donations.length        || (simulated ? 93  : 0),
    totalRaised:         donations.reduce((s, d) => s + (d.valor || 0), 0) || (simulated ? 18450 : 0),
    totalVolunteers:     volunteers.length       || (simulated ? 120 : 0),
    adoptionRate:        animals.length > 0
                           ? Math.round((animals.filter(a => a.statusAdocao === 'adotado').length / animals.length) * 100)
                           : (simulated ? 65 : 0),
    monthlyData,
    simulated,
  };
}

/**
 * Builds monthly adoption/donation data for the chart.
 * @param {Array} adoptions
 * @param {Array} donations
 * @returns {Object} { labels, adoptionCounts, donationCounts }
 */
function buildMonthlyData(adoptions, donations) {
  const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const year   = new Date().getFullYear();

  const adoptionCounts = MONTHS.map((_, m) =>
    adoptions.filter(a => {
      const d = new Date(a.date || a.dataAdocao || 0);
      return d.getMonth() === m && d.getFullYear() === year;
    }).length
  );

  const donationCounts = MONTHS.map((_, m) =>
    donations.filter(d => {
      const date = new Date(d.datadoacao || d.dataDoacao || 0);
      return date.getMonth() === m && date.getFullYear() === year;
    }).length
  );

  // If no real data, use simulated values
  const hasData = adoptionCounts.some(v => v > 0) || donationCounts.some(v => v > 0);
  return {
    labels:         MONTHS,
    adoptionCounts: hasData ? adoptionCounts : [12,18,15,22,19,28,24,31,26,22,18,25],
    donationCounts: hasData ? donationCounts : [5, 8, 6, 10, 9, 14,11,16,13,10, 8,12],
  };
}

// ─── Rendering ────────────────────────────────

/**
 * Renders all dashboard widgets with animated counters.
 * @param {Object} stats - from loadDashboardData()
 */
function renderDashboard(stats) {
  // Stat cards
  const mapping = {
    'dash-total-animals':   { value: stats.totalAnimals,       format: 'number' },
    'dash-available':       { value: stats.available,          format: 'number' },
    'dash-adopted':         { value: stats.adopted,            format: 'number' },
    'dash-adopters':        { value: stats.totalAdopters,      format: 'number' },
    'dash-adoptions':       { value: stats.totalAdoptions,     format: 'number' },
    'dash-month-adoptions': { value: stats.adoptionsThisMonth, format: 'number' },
    'dash-donations':       { value: stats.totalDonations,     format: 'number' },
    'dash-raised':          { value: stats.totalRaised,        format: 'currency' },
    'dash-volunteers':      { value: stats.totalVolunteers,    format: 'number' },
    'dash-rate':            { value: stats.adoptionRate,       format: 'percent' },
  };

  Object.entries(mapping).forEach(([id, { value, format }]) => {
    animateCounter(id, value, format);
  });

  // Progress bar for adoption rate
  const bar = document.getElementById('dash-rate-bar');
  if (bar) setTimeout(() => { bar.style.width = stats.adoptionRate + '%'; }, 400);

  // Simulated data badge
  if (stats.simulated) {
    document.querySelectorAll('.dash-simulated-badge').forEach(el => {
      el.style.display = 'inline-flex';
    });
  }

  // Draw chart
  if (stats.monthlyData) {
    drawMonthlyChart(stats.monthlyData);
  }
}

/**
 * Animates a number counter from 0 to target.
 * @param {string} id      - element ID
 * @param {number} target  - final value
 * @param {string} format  - 'number' | 'currency' | 'percent'
 */
function animateCounter(id, target, format = 'number') {
  const el = document.getElementById(id);
  if (!el) return;

  const duration = 1400;
  const start    = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    const ease     = 1 - Math.pow(1 - progress, 3); // cubic ease-out
    const value    = Math.round(target * ease);

    if (format === 'currency') {
      el.textContent = value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    } else if (format === 'percent') {
      el.textContent = value + '%';
    } else {
      el.textContent = value.toLocaleString('pt-BR');
    }

    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

/**
 * Draws the monthly adoptions/donations bar chart on a canvas.
 * @param {Object} data - { labels, adoptionCounts, donationCounts }
 */
function drawMonthlyChart(data) {
  const canvas = document.getElementById('monthlyChart');
  if (!canvas) return;

  const ctx  = canvas.getContext('2d');
  const W    = canvas.width  = canvas.offsetWidth  || 600;
  const H    = canvas.height = 200;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';

  const COLORS = {
    adoption:  '#e05c2a',
    donation:  '#4a7c59',
    text:      dark ? 'rgba(240,232,221,0.5)' : 'rgba(61,43,31,0.45)',
    grid:      dark ? 'rgba(240,232,221,0.06)' : 'rgba(61,43,31,0.06)',
  };

  const PAD    = { top: 20, right: 16, bottom: 44, left: 44 };
  const areaW  = W - PAD.left - PAD.right;
  const areaH  = H - PAD.top  - PAD.bottom;
  const maxVal = Math.max(...data.adoptionCounts, ...data.donationCounts, 1);
  const barW   = (areaW / data.labels.length) * 0.32;

  ctx.clearRect(0, 0, W, H);

  // Grid lines & Y-axis labels
  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (areaH / 4) * i;
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth   = 1;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
    ctx.fillStyle   = COLORS.text;
    ctx.font        = '10px DM Sans, sans-serif';
    ctx.textAlign   = 'right';
    ctx.fillText(Math.round(maxVal * (1 - i / 4)), PAD.left - 6, y + 3);
  }

  // Bars
  data.labels.forEach((label, i) => {
    const slotW  = areaW / data.labels.length;
    const centerX = PAD.left + i * slotW + slotW / 2;

    // Adoption bar (left)
    const hA = (data.adoptionCounts[i] / maxVal) * areaH;
    ctx.fillStyle = COLORS.adoption;
    ctx.beginPath();
    ctx.roundRect(centerX - barW - 2, PAD.top + areaH - hA, barW, hA, [3, 3, 0, 0]);
    ctx.fill();

    // Donation bar (right)
    const hD = (data.donationCounts[i] / maxVal) * areaH;
    ctx.fillStyle = COLORS.donation;
    ctx.beginPath();
    ctx.roundRect(centerX + 2, PAD.top + areaH - hD, barW, hD, [3, 3, 0, 0]);
    ctx.fill();

    // X-axis label
    ctx.fillStyle = COLORS.text;
    ctx.font      = '10px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, centerX, H - PAD.bottom + 14);
  });

  // Legend
  const legendY = H - 10;
  [[COLORS.adoption, 'Adoções'], [COLORS.donation, 'Doações']].forEach(([color, label], i) => {
    const x = PAD.left + i * 90;
    ctx.fillStyle = color;
    ctx.fillRect(x, legendY - 8, 10, 10);
    ctx.fillStyle = COLORS.text;
    ctx.font      = '10px DM Sans, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(label, x + 14, legendY);
  });
}

// Re-draw chart on theme change
new MutationObserver(() => {
  const canvas = document.getElementById('monthlyChart');
  if (canvas) {
    // Trigger redraw by dispatching event
    document.dispatchEvent(new Event('redrawChart'));
  }
}).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

// ─── Initialize ───────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  const stats = await loadDashboardData();
  renderDashboard(stats);

  // Redraw chart on theme change
  document.addEventListener('redrawChart', () => {
    if (stats.monthlyData) drawMonthlyChart(stats.monthlyData);
  });
});