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

  const steps = ['page1','page2','page3','page4','page5'];
  const idx = steps.indexOf(id);
  document.querySelectorAll('.step-item').forEach((el, i) => {
    el.classList.remove('active', 'done');
    if (i === idx) el.classList.add('active');
    else if (i < idx) el.classList.add('done');
  });
  document.querySelectorAll('.header-nav a').forEach((a, i) => {
    a.classList.toggle('active', i === idx);
  });

  if (id === 'page3') renderPage3();
  if (id === 'page4') renderPage4();
  if (id === 'page5') renderPage5();
  window.scrollTo(0, 0);
}

function selectExam(el, exam) {
  el.closest('.exam-card')?.classList.add('selected');
  document.querySelectorAll('.exam-list .exam-card').forEach(c => c.classList.remove('selected'));
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

  // COL1: Score + Radar + Gauges
  document.getElementById('p3-score-ring').innerHTML = renderScoreRing('', r.total);
  document.getElementById('p3-radar').innerHTML = renderRadar(cats);
  document.getElementById('p3-gauges').innerHTML = renderMiniGauges(cats);

  // COL2: Category table + bar chart + donut
  document.getElementById('p3-cat-table').innerHTML = `
    <table class="tbl tbl-compact">
      <thead><tr><th>영역</th><th>배점</th><th>획득</th><th>달성</th><th>상태</th></tr></thead>
      <tbody>${cats.map(c => `
        <tr>
          <td class="font-bold">${c.shortName}</td><td>${c.max}</td>
          <td class="score-cell">${c.score}</td>
          <td><span class="heat-cell ${c.pct >= 80 ? 'heat-high' : c.pct >= 60 ? 'heat-mid' : 'heat-low'}">${c.pct}%</span></td>
          <td><span class="badge badge-${c.pct >= 80 ? 'green' : c.pct >= 60 ? 'amber' : 'rose'}">${c.status}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  document.getElementById('p3-bar-chart').innerHTML = renderBarChart(cats);
  document.getElementById('p3-donut').innerHTML = renderDonut(cats, r.total);

  // COL3: Deduction Top 3
  document.getElementById('p3-deductions').innerHTML = renderRankBars(r.deductions, 3);

  // COL4: Improvements + Strength
  document.getElementById('p3-improvements').innerHTML = r.improvements.map((imp, i) => `
    <div class="d-flex items-center gap-8 mb-8">
      <div class="rank-num rank-${i + 1}" style="width:20px;height:20px;font-size:10px;">${i + 1}</div>
      <div class="flex-1">
        <div class="font-bold text-sm">${imp.name}</div>
        <div class="text-xs text-slate-400">${imp.desc}</div>
      </div>
      <div class="text-emerald font-bold text-sm">${imp.gain}</div>
    </div>`).join('');

  document.getElementById('p3-strength').innerHTML = renderStackedBar(r.strengthRatio);

  // Exam info
  document.getElementById('p3-exam-info').innerHTML = `
    <div class="info-row"><span class="info-key">시험</span><span class="info-val">${EXAMS[r.exam].name}</span></div>
    <div class="info-row"><span class="info-key">응시일</span><span class="info-val">${r.date}</span></div>
    <div class="info-row"><span class="info-key">문항</span><span class="info-val">${r.questionType}</span></div>
    <div class="info-row"><span class="info-key">엔진</span><span class="info-val">${r.engine}</span></div>
    <div class="info-row"><span class="info-key">소요</span><span class="info-val">${r.duration}</span></div>`;
}

