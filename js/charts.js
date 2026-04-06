/* ===== SVG CHART HELPERS ===== */

function renderScoreRing(containerId, score, max = 100) {
  const pct = score / max;
  const circumference = 2 * Math.PI * 50;
  const offset = circumference * (1 - pct);
  return `
    <div class="score-ring">
      <svg viewBox="0 0 120 120">
        <circle class="ring-bg" cx="60" cy="60" r="50" stroke-dasharray="${circumference}"></circle>
        <circle class="ring-fill" cx="60" cy="60" r="50" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <div class="ring-value">${score}</div>
      <div class="ring-label">/ ${max}점</div>
    </div>`;
}

function renderRadar(categories) {
  const n = categories.length;
  const cx = 100, cy = 100, R = 80;
  const angles = categories.map((_, i) => (2 * Math.PI * i / n) - Math.PI / 2);

  function point(angle, r) {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  // Grid polygons
  let grids = '';
  for (let level = 1; level <= 5; level++) {
    const r = R * level / 5;
    const pts = angles.map(a => point(a, r).join(',')).join(' ');
    grids += `<polygon class="radar-grid" points="${pts}"/>`;
  }

  // Axes
  let axes = angles.map(a => {
    const [x, y] = point(a, R);
    return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
  }).join('');

  // Data polygon
  const dataPts = categories.map((cat, i) => {
    const r = R * (cat.pct / 100);
    return point(angles[i], r).join(',');
  }).join(' ');

  // Data dots
  const dots = categories.map((cat, i) => {
    const r = R * (cat.pct / 100);
    const [x, y] = point(angles[i], r);
    return `<circle class="radar-dot" cx="${x}" cy="${y}" r="4"/>`;
  }).join('');

  // Labels
  const labels = categories.map((cat, i) => {
    const [x, y] = point(angles[i], R + 18);
    const anchor = x < 60 ? 'end' : x > 140 ? 'start' : 'middle';
    return `<text class="radar-label" x="${x}" y="${y}" text-anchor="${anchor}">${cat.name.replace('/정확도','')} ${cat.pct}%</text>`;
  }).join('');

  return `
    <div class="radar-chart">
      <svg viewBox="0 0 200 200">
        ${grids}${axes}
        <polygon class="radar-area" points="${dataPts}"/>
        ${dots}${labels}
      </svg>
    </div>`;
}

function renderMiniGauges(categories) {
  const colors = ['var(--primary)', 'var(--accent)', 'var(--teal)', 'var(--emerald)', 'var(--amber)'];
  const circumference = 2 * Math.PI * 24;
  return `<div class="gauge-meters">${categories.map((cat, i) => {
    const offset = circumference * (1 - cat.pct / 100);
    return `
      <div class="mini-gauge">
        <div class="mini-gauge-ring">
          <svg viewBox="0 0 60 60">
            <circle class="mini-gauge-bg" cx="30" cy="30" r="24" stroke-dasharray="${circumference}"/>
            <circle class="mini-gauge-fill" cx="30" cy="30" r="24" stroke="${colors[i]}" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="mini-gauge-val">${cat.pct}</div>
        </div>
        <div class="mini-gauge-label">${cat.name.replace('/정확도','')}</div>
      </div>`;
  }).join('')}</div>`;
}

function renderBarChart(categories) {
  const colors = ['blue', 'purple', 'teal', 'green', 'amber'];
  return categories.map((cat, i) => `
    <div class="bar-row">
      <div class="bar-label">${cat.name.replace('/정확도','')}</div>
      <div class="bar-track">
        <div class="bar-fill ${colors[i]}" style="width:${cat.pct}%">${cat.pct}%</div>
      </div>
      <div class="bar-value">${cat.score}/${cat.max}</div>
    </div>`).join('');
}

function renderDonut(categories, total) {
  const circumference = 2 * Math.PI * 56;
  const colors = ['var(--primary)', 'var(--accent)', 'var(--teal)', 'var(--emerald)', 'var(--amber)'];
  let accumulated = 0;
  const segments = categories.map((cat, i) => {
    const segLen = circumference * (cat.max / 100);
    const offset = -accumulated;
    accumulated += segLen;
    return `<circle class="donut-seg" cx="70" cy="70" r="56" stroke="${colors[i]}" stroke-dasharray="${segLen} ${circumference - segLen}" stroke-dashoffset="${offset}"/>`;
  }).join('');

  const legend = categories.map((cat, i) => `
    <div class="polar-item">
      <div class="polar-dot" style="background:${colors[i]}"></div>
      <div class="polar-name">${cat.name.replace('/정확도','')}</div>
      <div class="polar-score" style="color:${colors[i]}">${cat.score}</div>
    </div>`).join('');

  return `
    <div class="donut-chart">
      <svg viewBox="0 0 140 140">
        <circle class="donut-bg" cx="70" cy="70" r="56" stroke-dasharray="${circumference}"/>
        ${segments}
      </svg>
      <div class="donut-center">
        <div class="donut-center-value">${total}</div>
        <div class="donut-center-label">총점</div>
      </div>
    </div>
    <div class="polar-grid mt-12">${legend}</div>`;
}

function renderWaterfall(categories, total, max) {
  const lost = max - total;
  return `
    <div class="waterfall">
      <div class="waterfall-bar neutral" style="height:100%"><div class="waterfall-val">${max}</div><div class="waterfall-label">만점</div></div>
      ${categories.map(cat => {
        const loss = cat.max - cat.score;
        const h = Math.max(10, (loss / max) * 300);
        return `<div class="waterfall-bar negative" style="height:${h}%"><div class="waterfall-val">-${loss}</div><div class="waterfall-label">${cat.name.replace('/정확도','')}</div></div>`;
      }).join('')}
      <div class="waterfall-bar positive" style="height:${(total/max)*100}%"><div class="waterfall-val">${total}</div><div class="waterfall-label">최종</div></div>
    </div>`;
}

function renderDotMatrix(score, max) {
  let html = '<div class="dot-matrix">';
  for (let i = 0; i < max; i++) {
    const cls = i < score ? 'dot-earned' : 'dot-lost';
    html += `<div class="dot-cell ${cls}" style="animation-delay:${i * 15}ms"></div>`;
  }
  html += '</div>';
  return html;
}

function renderDistribution(data, myScore) {
  const maxPct = Math.max(...data.map(d => d.pct));
  return `
    <div class="grade-dist">
      ${data.map(d => {
        const h = (d.pct / maxPct) * 100;
        const isMine = myScore >= parseInt(d.range) && myScore <= parseInt(d.range.split('-')[1] || 100);
        const color = isMine ? 'var(--primary)' : d.pct > 30 ? 'var(--emerald)' : d.pct > 15 ? 'var(--amber)' : 'var(--slate-300)';
        return `<div class="grade-col"><div class="grade-bar${isMine ? ' mine' : ''}" style="height:${h}%;background:${color}"></div><div class="grade-lbl">${d.range}</div><div class="grade-pct">${d.pct}%</div></div>`;
      }).join('')}
    </div>`;
}
