/* ===== CLIENT-SIDE SCORING ENGINE ===== */
/* 규칙 기반 채점 — 추후 AI API(Claude/GPT)로 교체 가능 */

const ScoringEngine = {

  // 종목별 채점 기준
  rubrics: {
    prompt: {
      name: 'AI프롬프트',
      categories: [
        { name: '정보성/정확도', shortName: '정보성', max: 30, items: [
          { name: '사실 정확성', max: 10, keywords: ['사실','데이터','수치','통계','근거','연구','보고서'] },
          { name: '출처 신뢰성', max: 10, keywords: ['출처','참고','인용','논문','IPCC','WHO','공식'] },
          { name: '개방성', max: 10, keywords: ['확장','추가','발전','응용','활용','다양'] },
        ]},
        { name: '적절성', shortName: '적절성', max: 30, items: [
          { name: '맥락 부합도', max: 10, keywords: ['맥락','상황','배경','조건','환경','컨텍스트'] },
          { name: '대상 적합성', max: 10, keywords: ['대상','수준','청중','독자','학생','전문가','초보'] },
          { name: '목적 정렬', max: 10, keywords: ['목적','목표','의도','결과','달성','기대'] },
        ]},
        { name: '효율성', shortName: '효율성', max: 20, items: [
          { name: '간결성', max: 10, keywords: ['간결','명확','핵심','요약','직접'] },
          { name: '반복 제거', max: 10, negKeywords: ['반복'] }, // 반복이 많으면 감점
        ]},
        { name: '윤리', shortName: '윤리', max: 10, items: [
          { name: '편향 방지', max: 5, keywords: ['편향','공정','균형','중립','객관'] },
          { name: '공정성', max: 5, keywords: ['공정','다양성','포용','차별'] },
        ]},
        { name: '보안', shortName: '보안', max: 10, items: [
          { name: '개인정보', max: 5, keywords: ['개인정보','보호','프라이버시','익명','민감'] },
          { name: '주입 방지', max: 5, keywords: ['주입','보안','방지','거부','무시','제한','필터'] },
        ]},
      ]
    },
    translation: {
      name: 'AI번역',
      categories: [
        { name: '정확성', shortName: '정확성', max: 35, items: [
          { name: '의미 전달', max: 12, keywords: ['의미','원문','정확','전달','내용'] },
          { name: '용어 정확성', max: 12, keywords: ['용어','전문','술어','표현','단어'] },
          { name: '문법 정확성', max: 11, keywords: ['문법','구문','어순','시제','수일치'] },
        ]},
        { name: '유창성', shortName: '유창성', max: 30, items: [
          { name: '자연스러움', max: 15, keywords: ['자연','매끄럽','읽기','흐름','문체'] },
          { name: '문체 일관성', max: 15, keywords: ['일관','톤','스타일','격식','비격식'] },
        ]},
        { name: '맥락 적합성', shortName: '맥락', max: 20, items: [
          { name: '문화 적합성', max: 10, keywords: ['문화','현지화','관용','맥락','배경'] },
          { name: '레지스터', max: 10, keywords: ['격식','비격식','공식','일상','전문'] },
        ]},
        { name: '완성도', shortName: '완성도', max: 10, items: [
          { name: '누락 검사', max: 5, keywords: ['누락','빠진','생략','전체'] },
          { name: '형식 준수', max: 5, keywords: ['형식','포맷','구조','단락'] },
        ]},
        { name: '부가가치', shortName: '부가', max: 5, items: [
          { name: '창의적 표현', max: 5, keywords: ['창의','개선','제안','대안'] },
        ]},
      ]
    },
    tesol: {
      name: 'TESOL',
      categories: [
        { name: '수업 설계', shortName: '수업설계', max: 30, items: [
          { name: '학습 목표', max: 10, keywords: ['목표','학습','도달','성취','기대'] },
          { name: '활동 구성', max: 10, keywords: ['활동','과제','연습','실습','게임'] },
          { name: '시간 배분', max: 10, keywords: ['시간','분','배분','단계','순서'] },
        ]},
        { name: '평가 도구', shortName: '평가', max: 25, items: [
          { name: '평가 방법', max: 13, keywords: ['평가','시험','퀴즈','루브릭','채점'] },
          { name: '피드백', max: 12, keywords: ['피드백','코멘트','수정','개선','보완'] },
        ]},
        { name: '학습자 상호작용', shortName: '상호작용', max: 25, items: [
          { name: '참여 유도', max: 13, keywords: ['참여','동기','흥미','관심','질문'] },
          { name: '차별화 전략', max: 12, keywords: ['수준','차별','개별','맞춤','다양'] },
        ]},
        { name: '자료 활용', shortName: '자료', max: 10, items: [
          { name: '교재/매체', max: 10, keywords: ['교재','영상','자료','매체','PPT','워크시트'] },
        ]},
        { name: '전문성', shortName: '전문성', max: 10, items: [
          { name: '교수 이론', max: 10, keywords: ['이론','CLT','PPP','TBL','방법론','접근'] },
        ]},
      ]
    },
    ethics: {
      name: 'AI윤리',
      categories: [
        { name: '편향성', shortName: '편향성', max: 25, items: [
          { name: '데이터 편향', max: 13, keywords: ['데이터','편향','편중','대표성','샘플'] },
          { name: '알고리즘 공정성', max: 12, keywords: ['공정','알고리즘','차별','평등'] },
        ]},
        { name: '투명성', shortName: '투명성', max: 25, items: [
          { name: '설명 가능성', max: 13, keywords: ['설명','이해','해석','블랙박스','투명'] },
          { name: '정보 공개', max: 12, keywords: ['공개','고지','알림','동의','정보'] },
        ]},
        { name: '책임성', shortName: '책임성', max: 25, items: [
          { name: '책임 소재', max: 13, keywords: ['책임','귀속','관리','감독','거버넌스'] },
          { name: '피해 구제', max: 12, keywords: ['구제','보상','피해','복구','대응'] },
        ]},
        { name: '프라이버시', shortName: '프라이버시', max: 15, items: [
          { name: '개인정보 보호', max: 8, keywords: ['개인정보','프라이버시','보호','수집','처리'] },
          { name: '데이터 최소화', max: 7, keywords: ['최소','필요','목적','제한','삭제'] },
        ]},
        { name: '사회적 영향', shortName: '사회적', max: 10, items: [
          { name: '사회적 가치', max: 10, keywords: ['사회','가치','영향','윤리','지속가능'] },
        ]},
      ]
    },
    itt: {
      name: 'ITT정통번역',
      categories: [
        { name: '의미 전달', shortName: '의미전달', max: 30, items: [
          { name: '원문 충실도', max: 15, keywords: ['원문','충실','의미','내용','전달'] },
          { name: '뉘앙스 전달', max: 15, keywords: ['뉘앙스','톤','감정','어조','뉘앙스'] },
        ]},
        { name: '표현력', shortName: '표현력', max: 25, items: [
          { name: '도착어 유창성', max: 13, keywords: ['유창','자연','매끄럽','읽기'] },
          { name: '문체 적합성', max: 12, keywords: ['문체','스타일','격식','장르'] },
        ]},
        { name: '전문성', shortName: '전문성', max: 20, items: [
          { name: '전문 용어', max: 10, keywords: ['용어','전문','술어','분야'] },
          { name: '배경 지식', max: 10, keywords: ['배경','지식','이해','분야','도메인'] },
        ]},
        { name: '완성도', shortName: '완성도', max: 15, items: [
          { name: '교정/편집', max: 8, keywords: ['교정','편집','오류','수정','검토'] },
          { name: '일관성', max: 7, keywords: ['일관','통일','용어','표현'] },
        ]},
        { name: '속도/효율', shortName: '속도', max: 10, items: [
          { name: '시간 효율', max: 10, keywords: ['시간','효율','속도','신속'] },
        ]},
      ]
    },
  },

  // 텍스트 분석 → 점수 생성
  score(examType, answerText, questionText) {
    const rubric = this.rubrics[examType];
    if (!rubric) return null;

    const text = (answerText || '').toLowerCase();
    const textLen = text.length;
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const sentences = text.split(/[.!?。]\s*/).filter(s => s.length > 2);
    const sentenceCount = sentences.length;

    // 기본 점수 계산: 텍스트 길이 기반 베이스 + 키워드 매칭 보너스
    const baseFactor = Math.min(1, textLen / 300); // 300자 이상이면 기본 충족

    const categories = rubric.categories.map(cat => {
      const items = cat.items.map(item => {
        let score = Math.round(item.max * baseFactor * (0.5 + Math.random() * 0.2));

        // 키워드 매칭 보너스
        if (item.keywords) {
          const matched = item.keywords.filter(kw => text.includes(kw)).length;
          const matchRatio = matched / item.keywords.length;
          score = Math.round(item.max * (baseFactor * 0.4 + matchRatio * 0.5 + Math.random() * 0.1));
        }

        // 네거티브 키워드 (반복 등)
        if (item.negKeywords) {
          const found = item.negKeywords.filter(kw => {
            const regex = new RegExp(kw, 'g');
            return (text.match(regex) || []).length > 2;
          }).length;
          if (found > 0) score = Math.max(1, score - 2);
        }

        score = Math.min(item.max, Math.max(1, score));

        const comment = this._genComment(item.name, score, item.max);
        return { name: item.name, max: item.max, score, comment };
      });

      const catScore = items.reduce((s, i) => s + i.score, 0);
      const pct = Math.round(catScore / cat.max * 100);
      const status = pct >= 80 ? '우수' : pct >= 60 ? '보통' : '미흡';

      return {
        name: cat.name,
        shortName: cat.shortName,
        max: cat.max,
        score: catScore,
        pct,
        status,
        color: cat.color,
        items
      };
    });

    const total = categories.reduce((s, c) => s + c.score, 0);
    const maxScore = categories.reduce((s, c) => s + c.max, 0);
    const grade = total >= 90 ? 'A' : total >= 85 ? 'A-' : total >= 80 ? 'B+' : total >= 75 ? 'B' : total >= 70 ? 'B-' : total >= 65 ? 'C+' : total >= 60 ? 'C' : 'D';
    const rankPct = total >= 90 ? 5 : total >= 85 ? 10 : total >= 80 ? 20 : total >= 75 ? 32 : total >= 70 ? 45 : 60;

    // 감점 요인 생성
    const allItems = [];
    categories.forEach(cat => {
      cat.items.forEach(item => {
        allItems.push({ name: item.name, category: cat.shortName, lost: item.max - item.score });
      });
    });
    allItems.sort((a, b) => b.lost - a.lost);
    const deductions = allItems.filter(i => i.lost > 0).slice(0, 5).map((d, i) => ({
      rank: i + 1, name: d.name, points: -d.lost, category: d.category
    }));

    // 개선 우선순위
    const improvements = deductions.slice(0, 3).map(d => ({
      name: this._improvementLabel(d.name),
      gain: `+${Math.abs(d.points)}점`,
      desc: this._improvementDesc(d.name)
    }));

    // 강점/약점 비율
    const strongItems = allItems.filter(i => (i.lost / (allItems.find(a => a.name === i.name)?.lost + i.lost || 1)) < 0.2).length;
    const weakItems = allItems.filter(i => i.lost >= 3).length;
    const totalItems = allItems.length;
    const strongPct = Math.round(((totalItems - weakItems) / totalItems) * 80);
    const weakPct = Math.round((weakItems / totalItems) * 100);
    const normalPct = 100 - strongPct - weakPct;

    // 전문 코멘트
    const expertComments = categories.filter(c => c.pct < 85).slice(0, 3).map(c => ({
      category: c.shortName,
      text: this._genExpertComment(c)
    }));

    // 점수 분포 (시뮬레이션)
    const distribution = [
      { range: '0-20', pct: 2 },
      { range: '21-40', pct: 5 },
      { range: '41-60', pct: 18 },
      { range: '61-80', pct: 42 },
      { range: '81-100', pct: 33 },
    ];

    return {
      exam: examType,
      examName: rubric.name,
      total,
      maxScore,
      grade,
      rank: `상위 ${rankPct}%`,
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      questionType: sentenceCount > 3 ? '서술형' : '단답형',
      engine: 'v1.0-rule',
      duration: '--',
      categories,
      deductions,
      improvements,
      strengthRatio: { strong: Math.max(10, strongPct), normal: Math.max(5, normalPct), weak: Math.max(5, weakPct) },
      distribution,
      expertComments,
      expertReview: this._genExpertReview(answerText, deductions, improvements),
      experts: DUMMY_RESULT.experts, // 전문가 매칭은 기존 더미
    };
  },

  _genComment(itemName, score, max) {
    const pct = score / max;
    if (pct >= 0.9) return '우수';
    if (pct >= 0.7) return '양호';
    if (pct >= 0.5) return '보완 필요';
    return '개선 필요';
  },

  _improvementLabel(name) {
    const map = {
      '출처 신뢰성': '출처 명시 추가',
      '주입 방지': '보안 조건 삽입',
      '반복 제거': '반복 표현 정리',
      '대상 적합성': '대상 명확화',
      '목적 정렬': '목적 구체화',
    };
    return map[name] || `${name} 개선`;
  },

  _improvementDesc(name) {
    const map = {
      '출처 신뢰성': '구체적인 출처와 보고서명을 명시',
      '주입 방지': '프롬프트 주입 방지 가이드라인 추가',
      '반복 제거': '중복 표현을 통합하여 간결성 확보',
      '대상 적합성': '대상 수준에 맞는 어휘와 표현 조정',
      '목적 정렬': '달성 목표를 더 구체적으로 명시',
    };
    return map[name] || `해당 항목의 품질을 향상`;
  },

  _genExpertComment(category) {
    const weakItems = category.items.filter(i => (i.score / i.max) < 0.8);
    if (weakItems.length === 0) return `${category.shortName} 영역은 전반적으로 양호합니다.`;
    const names = weakItems.map(i => i.name).join(', ');
    return `${category.shortName} 영역에서 ${names} 항목이 기준에 미달합니다. 해당 항목의 구체적인 보완이 필요합니다.`;
  },

  _genExpertReview(text, deductions, improvements) {
    const lines = (text || '').split('\n').filter(l => l.trim().length > 5).slice(0, 6);
    const annotations = lines.map((line, i) => {
      const trimmed = line.trim();
      if (i < 2) return { line: trimmed, type: 'good', comment: '구조화된 좋은 표현입니다. ✅' };
      if (i < 4) return { line: trimmed, type: 'warn', comment: '⚠️ 더 구체적인 표현이 필요합니다. 수치나 출처를 추가하세요.' };
      return { line: trimmed, type: 'error', comment: '❌ 이 부분에 보완이 필요합니다. 누락된 조건이나 기준을 추가하세요.' };
    });

    const roadmap = improvements.map((imp, i) => ({
      step: i + 1,
      action: imp.name,
      desc: imp.desc,
      expected: imp.gain
    }));

    return {
      reviewer: { name: '김채점', title: 'AI 분석 전문가', career: '15년', photo: '👨‍🏫', rating: 4.8, reviews: 234 },
      annotations,
      summary: deductions.length > 0
        ? `주요 감점 요인은 ${deductions.slice(0,2).map(d => d.name).join(', ')}입니다. 이 항목들을 보완하면 등급 상승이 기대됩니다.`
        : '전체적으로 우수한 답안입니다.',
      roadmap
    };
  }
};