/* ===== PAGE 4: 2단계 확장 리포트 ===== */
function renderPage4() {
  const r = DUMMY_RESULT;
  const cats = r.categories;

  // COL1
  document.getElementById('p4-score-ring').innerHTML = renderScoreRing('', r.total);
  document.getElementById('p4-bars').innerHTML = renderBarChart(cats);
  document.getElementById('p4-deductions-all').innerHTML = renderRankBars(r.deductions);

  // COL2: Detail tables + waterfall
  document.getElementById('p4-detail-tables').innerHTML = cats.map(cat => `
    <div class="accordion open">
      <button class="accordion-trigger" onclick="toggleAccordion(this)">
        <span>${cat.shortName} <span class="badge badge-${cat.pct >= 80 ? 'green' : 'amber'}" style="margin-left:4px;">${cat.score}/${cat.max}</span></span>
        <span class="accordion-arrow">▼</span>
      </button>
      <div class="accordion-body">
        <table class="tbl tbl-compact tbl-striped">
          <thead><tr><th>항목</th><th>배점</th><th>획득</th><th>코멘트</th></tr></thead>
          <tbody>${cat.items.map(item => `
            <tr>
              <td class="font-bold">${item.name}</td>
              <td>${item.max}</td>
              <td class="score-cell">${item.score}</td>
              <td class="text-xs text-slate-500">${item.comment}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>`).join('');

  document.getElementById('p4-waterfall').innerHTML = renderWaterfall(cats, r.total, r.maxScore);

  // COL3: Comments + Distribution + Dot matrix
  document.getElementById('p4-comments').innerHTML = r.expertComments.map(c => `
    <div class="comment-block">
      <div class="comment-cat"><span class="status-dot ${c.category === '보안' ? 'red' : c.category === '적절성' ? 'amber' : 'green'}"></span> ${c.category}</div>
      <div class="comment-text">${c.text}</div>
    </div>`).join('');

  document.getElementById('p4-distribution').innerHTML = renderDistribution(r.distribution, r.total);
  document.getElementById('p4-dot-matrix').innerHTML = renderDotMatrix(r.total, r.maxScore);
}

/* ===== PAGE 5: 3단계 전문가 첨삭 ===== */
function renderPage5() {
  const r = DUMMY_RESULT;
  const rv = r.expertReview;

  // COL1: Reviewer profile
  document.getElementById('p5-reviewer').innerHTML = `
    <div style="text-align:center;">
      <div style="font-size:44px;margin-bottom:6px;">${rv.reviewer.photo}</div>
      <div class="font-bold" style="font-size:15px;">${rv.reviewer.name}</div>
      <div class="text-xs text-slate-500">${rv.reviewer.title}</div>
      <div class="d-flex justify-between mt-10" style="padding:0 8px;">
        <div class="text-center"><div class="text-xs text-slate-400">경력</div><div class="font-bold text-sm">${rv.reviewer.career}</div></div>
        <div class="text-center"><div class="text-xs text-slate-400">평점</div><div class="font-bold text-sm">⭐ ${rv.reviewer.rating}</div></div>
        <div class="text-center"><div class="text-xs text-slate-400">리뷰</div><div class="font-bold text-sm">${rv.reviewer.reviews}건</div></div>
      </div>
    </div>`;

  // Summary
  document.getElementById('p5-summary').innerHTML = `
    <div class="notice notice-info">${rv.summary}</div>
    <div class="d-flex gap-8 mt-10">
      <div class="text-center flex-1" style="padding:8px;background:var(--slate-50);border-radius:var(--radius-sm);">
        <div class="text-xs text-slate-400">수정 사항</div>
        <div class="font-bold text-primary">${rv.annotations.filter(a => a.type !== 'good').length}건</div>
      </div>
      <div class="text-center flex-1" style="padding:8px;background:#f0fdf4;border-radius:var(--radius-sm);">
        <div class="text-xs text-slate-400">우수 항목</div>
        <div class="font-bold text-emerald">${rv.annotations.filter(a => a.type === 'good').length}건</div>
      </div>
    </div>`;

  // Roadmap
  document.getElementById('p5-roadmap').innerHTML = rv.roadmap.map(s => `
    <div class="roadmap-step">
      <div class="roadmap-num">${s.step}</div>
      <div class="roadmap-content">
        <div class="roadmap-action">${s.action}</div>
        <div class="roadmap-desc">${s.desc}</div>
        <div class="roadmap-gain">${s.expected}</div>
      </div>
    </div>`).join('');

  // COL2: Annotations
  document.getElementById('p5-annotations').innerHTML = rv.annotations.map(a => `
    <div class="annotation-item annotation-${a.type}">
      <div class="annotation-line">${a.line}</div>
      <div class="annotation-comment">${a.comment}</div>
    </div>`).join('');

  // COL4: Experts
  document.getElementById('p5-experts').innerHTML = r.experts.map(e => `
    <div class="expert-card">
      <div class="d-flex items-center gap-8">
        <div class="expert-avatar">${e.photo}</div>
        <div class="expert-info">
          <div class="font-bold text-sm">${e.name}</div>
          <div class="text-xs text-slate-400">${e.title}</div>
          <div class="expert-meta">
            <span class="text-xs text-slate-500">⭐ ${e.rating}</span>
            <span class="badge badge-indigo">${e.match}%</span>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="font-bold text-sm text-primary">${e.price}</div>
          <div class="text-xs text-slate-400">${e.reviews}건 리뷰</div>
        </div>
      </div>
    </div>`).join('');
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  goPage('page1');
});
