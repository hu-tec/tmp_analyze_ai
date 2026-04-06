/* ===== APP STATE & NAVIGATION ===== */
let state = { mode: 'exam', exam: 'prompt', plan: 'free', page: 'page1', cbtSource: null };
let currentResult = null; // 실제 채점 결과 (null이면 더미 사용)

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

  if (id === 'page3') { runScoring(); renderPage3(); }
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
  const r = currentResult || DUMMY_RESULT;
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
  const r = currentResult || DUMMY_RESULT;
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
  const r = currentResult || DUMMY_RESULT;
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

/* ===== SCORING EXECUTION ===== */
function runScoring() {
  const answer = document.getElementById('answerInput')?.value || '';
  const question = document.getElementById('questionInput')?.value || '';

  if (answer.trim().length < 10) {
    // 텍스트가 너무 짧으면 더미 사용
    currentResult = null;
    return;
  }

  // 채점 실행
  currentResult = ScoringEngine.score(state.exam, answer, question);

  // Work Studio에 제출 저장 (비동기, 실패해도 결과 표시에 영향 없음)
  saveSubmission(answer, question);
}

async function saveSubmission(answer, question) {
  try {
    const submission = {
      exam: state.exam,
      examName: EXAMS[state.exam]?.name || state.exam,
      plan: state.plan,
      mode: state.mode,
      question: question,
      answer: answer,
      cbtSource: state.cbtSource || null,
      total: currentResult?.total || null,
      grade: currentResult?.grade || null,
      submittedAt: new Date().toISOString(),
    };

    const res = await fetch(`${API_BASE}/api/scorehub_submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });

    if (res.ok) {
      const { id } = await res.json();
      // 결과도 저장
      if (currentResult) {
        await fetch(`${API_BASE}/api/scorehub_results`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            submissionId: id,
            exam: state.exam,
            total: currentResult.total,
            grade: currentResult.grade,
            categories: currentResult.categories.map(c => ({ name: c.shortName, max: c.max, score: c.score, pct: c.pct })),
            deductions: currentResult.deductions,
            scoredAt: new Date().toISOString(),
          })
        });
      }
    }
  } catch (e) {
    // 저장 실패해도 결과 화면은 정상 동작
    console.warn('저장 실패:', e.message);
  }
}

/* ===== CBT INTEGRATION ===== */
const API_BASE = 'https://bmidcy9z17.execute-api.ap-northeast-2.amazonaws.com';

function openCbtModal() {
  document.getElementById('cbt-modal').style.display = 'flex';
  fetchCbtResults();
}

function closeCbtModal() {
  document.getElementById('cbt-modal').style.display = 'none';
}

async function fetchCbtResults() {
  const source = document.getElementById('cbt-source').value;
  const listEl = document.getElementById('cbt-list');
  const loadingEl = document.getElementById('cbt-loading');
  const emptyEl = document.getElementById('cbt-empty');

  listEl.innerHTML = '';
  loadingEl.style.display = 'block';
  emptyEl.style.display = 'none';

  try {
    const res = await fetch(`${API_BASE}/api/${source}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const rows = await res.json();

    loadingEl.style.display = 'none';

    if (!rows.length) {
      emptyEl.style.display = 'block';
      return;
    }

    // Sort by created_at desc
    rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    listEl.innerHTML = rows.map(row => {
      const d = typeof row.data === 'string' ? JSON.parse(row.data) : row.data;
      const name = d.name || '이름 없음';
      const program = d.program || '미지정';
      const date = d.date || row.created_at?.split('T')[0] || '';
      const hasEssay = d.essay ? '에세이 포함' : '';
      const answerCount = d.answers ? Object.keys(d.answers).length : 0;
      const sourceLabel = source === 'cbt_results' ? 'CBT' : 'LT';
      const badgeColor = { 'AI프롬프트':'teal','AI번역':'blue','TESOL':'amber','AI윤리':'rose','ITT정통번역':'purple' }[program] || 'gray';

      return `
        <div class="cbt-item" onclick='selectCbtResult(${JSON.stringify({id: row.id, source, name, program, date, essay: d.essay || "", answers: d.answers || {}, answerCount}).replace(/'/g,"&#39;")})'>
          <div class="cbt-item-header">
            <div class="cbt-item-name">${name}</div>
            <div class="cbt-item-date">${date}</div>
          </div>
          <div class="cbt-item-meta">
            <span class="badge badge-${badgeColor}">${program}</span>
            <span class="badge badge-gray">${sourceLabel}-${String(row.id).padStart(4,'0')}</span>
            ${answerCount ? `<span class="text-xs text-slate-400">${answerCount}문항</span>` : ''}
            ${hasEssay ? '<span class="text-xs text-slate-400">에세이</span>' : ''}
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    loadingEl.style.display = 'none';
    listEl.innerHTML = `<div class="notice notice-warn">데이터를 불러올 수 없습니다: ${err.message}</div>`;
  }
}

function selectCbtResult(result) {
  // Fill answer input
  let content = '';
  if (result.essay) {
    content += result.essay;
  }
  if (result.answers && Object.keys(result.answers).length) {
    if (content) content += '\n\n---\n\n';
    content += '객관식 답안:\n';
    Object.entries(result.answers).forEach(([q, a]) => {
      content += `  ${q}번: ${a}\n`;
    });
  }

  document.getElementById('answerInput').value = content;
  document.getElementById('charCount').textContent = content.length;

  // Show loaded info
  document.getElementById('cbt-loaded-info').style.display = 'block';
  document.getElementById('cbt-loaded-name').textContent = `${result.name} (${result.program})`;
  state.cbtSource = { source: result.source, id: result.id, name: result.name, program: result.program };

  document.getElementById('cbt-loaded-detail').textContent =
    `${result.source === 'cbt_results' ? 'CBT' : 'LT'}-${String(result.id).padStart(4,'0')} · ${result.date} · ${result.answerCount}문항`;

  // Update exam badge if program matches
  const programMap = { 'AI프롬프트':'prompt','AI번역':'translation','TESOL':'tesol','AI윤리':'ethics','ITT정통번역':'itt' };
  if (programMap[result.program]) {
    state.exam = programMap[result.program];
    const badge = document.getElementById('p2-exam-badge');
    const colors = { prompt:'teal', translation:'blue', tesol:'amber', ethics:'rose', itt:'purple' };
    badge.textContent = result.program;
    badge.className = `badge badge-${colors[state.exam] || 'gray'}`;
  }

  closeCbtModal();
}

function clearCbtLoad() {
  document.getElementById('cbt-loaded-info').style.display = 'none';
  document.getElementById('answerInput').value = DUMMY_ANSWER;
  document.getElementById('charCount').textContent = DUMMY_ANSWER.length;
  state.cbtSource = null;
}

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.style.display = 'none';
  }
});

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  goPage('page1');
});
