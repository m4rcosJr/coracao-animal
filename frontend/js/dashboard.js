/**
 * dashboard.js — Analytics Dashboard
 * Coracao Animal — PIM III UNIP
 *
 * Loads data from API (fallback: localStorage + simulated data).
 * Animates counters, renders bar chart.
 * Designed for future ML integration.
 */

const DASH_API = 'http://localhost:5000/api';

async function loadDashboardData() {
  let simulated = false;
  let animals = [], adopters = [], adoptions = [], donations = [], volunteers = [];

  try {
    [animals, adopters, adoptions, donations, volunteers] = await Promise.all([
      fetch(`${DASH_API}/animais`).then(r => r.ok ? r.json() : []),
      fetch(`${DASH_API}/adotantes`).then(r => r.ok ? r.json() : []),
      fetch(`${DASH_API}/adocoes`).then(r => r.ok ? r.json() : []),
      fetch(`${DASH_API}/doacoes`).then(r => r.ok ? r.json() : []),
      fetch(`${DASH_API}/voluntarios`).then(r => r.ok ? r.json() : []),
    ]);
  } catch {
    simulated = true;
    animals = JSON.parse(localStorage.getItem('ca_animals') || '[]');
    adoptions = JSON.parse(localStorage.getItem('ca_adoptions') || '[]');
  }

  const now = new Date();
  const localAdoptions = JSON.parse(localStorage.getItem('ca_adoptions') || '[]');
  const allAdoptions   = [...adoptions, ...localAdoptions];

  const thisMonthAdoptions = allAdoptions.filter(a => {
    const d = new Date(a.date || a.dataAdocao || 0);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return {
    totalAnimals:       animals.length       || (simulated ? 38  : 0),
    available:          animals.filter(a => a.statusAdocao === 'disponivel').length || (simulated ? 24 : 0),
    adopted:            animals.filter(a => a.statusAdocao === 'adotado').length    || (simulated ? 247 : 0),
    totalAdopters:      adopters.length      || (simulated ? 189 : 0),
    totalAdoptions:     adoptions.length     || (simulated ? 247 : 0),
    monthAdoptions:     thisMonthAdoptions   || (simulated ? 18  : 0),
    totalDonations:     donations.length     || (simulated ? 93  : 0),
    totalRaised:        donations.reduce((s,d) => s+(d.valor||0), 0) || (simulated ? 18450 : 0),
    totalVolunteers:    volunteers.length    || (simulated ? 120 : 0),
    adoptionRate:       animals.length > 0
                          ? Math.round(animals.filter(a=>a.statusAdocao==='adotado').length/animals.length*100)
                          : (simulated ? 65 : 0),
    simulated,
    monthlyAdoptions:   [12,18,15,22,19,28,24,31,26,22,18,25],
    monthlyDonations:   [5, 8, 6, 10, 9, 14,11,16,13,10, 8,12],
  };
}

function renderDashboard(stats) {
  const map = {
    'dash-total-animals':   { v: stats.totalAnimals,    fmt: 'n' },
    'dash-available':       { v: stats.available,       fmt: 'n' },
    'dash-adopted':         { v: stats.adopted,         fmt: 'n' },
    'dash-adopters':        { v: stats.totalAdopters,   fmt: 'n' },
    'dash-adoptions':       { v: stats.totalAdoptions,  fmt: 'n' },
    'dash-month-adoptions': { v: stats.monthAdoptions,  fmt: 'n' },
    'dash-donations':       { v: stats.totalDonations,  fmt: 'n' },
    'dash-raised':          { v: stats.totalRaised,     fmt: '$' },
    'dash-volunteers':      { v: stats.totalVolunteers, fmt: 'n' },
    'dash-rate':            { v: stats.adoptionRate,    fmt: '%' },
  };

  Object.entries(map).forEach(([id, { v, fmt }]) => animateCounter(id, v, fmt));

  const bar = document.getElementById('dash-rate-bar');
  if (bar) setTimeout(() => { bar.style.width = stats.adoptionRate + '%'; }, 400);

  if (stats.simulated) {
    document.querySelectorAll('.dash-simulated-badge').forEach(el => {
      el.style.display = 'inline-flex';
    });
  }

  drawChart(stats.monthlyAdoptions, stats.monthlyDonations);
}

function animateCounter(id, target, fmt) {
  const el = document.getElementById(id);
  if (!el) return;
  const dur = 1400, start = performance.now();
  const tick = now => {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    const v = Math.round(target * e);
    if (fmt === '$') el.textContent = v.toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
    else if (fmt === '%') el.textContent = v + '%';
    else el.textContent = v.toLocaleString('pt-BR');
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function drawChart(adArr, donArr) {
  const canvas = document.getElementById('monthlyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width = canvas.offsetWidth || 600, H = canvas.height = 200;
  const dark = document.documentElement.getAttribute('data-theme') === 'dark';
  const PAD = { top:20, right:16, bottom:44, left:44 };
  const aW = W - PAD.left - PAD.right, aH = H - PAD.top - PAD.bottom;
  const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
  const max = Math.max(...adArr, ...donArr, 1);
  const bW = (aW / months.length) * 0.32;
  const textC = dark ? 'rgba(240,232,221,0.5)' : 'rgba(61,43,31,0.45)';
  const gridC = dark ? 'rgba(240,232,221,0.06)' : 'rgba(61,43,31,0.06)';

  ctx.clearRect(0, 0, W, H);

  for (let i = 0; i <= 4; i++) {
    const y = PAD.top + (aH / 4) * i;
    ctx.strokeStyle = gridC; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(PAD.left, y); ctx.lineTo(W - PAD.right, y); ctx.stroke();
    ctx.fillStyle = textC; ctx.font = '10px DM Sans,sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(Math.round(max * (1 - i / 4)), PAD.left - 6, y + 3);
  }

  months.forEach((label, i) => {
    const slotW = aW / months.length;
    const cx = PAD.left + i * slotW + slotW / 2;
    const hA = (adArr[i] / max) * aH;
    ctx.fillStyle = '#e05c2a';
    ctx.beginPath(); ctx.roundRect(cx - bW - 2, PAD.top + aH - hA, bW, hA, [3,3,0,0]); ctx.fill();
    const hD = (donArr[i] / max) * aH;
    ctx.fillStyle = '#4a7c59';
    ctx.beginPath(); ctx.roundRect(cx + 2, PAD.top + aH - hD, bW, hD, [3,3,0,0]); ctx.fill();
    ctx.fillStyle = textC; ctx.font = '10px DM Sans,sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(label, cx, H - PAD.bottom + 14);
  });

  [[  '#e05c2a','Adoções'], ['#4a7c59','Doações']].forEach(([c, l], i) => {
    const x = PAD.left + i * 90, y = H - 8;
    ctx.fillStyle = c; ctx.fillRect(x, y - 8, 10, 10);
    ctx.fillStyle = textC; ctx.font = '10px DM Sans,sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(l, x + 14, y);
  });
}

new MutationObserver(() => {
  const c = document.getElementById('monthlyChart');
  if (c && window._dashStats) drawChart(window._dashStats.monthlyAdoptions, window._dashStats.monthlyDonations);
}).observe(document.documentElement, { attributes:true, attributeFilter:['data-theme'] });

document.addEventListener('DOMContentLoaded', async () => {
  const stats = await loadDashboardData();
  window._dashStats = stats;
  renderDashboard(stats);
});