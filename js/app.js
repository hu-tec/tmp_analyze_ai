/* ===== APP STATE & NAVIGATION ===== */
let state = { mode: 'exam', exam: 'prompt', plan: 'free', page: 'page1' };

function selectMode(el, mode) {
  document.querySelectorAll('[data-mode]').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.mode = mode;
}

function goPage(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id)?.classList.add('active');
  state.page = id;

  // Update step bar
  const steps = ['page1','page2','page3','page4','page5'];
  const idx = steps.indexOf(id);
  document.querySelectorAll('.step-item').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i === idx) el.classList.add('active');
    else if (i < idx) el.classList.add('done');
  });

  // Update nav
  document.querySelectorAll('.header-nav a').forEach((a, i) => {
    a.classList.toggle('active', i === idx);
  });

  // Render page content
  if (id === 'page3') renderPage3();
  if (id === 'page4') renderPage4();
  if (id === 'page5') renderPage5();

  window.scrollTo(0, 0);
}

function selectExam(el, exam) {
  document.querySelectorAll('.exam-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.exam = exam;
}

function selectTier(el, tier) {
  document.querySelectorAll('.tier-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.plan = ['free','standard','premium'][tier - 1];
}

function toggleAccordion(btn) {
  btn.closest('.accordion').classList.toggle('open');
}

/* ===== PAGE 3: 1단계 기본 분석 ===== */
function renderPage3() {
  const r = DUMMY_RESULT;
  const cats = r.categories;

  // COL1
  document.getElementById('p3-score-ring').innerHTML = renderScoreRing('', r.total);
  document.getElementById('p3-radar').innerHTML = renderRadar(cats);
  document.getElementById('p3-gauges').innerHTML = renderMiniGauges(cats);

  // COL2
  document.getElementById('p3-cat-table').innerHTML = `
    <table class="tbl">
      <thead><tr><th>대분류</th><th>배점</th><th>획득</th><th>달성</th><th>상태</th></tr></thead>
      <tbody>${cats.map(c => `
        <tr>
          <td>${c.name}</td><td>${c.max}</td>
          <td class="score-cell">${c.score}</td>
          <td><span class="heat-cell ${c.pct >= 80 ? 'heat-high' : c.pct >= 60 ? 'heat-mid' : 'heat-low'}">${c.pct}%</span></td>
          <td><span class="badge ${c.pct >= 80 ? 'badge-green' : 'badge-amber'}">${c.status}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  document.getElementById('p3-bar-chart').innerHTML = renderBarChart(cats);
  document.getElementById('p3-donut').innerHTML = renderDonut(cats, r.total);

  // COL3 - 감점 랭킹 Top3
  document.getElementById('p3-deductions').innerHTML = r.deductions.slice(0, 3).map((d, i) => {
    const cls = ['gold','silver','bronze'][i];
    const numCls = ['rank-1','rank-2','rank-3'][i];
    return `
      <div class="rank-bar-row">
        <div class="rank-num ${numCls}">${d.rank}</div>
        <div class="rank-label">${d.name}</div>
        <div class="rank-bar-track"><div class="rank-bar-fill ${cls}" style="width:${Math.abs(d.points) / 3 * 100}%">${d.points}점</div></div>
      </div>`;
  }).join('');

  // COL4
  document.getElementById('p3-improvements').innerHTML = `
    <table class="tbl tbl-compact">
      <thead><tr><th>#</th><th>항목</th><th>기대 상승</th></tr></thead>
      <tbody>${r.improvements.map((imp, i) => `
        <tr><td>${i + 1}</td><td class="font-bold">${imp.name}</td><td class="text-emerald font-bold">${imp.gain}</td></tr>`).join('')}
      </tbody>
    </table>`;

  const sr = r.strengthRatio;
  document.getElementById('p3-strength').innerHTML = `
    <div class="stacked-bar">
      <div class="stacked-seg" style="width:${sr.strong}%;background:var(--emerald)">강점 ${sr.strong}%</div>
      <div class="stacked-seg" style="width:${sr.normal}%;background:var(--amber)">보통 ${sr.normal}%</div>
      <div class="stacked-seg" style="width:${sr.weak}%;background:var(--rose)">약점 ${sr.weak}%</div>
    </div>`;
}

/* ===== PAGE 4: 2단계 확장 리포트 ===== */
function renderPage4() {
  const r = DUMMY_RESULT;
  const cats = r.categories;

  // COL1
  document.getElementById('p4-score-ring').innerHTML = renderScoreRing('', r.total);
  document.getElementById('p4-bars').innerHTML = renderBarChart(cats);
  document.getElementById('p4-deductions-all').innerHTML = r.deductions.map((d, i) => {
    const cls = i < 3 ? ['gold','silver','bronze'][i] : '';
    const numCls = i < 3 ? ['rank-1','rank-2','rank-3'][i] : 'rank-other';
    return `
      <div class="rank-bar-row">
        <div class="rank-num ${numCls}">${d.rank}</div>
        <div class="rank-label">${d.name}</div>
        <div class="rank-bar-track"><div class="rank-bar-fill ${cls || ''}" style="width:${Math.abs(d.points) / 3 * 100}%;${cls ? '' : 'background:var(--slate-400)'}">${d.points}점</div></div>
      </div>`;
  }).join('');

  // COL2 - 세부 채점 전체 + Heatmap
  document.getElementById('p4-detail-tables').innerHTML = cats.map(cat => `
    <div class="accordion open">
      <button class="accordion-trigger" onclick="toggleAccordion(this)">${cat.name} 세부 <span class="accordion-arrow">▼</span></button>
      <div class="accordion-body">
        <table class="tbl tbl-compact">
          <thead><tr><th>항목</th><th>배점</th><th>획득</th><th>코멘트</th></tr></thead>
          <tbody>${cat.items.map(item => `
            <tr><td>${item.name}</td><td>${item.max}</td><td class="score-cell">${item.score}</td><td class="text-xs text-slate-500">${item.comment}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`).join('');

  document.getElementById('p4-waterfall').innerHTML = renderWaterfall(cats, r.total, r.maxScore);

  // COL3 - 전문 코멘트
  document.getElementById('p4-comments').innerHTML = r.expertComments.map(c => `
    <div style="margin-bottom:12px;">
      <div class="font-bold text-sm" style="margin-bottom:4px;">${c.category}</div>
      <div class="text-xs text-slate-600" style="line-height:1.6;">${c.text}</div>
    </div>`).join('');

  document.getElementById('p4-distribution').innerHTML = renderDistribution(r.distribution, r.total);
  document.getElementById('p4-dot-matrix').innerHTML = renderDotMatrix(r.total, r.maxScore);

  // COL4 - PDF 미리보기 + 업그레이드
}

/* ===== PAGE 5: 3단계 전문가 첨삭 ===== */
function renderPage5() {
  const r = DUMMY_RESULT;
  const rv = r.expertReview;

  // COL1 - 전문가 프로필
  document.getElementById('p5-reviewer').innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:48px;margin-bottom:8px;">${rv.reviewer.photo}</div>
      <div class="font-bold text-lg">${rv.reviewer.name}</div>
      <div class="text-xs text-slate-500">${rv.reviewer.title}</div>
      <div class="text-xs text-slate-400 mt-4">경력 ${rv.reviewer.career} · ⭐ ${rv.reviewer.rating} · 리뷰 ${rv.reviewer.reviews}건</div>
    </div>`;

  document.getElementById('p5-roadmap').innerHTML = rv.roadmap.map(s => `
    <div style="display:flex;gap:10px;margin-bottom:10px;align-items:flex-start;">
      <div style="width:24px;height:24px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${s.step}</div>
      <div>
        <div class="font-bold text-sm">${s.action}</div>
        <div class="text-xs text-slate-500">${s.desc}</div>
        <div class="text-xs text-emerald font-bold mt-4">${s.expected}</div>
      </div>
    </div>`).join('');

  // COL2 - 첨삭 내용
  document.getElementById('p5-annotations').innerHTML = rv.annotations.map(a => {
    const borderColor = a.type === 'good' ? 'var(--emerald)' : a.type === 'warn' ? 'var(--amber)' : 'var(--rose)';
    const bgColor = a.type === 'good' ? '#f0fdf4' : a.type === 'warn' ? '#fffbeb' : '#fff1f2';
    return `
      <div style="border-left:3px solid ${borderColor};background:${bgColor};padding:10px 12px;border-radius:0 6px 6px 0;margin-bottom:8px;">
        <div style="font-family:monospace;font-size:11px;color:var(--slate-700);margin-bottom:6px;">${a.line}</div>
        <div class="text-xs" style="color:var(--slate-600);">${a.comment}</div>
      </div>`;
  }).join('');

  document.getElementById('p5-summary').innerHTML = `
    <div class="notice notice-info">${rv.summary}</div>`;

  // COL3 - 전문가 매칭
  document.getElementById('p5-experts').innerHTML = r.experts.map(e => `
    <div class="card" style="margin-bottom:10px;">
      <div class="d-flex items-center gap-12">
        <div style="font-size:32px;">${e.photo}</div>
        <div style="flex:1;">
          <div class="font-bold text-sm">${e.name}</div>
          <div class="text-xs text-slate-500">${e.title}</div>
          <div class="text-xs text-slate-400 mt-4">⭐ ${e.rating} · ${e.specialty}</div>
        </div>
        <div style="text-align:right;">
          <div class="badge badge-blue">${e.match}% 매칭</div>
          <div class="text-xs font-bold mt-4">${e.price}</div>
        </div>
      </div>
    </div>`).join('');
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  goPage('page1');
});
