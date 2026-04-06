/* ===== SVG CHART HELPERS ===== */

const COLORS = ['#4f46e5','#7c3aed','#0d9488','#059669','#d97706'];
const GRADIENTS = [
  ['#4f46e5','#6366f1'],['#7c3aed','#8b5cf6'],['#0d9488','#14b8a6'],
  ['#059669','#10b981'],['#d97706','#f59e0b']
];

function renderScoreRing(containerId, score, max = 100) {
  const pct = score / max;
  const C = 2 * Math.PI * 48;
  const offset = C * (1 - pct);
  const grade = score >= 90 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : score >= 60 ? 'C' : 'D';
  const rank = score >= 90 ? '상위 5%' : score >= 80 ? '상위 20%' : score >= 70 ? '상위 32%' : '상위 50%';
  return `
    <div class="score-ring-wrap">
      <div class="score-ring">
        <svg viewBox="0 0 110 110">
          <defs><linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#4f46e5"/><stop offset="100%" stop-color="#818cf8"/>
          </linearGradient></defs>
          <circle class="ring-bg" cx="55" cy="55" r="48" stroke-dasharray="${C}"></circle>
          <circle class="ring-fill" cx="55" cy="55" r="48" stroke-dasharray="${C}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <div class="ring-value">${score}</div>
        <div class="ring-label">/ ${max}점</div>
      </div>
      <div class="grade-badge">${grade} · ${rank}</div>
    </div>`;
}

function renderRadar(categories) {
  const n = categories.length;
  const cx = 100, cy = 100, R = 75;
  const angles = categories.map((_, i) => (2 * Math.PI * i / n) - Math.PI / 2);
  const pt = (a, r) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

  let grids = '';
  for (let lv = 1; lv <= 5; lv++) {
    const r = R * lv / 5;
    grids += `<polygon class="radar-grid" points="${angles.map(a => pt(a, r).join(',')).join(' ')}"/>`;
  }
  const axes = angles.map(a => `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${pt(a, R)[0]}" y2="${pt(a, R)[1]}"/>`).join('');
  const dataPts = categories.map((c, i) => pt(angles[i], R * c.pct / 100).join(',')).join(' ');
  const dots = categories.map((c, i) => {
    const [x, y] = pt(angles[i], R * c.pct / 100);
    return `<circle class="radar-dot" cx="${x}" cy="${y}" r="3.5"/>`;
  }).join('');
  const labels = categories.map((c, i) => {
    const [x, y] = pt(angles[i], R + 16);
    const anc = x < 50 ? 'end' : x > 150 ? 'start' : 'middle';
    return `<text class="radar-label" x="${x}" y="${y}" text-anchor="${anc}">${c.shortName || c.name} ${c.pct}%</text>`;
  }).join('');

  return `<div class="radar-chart"><svg viewBox="0 0 200 200">${grids}${axes}<polygon class="radar-area" points="${dataPts}"/>${dots}${labels}</svg></div>`;
}

function renderMiniGauges(categories) {
  const C = 2 * Math.PI * 20;
  return `<div class="gauge-meters">${categories.map((cat, i) => {
    const offset = C * (1 - cat.pct / 100);
    return `<div class="mini-gauge"><div class="mini-gauge-ring"><svg viewBox="0 0 50 50"><circle class="mini-gauge-bg" cx="25" cy="25" r="20" stroke-dasharray="${C}"/><circle class="mini-gauge-fill" cx="25" cy="25" r="20" stroke="${COLORS[i]}" stroke-dasharray="${C}" stroke-dashoffset="${offset}"/></svg><div class="mini-gauge-val">${cat.pct}</div></div><div class="mini-gauge-label">${cat.shortName || cat.name}</div></div>`;
  }).join('')}</div>`;
}

function renderBarChart(categories) {
  return categories.map((cat, i) => `
    <div class="bar-row">
      <div class="bar-label">${cat.shortName || cat.name}</div>
      <div class="bar-track"><div class="bar-fill c${i}" style="width:${cat.pct}%">${cat.pct}%</div></div>
      <div class="bar-value">${cat.score}/${cat.max}</div>
    </div>`).join('');
}

