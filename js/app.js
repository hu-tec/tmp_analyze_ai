/* ===== APP STATE & NAVIGATION ===== */
let state = { mode: 'exam', exam: 'prompt', plan: 'free', page: 'page1', cbtSource: null };
let currentResult = null; // 실제 채점 결과 (null이면 더미 사용)

function selectMode(el, mode) {
  document.querySelectorAll('[data-mode]').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  state.mode = mode;
}

function goPage(id) {
  // 플랜 게이팅: 채점 전(page3 이전)에는 자유 이동, 결과 페이지는 플랜 체크
  if (id === 'page4' && state.plan === 'free') {
    openPaymentModal('standard', '2단계 확장 리포트', '₩29,000', 'page4');
    return;
  }
  if (id === 'page5' && state.plan !== 'premium') {
    openPaymentModal('premium', '3단계 전문가 첨삭', '₩79,000', 'page5');
    return;
  }

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

      // CBT 결과는 examTitle/score 구조, 레벨테스트는 program/answers 구조
      const isCbt = source === 'cbt_results';
      const name = d.name || '이름 없음';
      const program = isCbt ? (d.examTitle || '미지정') : (d.program || '미지정');
      const date = d.submittedAt?.split('T')[0] || d.date || row.created_at?.split('T')[0] || '';
      const hasEssay = d.essay ? true : false;
      const answerCount = d.answers ? Object.keys(d.answers).length : 0;
      const sourceLabel = isCbt ? 'CBT' : 'LT';

      // CBT 점수 정보
      const scoreInfo = isCbt && d.score != null ? `${d.score}/${d.totalPoints}점` : '';
      const passInfo = isCbt && d.passed != null ? (d.passed ? '합격' : '불합격') : '';
      const passBadge = d.passed ? 'green' : 'rose';

      // 프로그램→배지 색상 (CBT는 시험명 기반)
      const badgeColor = { 'AI프롬프트':'teal','AI번역':'blue','TESOL':'amber','AI윤리':'rose','ITT정통번역':'purple' }[program]
        || (isCbt ? 'indigo' : 'gray');

      // CBT용 답안 텍스트 생성: categoryScores 기반
      const cbtText = isCbt ? buildCbtAnswerText(d) : '';

      const payload = {
        id: row.id, source, name, program, date,
        essay: d.essay || '', answers: d.answers || {},
        answerCount, cbtText,
        score: d.score, totalPoints: d.totalPoints, passed: d.passed,
        categoryScores: d.categoryScores || null
      };

      return `
        <div class="cbt-item" onclick='selectCbtResult(${JSON.stringify(payload).replace(/'/g,"&#39;")})'>
          <div class="cbt-item-header">
            <div class="cbt-item-name">${name}</div>
            <div class="cbt-item-date">${date}</div>
          </div>
          <div class="cbt-item-meta">
            <span class="badge badge-${badgeColor}">${program}</span>
            <span class="badge badge-gray">${sourceLabel}-${String(row.id).padStart(4,'0')}</span>
            ${scoreInfo ? `<span class="text-xs font-bold text-slate-600">${scoreInfo}</span>` : ''}
            ${passInfo ? `<span class="badge badge-${passBadge}">${passInfo}</span>` : ''}
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

function buildCbtAnswerText(d) {
  // CBT 결과를 분석용 텍스트로 변환
  let text = '';
  text += `시험: ${d.examTitle || ''}\n`;
  text += `점수: ${d.score ?? '-'}/${d.totalPoints ?? '-'}점 (${d.percentage ?? '-'}%)\n`;
  text += `합격: ${d.passed ? '합격' : '불합격'}\n`;
  if (d.categoryScores && typeof d.categoryScores === 'object') {
    text += '\n카테고리별 점수:\n';
    if (Array.isArray(d.categoryScores)) {
      d.categoryScores.forEach(cs => {
        text += `  ${cs.category || cs.name || '-'}: ${cs.score ?? cs.earned ?? '-'}/${cs.total ?? cs.max ?? '-'}점\n`;
      });
    } else {
      Object.entries(d.categoryScores).forEach(([k, v]) => {
        text += `  ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}\n`;
      });
    }
  }
  return text;
}

function selectCbtResult(result) {
  // Fill answer input — CBT 결과는 cbtText 사용, 레벨테스트는 essay/answers
  let content = '';
  if (result.cbtText) {
    content = result.cbtText;
  } else {
    if (result.essay) content += result.essay;
    if (result.answers && Object.keys(result.answers).length) {
      if (content) content += '\n\n---\n\n';
      content += '객관식 답안:\n';
      Object.entries(result.answers).forEach(([q, a]) => {
        content += `  ${q}번: ${a}\n`;
      });
    }
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

/* ===== PAYMENT (DUMMY) ===== */
let paymentTarget = null; // 결제 후 이동할 페이지

function openPaymentModal(planId, planName, price, targetPage) {
  paymentTarget = { planId, targetPage };
  const modal = document.getElementById('payment-modal');
  document.getElementById('pay-plan-name').textContent = planName;
  document.getElementById('pay-price').textContent = price;
  document.getElementById('pay-btn').textContent = `${price} 결제하기`;
  document.getElementById('pay-processing').style.display = 'none';
  document.getElementById('pay-form').style.display = 'block';
  document.getElementById('pay-btn').disabled = false;
  modal.style.display = 'flex';
}

function closePaymentModal() {
  document.getElementById('payment-modal').style.display = 'none';
}

function processPayment() {
  const btn = document.getElementById('pay-btn');
  const form = document.getElementById('pay-form');
  const processing = document.getElementById('pay-processing');

  btn.disabled = true;
  btn.textContent = '처리 중...';

  // 1초 후 처리 화면 → 1.5초 후 완료
  setTimeout(() => {
    form.style.display = 'none';
    processing.style.display = 'block';

    setTimeout(() => {
      // 결제 완료 → 플랜 업그레이드
      if (paymentTarget) {
        state.plan = paymentTarget.planId;
        // 페이지2의 tier 카드 선택 상태 업데이트
        const tierIdx = { free: 0, standard: 1, premium: 2 }[state.plan];
        document.querySelectorAll('.tier-card').forEach((c, i) => {
          c.classList.toggle('selected', i === tierIdx);
        });
      }

      closePaymentModal();

      // 목표 페이지로 이동
      if (paymentTarget?.targetPage) {
        goPage(paymentTarget.targetPage);
      }
      paymentTarget = null;
    }, 1500);
  }, 800);
}

/* ===== PDF DOWNLOAD ===== */
function downloadPDF() {
  // 현재 보이는 결과 페이지를 프린트용으로 렌더링
  document.body.classList.add('print-mode');

  // 인쇄할 페이지 결정 (page4가 가장 포괄적)
  const printPage = document.getElementById('page4') || document.getElementById('page3');
  if (printPage) {
    printPage.classList.add('print-target');
  }

  window.print();

  // 프린트 다이얼로그 닫힌 후 복원
  setTimeout(() => {
    document.body.classList.remove('print-mode');
    if (printPage) printPage.classList.remove('print-target');
  }, 500);
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', () => {
  goPage('page1');
});