function renderDonut(categories, total) {
  const C = 2 * Math.PI * 52;
  let acc = 0;
  const segs = categories.map((cat, i) => {
    const len = C * (cat.max / 100);
    const off = -acc; acc += len;
    return `<circle class="donut-seg" cx="65" cy="65" r="52" stroke="${COLORS[i]}" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${off}"/>`;
  }).join('');
  const legend = categories.map((cat, i) => `
    <div class="polar-item"><div class="polar-dot" style="background:${COLORS[i]}"></div><div class="polar-name">${cat.shortName || cat.name}</div><div class="polar-score" style="color:${COLORS[i]}">${cat.score}</div></div>`).join('');
  return `<div class="donut-chart"><svg viewBox="0 0 130 130"><circle class="donut-bg" cx="65" cy="65" r="52" stroke-dasharray="${C}"/>${segs}</svg><div class="donut-center"><div class="donut-center-value">${total}</div><div class="donut-center-label">총점</div></div></div><div class="polar-grid mt-8">${legend}</div>`;
}

function renderWaterfall(categories, total, max) {
  return `<div class="waterfall">
    <div class="waterfall-bar neutral" style="height:100%"><div class="waterfall-val">${max}</div><div class="waterfall-label">만점</div></div>
    ${categories.map(c => {
      const loss = c.max - c.score;
      const h = Math.max(8, (loss / max) * 280);
      return `<div class="waterfall-bar negative" style="height:${h}%"><div class="waterfall-val">-${loss}</div><div class="waterfall-label">${c.shortName || c.name}</div></div>`;
    }).join('')}
    <div class="waterfall-bar positive" style="height:${(total/max)*100}%"><div class="waterfall-val">${total}</div><div class="waterfall-label">최종</div></div>
  </div>`;
}

function renderDotMatrix(score, max) {
  let html = '<div class="dot-matrix">';
  for (let i = 0; i < max; i++) {
    html += `<div class="dot-cell ${i < score ? 'dot-earned' : 'dot-lost'}" style="animation-delay:${i * 12}ms"></div>`;
  }
  return html + '</div>';
}

function renderDistribution(data, myScore) {
  const mx = Math.max(...data.map(d => d.pct));
  return `<div class="grade-dist">${data.map(d => {
    const h = (d.pct / mx) * 100;
    const mine = myScore >= parseInt(d.range) && myScore <= parseInt(d.range.split('-')[1] || 100);
    const color = mine ? 'var(--primary)' : d.pct > 30 ? 'var(--emerald)' : d.pct > 15 ? 'var(--amber)' : 'var(--slate-300)';
    return `<div class="grade-col"><div class="grade-bar${mine ? ' mine' : ''}" style="height:${h}%;background:${color}"></div><div class="grade-lbl">${d.range}</div><div class="grade-pct">${d.pct}%</div></div>`;
  }).join('')}</div>`;
}

function renderRankBars(deductions, limit) {
  const items = limit ? deductions.slice(0, limit) : deductions;
  return items.map((d, i) => {
    const cls = i < 3 ? ['gold','silver','bronze'][i] : '';
    const numCls = i < 3 ? ['rank-1','rank-2','rank-3'][i] : 'rank-other';
    return `<div class="rank-bar-row"><div class="rank-num ${numCls}">${d.rank}</div><div class="rank-label">${d.name}</div><div class="rank-bar-track"><div class="rank-bar-fill ${cls}" style="width:${Math.abs(d.points) / 3 * 100}%;${cls ? '' : 'background:var(--slate-400)'}">${d.points}점</div></div></div>`;
  }).join('');
}

function renderStackedBar(data) {
  return `<div class="stacked-bar">
    <div class="stacked-seg" style="width:${data.strong}%;background:var(--emerald)">강점 ${data.strong}%</div>
    <div class="stacked-seg" style="width:${data.normal}%;background:var(--amber)">보통 ${data.normal}%</div>
    <div class="stacked-seg" style="width:${data.weak}%;background:var(--rose)">약점 ${data.weak}%</div>
  </div>`;
}
