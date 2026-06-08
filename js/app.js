// js/app.js
// 화면 전환, UI 렌더링, 학습 흐름 컨트롤러

// ============ 화면 전환 ============
window.show = function(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (!target) return;
  target.classList.add('active');
  if (screenId === 'home-screen') refreshHome();
  if (screenId === 'subject-select-screen') refreshSubjectSelect();
  if (screenId === 'grade-select-screen') refreshGradeSelect();
  if (screenId === 'unit-select-screen') refreshUnitSelect();
  if (screenId === 'parent-screen') window.refreshParent();
  if (screenId === 'problem-screen') {
    requestAnimationFrame(() => requestAnimationFrame(window.resizeCanvas));
  }
};

// ============ 과목 선택 ============
function refreshSubjectSelect() {
  const grid = document.getElementById('subject-grid');
  if (!grid) return;
  grid.innerHTML = '';
  window.MATHLAND_SUBJECTS.forEach(subj => {
    const card = document.createElement('div');
    const isReady = subj.status === 'ready';
    card.className = 'subject-card' + (isReady ? '' : ' locked');
    card.innerHTML = `
      ${isReady ? '<span class="ready-badge">OPEN</span>' : '<span class="soon-badge">SOON</span>'}
      <div class="subject-icon-block" style="background: ${subj.color};">
        <i class="icon">${subj.icon}</i>
      </div>
      <div class="subject-name">${subj.name}</div>
      <div class="subject-tagline">${subj.tagline}</div>
    `;
    if (isReady) {
      card.addEventListener('click', () => {
        window.MATHLAND_STATE.currentSubject = subj.id;
        window.saveState();
        window.show('grade-select-screen');
      });
    }
    grid.appendChild(card);
  });
}

// ============ 학년 선택 ============
function refreshGradeSelect() {
  const grid = document.getElementById('grade-grid');
  if (!grid) return;
  const subjId = window.MATHLAND_STATE.currentSubject || 'math';
  const subj = window.getSubject(subjId);
  document.getElementById('grade-select-title').textContent = `${subj?.name || ''} · 학년 선택`;

  grid.innerHTML = '';
  window.MATHLAND_GRADES.forEach(g => {
    const isReady = g.status[subjId] === 'ready';
    const card = document.createElement('div');
    card.className = 'grade-card' + (isReady ? '' : ' locked');
    card.innerHTML = `
      ${isReady ? '' : '<span class="soon-badge">SOON</span>'}
      <div class="grade-num">${g.grade}</div>
      <div class="grade-label">${g.name}</div>
    `;
    if (isReady) {
      card.addEventListener('click', () => {
        window.MATHLAND_STATE.currentGrade = g.grade;
        window.saveState();
        window.show('unit-select-screen');
      });
    }
    grid.appendChild(card);
  });
}

// ============ 홈 ============
function refreshHome() {
  const state = window.MATHLAND_STATE;
  document.getElementById('player-level').textContent = state.player.level;
  document.getElementById('coin-count').textContent = state.coins;
  document.getElementById('gem-count').textContent = state.gems;
  document.getElementById('mission-text').textContent =
    state.todaySolved >= 5 ? '오늘의 미션 완료! 🎉' : `문제 ${state.todaySolved}/5 풀기`;
  document.getElementById('mission-bar').style.width = Math.min(100, state.todaySolved / 5 * 100) + '%';

  document.querySelectorAll('.world-item').forEach(item => {
    const need = parseInt(item.dataset.unlock);
    if (state.unlockedItems >= need) {
      item.classList.remove('locked');
      item.classList.add('unlocked');
    } else {
      item.classList.add('locked');
      item.classList.remove('unlocked');
    }
  });
}

// ============ 자기주도 학습 대시보드 (단원 선택) ============
function refreshUnitSelect() {
  const state = window.MATHLAND_STATE;
  const subjId = state.currentSubject || 'math';
  const grade = state.currentGrade || 5;
  const subj = window.getSubject(subjId);

  // 타이틀
  const titleEl = document.getElementById('unit-select-title');
  if (titleEl) titleEl.textContent = `${subj?.name || ''} ${grade}학년`;

  // 현재 과목/학년 단원만
  const units = window.getUnitsBySubjectGrade(subjId, grade);

  // ── 학습 현황 요약 ──
  const overview = document.getElementById('study-overview');
  if (overview) {
    // 전체 평균 마스터리
    let totalMastery = 0;
    units.forEach(u => { totalMastery += (state.unitMastery[u.id] || 0); });
    const avgMastery = units.length > 0 ? Math.round(totalMastery / units.length) : 0;

    // 마스터한 단원 수 (70%+)
    const masteredCount = units.filter(u => (state.unitMastery[u.id] || 0) >= 70).length;

    let masteryRows = '';
    units.forEach(u => {
      const m = state.unitMastery[u.id] || 0;
      let barColor;
      if (m < 30) barColor = 'var(--rb-red)';
      else if (m < 70) barColor = 'var(--rb-yellow)';
      else barColor = 'var(--rb-green)';
      masteryRows += `
        <div class="mastery-row">
          <div class="m-icon" style="background: ${u.color};"><i class="icon">${u.icon}</i></div>
          <div class="m-name">${u.name}</div>
          <div class="m-bar-wrap"><div class="m-bar" style="width: ${m}%; background: ${barColor};"></div></div>
          <div class="m-pct">${m}%</div>
        </div>
      `;
    });

    overview.innerHTML = `
      <h3><i class="icon" style="color: var(--rb-blue);">insights</i> 내 학습 현황</h3>
      <div class="overview-stats">
        <div class="ov-stat">
          <div class="num" style="color: var(--rb-blue);">${avgMastery}%</div>
          <div class="lbl">평균</div>
        </div>
        <div class="ov-stat">
          <div class="num" style="color: var(--rb-green);">${masteredCount}</div>
          <div class="lbl">마스터</div>
        </div>
        <div class="ov-stat">
          <div class="num" style="color: var(--rb-purple);">${units.length}</div>
          <div class="lbl">단원</div>
        </div>
      </div>
      <div class="mastery-list">${masteryRows}</div>
    `;
  }

  // ── 단원 카드 ──
  const grid = document.getElementById('unit-grid');
  grid.innerHTML = '';
  units.forEach((u) => {
    const mastery = state.unitMastery[u.id] || 0;
    let levelText, levelClass;
    if (mastery < 30)      { levelText = '쉬움'; levelClass = 'easy'; }
    else if (mastery < 70) { levelText = '보통'; levelClass = 'mid'; }
    else                   { levelText = '심화'; levelClass = 'hard'; }

    const probCount = window.MATHLAND_PROBLEMS_ALL.filter(p => p.id.startsWith(u.id+'-')).length;
    const isReady = probCount >= 10;

    const card = document.createElement('div');
    card.className = 'unit-card';
    card.innerHTML = `
      <div class="unit-icon-block" style="background: ${u.color}"><i class="icon">${u.icon}</i></div>
      <span class="level-badge ${levelClass}">${levelText}</span>
      <div class="unit-num">${u.semester}-${u.unitNum} · ${probCount}문제${isReady ? '' : ' (준비중)'}</div>
      <div class="unit-name">${u.name}</div>
      <div class="unit-progress"><div class="unit-progress-bar" style="width: ${mastery}%"></div></div>
    `;
    card.addEventListener('click', () => {
      if (window.startUnitSession(u.id)) {
        window.show('problem-screen');
        setTimeout(loadCurrentProblem, 50);
      }
    });
    grid.appendChild(card);
  });

  const weakest = window.findWeakestUnit();
  document.getElementById('ai-recommend-text').textContent =
    state.diagnosticDone
      ? `오늘은 "${weakest.name}"부터 풀어볼까?`
      : '먼저 진단평가를 해주세요!';
}

// ============ 문제 풀이 흐름 ============
function loadCurrentProblem() {
  const s = window.SESSION;
  if (!s) return;
  if (s.index >= s.problems.length) { endSession(); return; }
  const p = s.problems[s.index];
  const unit = window.MATHLAND_UNITS.find(u => p.id.startsWith(u.id + '-'));
  const lvl = window.MATHLAND_LEVELS[p.level];

  // 태그 줄
  const tagsRow = document.getElementById('problem-tags-row');
  tagsRow.innerHTML = `
    <span class="problem-tag lv${p.level}">LV${p.level} · ${lvl.label}</span>
    <span class="problem-tag type">${unit?.name || ''}</span>
    <span class="answer-mode-tag ${p.answerType === 'memo' ? 'memo' : ''}">
      <i class="icon" style="font-size:14px;vertical-align:-2px;">
        ${p.answerType === 'memo' ? 'edit_note' : 'tag'}
      </i>
      ${p.answerType === 'memo' ? '풀이/설명' : '숫자 답'}
    </span>
  `;

  document.getElementById('problem-text').textContent = p.text;
  document.getElementById('problem-equation').textContent = p.eq;
  document.getElementById('hint-area').innerHTML = '';
  s.hintLevel = 0;

  // ───── 모드별 분기 ─────
  const banner = document.getElementById('wrong-note-banner');
  const prog = document.getElementById('problem-progress');

  if (s.isWrongNote) {
    // 오답노트 모드
    banner.style.display = 'flex';
    document.getElementById('wrong-note-status').textContent =
      `${s.index + 1} / ${s.problems.length}`;

    // 진행 점은 가리고 (집중)
    prog.innerHTML = '<div class="wrong-note-progress">집중! 한 문제씩</div>';

    // 힌트 버튼 잠금 상태로 초기화 (한 획 그어야 카운트 시작)
    s.drawStarted = false;
    s.countdownActive = false;
    s.countdownEnd = 0;
    if (s._countdownTimer) { clearInterval(s._countdownTimer); s._countdownTimer = null; }
    setHintButtonLocked();

    // 첫 획 콜백 등록
    window.onCanvasFirstStroke = startHintCountdown;

    // 시도 횟수 1회 추가
    s.attemptCount[s.index] = (s.attemptCount[s.index] || 0) + 1;
  } else {
    // 메인 세션
    banner.style.display = 'none';
    window.onCanvasFirstStroke = null;
    if (s._countdownTimer) { clearInterval(s._countdownTimer); s._countdownTimer = null; }

    prog.innerHTML = '';
    for (let i = 0; i < s.problems.length; i++) {
      const d = document.createElement('div');
      d.className = 'dot';
      if (i < s.index) d.classList.add('done');
      if (i === s.index) d.classList.add('current');
      prog.appendChild(d);
    }

    // 메인 세션은 힌트 버튼 영구 잠금 표시
    setHintButtonMainLocked();
  }

  document.getElementById('coin-mini').textContent = window.MATHLAND_STATE.coins;
  window.clearCanvas();
}

// ============ 힌트 버튼 상태 관리 ============
function setHintButtonMainLocked() {
  // 메인 세션에서는 영구적으로 잠겨있음 (오답노트에서만 사용)
  const btn = document.getElementById('hint-btn');
  if (!btn) return;
  btn.className = 'btn btn-locked';
  btn.innerHTML = '<i class="icon">lock</i> 힌트';
}

function setHintButtonLocked() {
  // 오답노트, 한 획 그리기 전
  const btn = document.getElementById('hint-btn');
  if (!btn) return;
  btn.className = 'btn btn-hint-locked';
  btn.innerHTML = '<i class="icon">edit</i> 한 획 그어봐';
}

function setHintButtonCountdown(seconds) {
  const btn = document.getElementById('hint-btn');
  if (!btn) return;
  btn.className = 'btn btn-hint-counting';
  btn.innerHTML = `<i class="icon">timer</i><span class="countdown-num">${seconds}</span>`;
}

function setHintButtonActive() {
  const btn = document.getElementById('hint-btn');
  if (!btn) return;
  const s = window.SESSION;
  const used = s?.hintsUsed?.[s.index] || 0;
  btn.className = 'btn btn-hint-active';
  btn.innerHTML = `<i class="icon">lightbulb</i> 힌트 ${used + 1}/3 <span class="hint-cost-tag">-2</span>`;
}

function setHintButtonExhausted() {
  const btn = document.getElementById('hint-btn');
  if (!btn) return;
  btn.className = 'btn btn-hint-locked';
  btn.innerHTML = '<i class="icon">visibility</i> 힌트 다 봤어';
}

// 첫 획이 그려지면 호출됨 — 카운트다운 시작
function startHintCountdown() {
  const s = window.SESSION;
  if (!s || !s.isWrongNote) return;
  if (s.drawStarted) return;  // 이미 시작됨
  s.drawStarted = true;

  // 힌트 다 썼으면 시작 안 함
  const used = s.hintsUsed[s.index] || 0;
  if (used >= 3) {
    setHintButtonExhausted();
    return;
  }

  s.countdownEnd = Date.now() + 30000;
  s.countdownActive = true;
  setHintButtonCountdown(30);

  if (s._countdownTimer) clearInterval(s._countdownTimer);
  s._countdownTimer = setInterval(() => {
    const remain = Math.max(0, Math.ceil((s.countdownEnd - Date.now()) / 1000));
    if (remain <= 0) {
      clearInterval(s._countdownTimer);
      s._countdownTimer = null;
      s.countdownActive = false;
      setHintButtonActive();
    } else {
      setHintButtonCountdown(remain);
    }
  }, 250);
}

// 힌트 버튼 클릭 처리 (오답노트 모드에서만 의미 있음)
function handleHintClick() {
  const s = window.SESSION;
  if (!s) return;

  if (!s.isWrongNote) {
    // 메인 세션 — 잠김 안내
    window.showHintLockedInfo();
    return;
  }

  // 오답노트인데 아직 한 획도 안 그음
  if (!s.drawStarted) return;
  // 카운트다운 중
  if (s.countdownActive) return;

  // 힌트 보여주기
  const used = s.hintsUsed[s.index] || 0;
  if (used >= 3) return;

  const p = s.problems[s.index];
  const labels = ['개념', '원리', '조금 더'];
  const ha = document.getElementById('hint-area');
  const div = document.createElement('div');
  div.className = 'hint-bubble';
  div.innerHTML = `
    <strong>HINT ${used + 1} · ${labels[used]}</strong>
    <div>${escapeHtml(p.hints[used] || '힌트 준비 중')}</div>
  `;
  ha.appendChild(div);

  s.hintsUsed[s.index] = used + 1;
  // 코인 차감
  window.MATHLAND_STATE.coins = Math.max(0, window.MATHLAND_STATE.coins - 2);
  document.getElementById('coin-mini').textContent = window.MATHLAND_STATE.coins;
  window.saveState();

  // 떠오르는 -2 표시
  spawnFloatingCoinPenalty();

  // 다음 힌트를 위해 카운트다운 다시
  if (s.hintsUsed[s.index] < 3) {
    s.countdownEnd = Date.now() + 30000;
    s.countdownActive = true;
    setHintButtonCountdown(30);
    if (s._countdownTimer) clearInterval(s._countdownTimer);
    s._countdownTimer = setInterval(() => {
      const remain = Math.max(0, Math.ceil((s.countdownEnd - Date.now()) / 1000));
      if (remain <= 0) {
        clearInterval(s._countdownTimer);
        s._countdownTimer = null;
        s.countdownActive = false;
        setHintButtonActive();
      } else {
        setHintButtonCountdown(remain);
      }
    }, 250);
  } else {
    setHintButtonExhausted();
  }
}

// -2 떠오르는 표시
function spawnFloatingCoinPenalty() {
  const el = document.createElement('div');
  el.className = 'floating-coin';
  el.textContent = '-2';
  el.style.left = '50%';
  el.style.top = '40%';
  el.style.color = 'var(--rb-red)';
  el.style.fontFamily = "'Jua', sans-serif";
  el.style.fontSize = '24px';
  el.style.setProperty('--dx', '0px');
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function showNextHint() {
  const s = window.SESSION;
  if (!s) return;
  const p = s.problems[s.index];
  s.hintLevel = Math.min(s.hintLevel + 1, p.hints.length);
  const ha = document.getElementById('hint-area');
  ha.innerHTML = '';
  const labels = ['개념', '원리', '조금 더'];
  for (let i = 0; i < s.hintLevel; i++) {
    const div = document.createElement('div');
    div.className = 'hint-bubble';
    div.innerHTML = `<strong>HINT ${i+1} · ${labels[i]}</strong><div>${escapeHtml(p.hints[i])}</div>`;
    ha.appendChild(div);
  }
}

function submitAnswer() {
  const s = window.SESSION;
  if (!s) return;
  const p = s.problems[s.index];

  // 그림이 전혀 없으면 한번 더 물어봄
  if (!window.hasDrawing()) {
    if (!confirm('아직 풀이를 적지 않았어요. 정말 다음으로 넘어갈까요?')) return;
  }

  if (s.isWrongNote) {
    // 오답노트 모드: 즉시 채점
    handleWrongNoteSubmit(p);
    return;
  }

  // 메인 세션: 채점은 나중에. 자신감 체크만.
  showConfidenceModal(p);
}

// ============ 오답노트 제출 처리 ============
function handleWrongNoteSubmit(p) {
  const s = window.SESSION;
  // 카운트다운 정리
  if (s._countdownTimer) { clearInterval(s._countdownTimer); s._countdownTimer = null; }
  s.countdownActive = false;

  const score = window.scoreAnswer(p, window.hasDrawing());

  if (score.result === 'correct') {
    showWrongNoteCorrect(p);
    return;
  }

  // 오답이거나 review
  const attempts = s.attemptCount[s.index] || 1;

  if (attempts >= 2) {
    // 두 번 째 시도도 실패 → 정답 공개
    showWrongNoteReveal(p, 'tried-twice');
  } else {
    // 첫 시도 실패 → 한 번 더 도전 기회
    showWrongNoteRetry(p);
  }
}

function showWrongNoteCorrect(p) {
  const s = window.SESSION;
  const used = s.hintsUsed[s.index] || 0;
  // 보상 계산
  let coins = 8 - 2 * used;
  coins = Math.max(0, coins);

  window.MATHLAND_STATE.coins += coins;
  document.getElementById('coin-mini').textContent = window.MATHLAND_STATE.coins;
  window.saveState();

  s.finalResults[s.index] = 'correct';

  // 단원 마스터리 업데이트 (오답노트 정답은 +5)
  const unitId = p.id.split('-')[0];
  if (window.MATHLAND_STATE.unitMastery[unitId] === undefined) window.MATHLAND_STATE.unitMastery[unitId] = 50;
  window.MATHLAND_STATE.unitMastery[unitId] = Math.min(100, window.MATHLAND_STATE.unitMastery[unitId] + 5);
  window.saveState();

  spawnConfetti();
  if (coins > 0) spawnFloatingCoins(Math.min(coins, 4));

  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  content.innerHTML = `
    <div class="result-icon correct"><i class="icon">check_circle</i></div>
    <h2>다시 풀어냈어!</h2>
    <p>${used === 0 ? '힌트 없이 혼자 해냈어요! 멋져요 ✨' : '힌트를 보고 다시 도전해서 풀었어요.'}</p>
    ${coins > 0 ? `
    <div class="reward-row">
      <div class="reward-pill coin"><i class="icon">monetization_on</i> +${coins}</div>
    </div>` : ''}
    <div class="model-solution">
      <span class="label">정답 확인</span>
      <div class="answer-row">${escapeHtml(p.eq)} → <b>${escapeHtml(p.answer)}</b></div>
    </div>
    <div class="modal-btns">
      <button class="btn btn-blue btn-big" data-action="next-problem">
        <i class="icon">arrow_forward</i> 다음 문제
      </button>
    </div>
  `;
  modal.classList.add('active');
}

function showWrongNoteRetry(p) {
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  content.innerHTML = `
    <div class="result-icon wrong"><i class="icon">refresh</i></div>
    <h2>다시 한번!</h2>
    <p>아쉬워, 한 번 더 도전해보자.<br>힌트도 활용해봐 (코인 -2)</p>
    <div class="modal-btns">
      <button class="btn btn-ghost" data-action="reveal-wrong-note"><i class="icon">visibility</i> 정답 보기</button>
      <button class="btn btn-yellow btn-big" data-action="retry-wrong-note"><i class="icon">redo</i> 다시 도전!</button>
    </div>
  `;
  modal.classList.add('active');
}

function showWrongNoteReveal(p, reason) {
  const s = window.SESSION;
  s.finalResults[s.index] = 'revealed';

  // 마스터리 살짝 -
  const unitId = p.id.split('-')[0];
  if (window.MATHLAND_STATE.unitMastery[unitId] === undefined) window.MATHLAND_STATE.unitMastery[unitId] = 50;
  window.MATHLAND_STATE.unitMastery[unitId] = Math.max(0, window.MATHLAND_STATE.unitMastery[unitId] - 2);
  window.saveState();

  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  const heading = reason === 'tried-twice' ? '괜찮아, 같이 보자!' : '풀이를 함께 봐!';

  content.innerHTML = `
    <div class="result-icon review"><i class="icon">school</i></div>
    <h2>${heading}</h2>
    <p>이 문제는 다음에 더 잘 풀 수 있을 거야.<br>모범 풀이를 잘 보고 이해하자.</p>
    <div class="model-solution">
      <span class="label">정답</span>
      <div class="answer-row">${escapeHtml(p.eq)} → <b>${escapeHtml(p.answer)}</b></div>
      ${p.hints && p.hints[2] ? `
      <div style="margin-top: 8px; font-size: 13px; line-height: 1.5; color: var(--ink); font-family: 'Pretendard', sans-serif;">
        💡 ${escapeHtml(p.hints[2])}
      </div>` : ''}
    </div>
    <div class="modal-btns">
      <button class="btn btn-blue btn-big" data-action="next-problem">
        <i class="icon">arrow_forward</i> 다음 문제
      </button>
    </div>
  `;
  modal.classList.add('active');
}

// 한번 더 도전 — 캔버스 비우고 다시 같은 문제
window.retryWrongNote = function() {
  closeResultModal();
  const s = window.SESSION;
  if (!s) return;
  s.attemptCount[s.index] = (s.attemptCount[s.index] || 0) + 1;
  // 카운트다운 상태 리셋 (드로잉부터 다시)
  s.drawStarted = false;
  s.countdownActive = false;
  s.countdownEnd = 0;
  if (s._countdownTimer) { clearInterval(s._countdownTimer); s._countdownTimer = null; }

  // 힌트 다 썼는지 보고 버튼 상태 결정
  const used = s.hintsUsed[s.index] || 0;
  if (used >= 3) setHintButtonExhausted();
  else setHintButtonLocked();

  window.clearCanvas();
};

window.revealWrongNote = function() {
  closeResultModal();
  const s = window.SESSION;
  if (!s) return;
  const p = s.problems[s.index];
  showWrongNoteReveal(p, 'gave-up');
};

// ============ 자신감 체크 모달 ============
function showConfidenceModal(problem) {
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  content.innerHTML = `
    <div class="result-icon" style="background: linear-gradient(135deg, var(--rb-cyan), var(--rb-blue));">
      <i class="icon">psychology</i>
    </div>
    <h2>이 문제, 어땠어?</h2>
    <p>정답은 다 풀고 나서 함께 봐요.<br>지금은 너의 느낌만 알려줘!</p>

    <div class="confidence-options">
      <button class="conf-btn sure" data-conf="sure">
        <span class="conf-emoji">😎</span>
        <span class="conf-text">
          <span class="conf-main">확실해요!</span>
          <span class="conf-sub">"이거 맞을 거야"</span>
        </span>
      </button>
      <button class="conf-btn unsure" data-conf="unsure">
        <span class="conf-emoji">🤔</span>
        <span class="conf-text">
          <span class="conf-main">조금 헷갈려요</span>
          <span class="conf-sub">"맞나 아닌가..."</span>
        </span>
      </button>
      <button class="conf-btn guess" data-conf="guess">
        <span class="conf-emoji">😅</span>
        <span class="conf-text">
          <span class="conf-main">그냥 찍었어요</span>
          <span class="conf-sub">"잘 모르겠어"</span>
        </span>
      </button>
    </div>
  `;
  modal.classList.add('active');
}

// 자신감 선택 → 다음 문제로
window.handleConfidenceChoice = function(conf) {
  const s = window.SESSION;
  if (!s) return;
  s.confidence.push(conf);
  closeResultModal();
  s.index++;
  if (s.index >= s.problems.length) endSession();
  else loadCurrentProblem();
};

// 잠긴 힌트 안내
window.showHintLockedInfo = function() {
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  content.innerHTML = `
    <div class="result-icon" style="background: linear-gradient(135deg, #d4d6e3, #a4a8bc);">
      <i class="icon">lock</i>
    </div>
    <h2>지금은 힌트를 못 써!</h2>
    <p>모든 문제를 다 푼 다음, <b>틀린 문제만 다시 풀 때</b><br>힌트가 열려요.<br>지금은 혼자 풀어보는 시간이야 💪</p>
    <div class="modal-btns">
      <button class="btn btn-blue btn-big" data-action="close-modal">알겠어!</button>
    </div>
  `;
  modal.classList.add('active');
};

// ============ "왜 그렇게 생각했어?" 사고 모달 ============
function showThinkingModal({ title, question, problemId, eq, level, unit, onDone }) {
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  content.innerHTML = `
    <div class="result-icon review"><i class="icon">psychology</i></div>
    <h2>${escapeHtml(title)}</h2>
    <div class="thinking-modal-content">
      <span class="label">왜 그렇게 생각했어?</span>
      <p style="margin: 0 0 10px; font-size:15px; font-weight:700;">${escapeHtml(question)}</p>
      <textarea id="thinking-input" placeholder="짧게 적어도 괜찮아. 한 줄이면 충분해."></textarea>
    </div>
    <div class="modal-btns">
      <button class="btn btn-ghost" id="thinking-skip">건너뛰기</button>
      <button class="btn btn-purple" id="thinking-save"><i class="icon">save</i> 답변 저장</button>
    </div>
  `;
  modal.classList.add('active');

  const finish = (saved) => {
    const txt = document.getElementById('thinking-input')?.value?.trim();
    if (saved && txt) {
      window.MATHLAND_STATE.thinkingLog.push({
        id: Date.now() + Math.random(),
        problemId, eq, level, unit, question,
        childThought: txt,
        ts: new Date().toISOString(),
      });
      // 보너스 코인
      window.MATHLAND_STATE.coins += 3;
      window.saveState();
    }
    closeResultModal();
    onDone && onDone();
  };

  document.getElementById('thinking-save').addEventListener('click', () => finish(true));
  document.getElementById('thinking-skip').addEventListener('click', () => finish(false));
  setTimeout(() => document.getElementById('thinking-input')?.focus(), 100);
}

// ============ 도전 문제 모달 ============
function showChallenge() {
  const s = window.SESSION;
  const p = s.problems[s.index];
  if (!p.challenge) {
    showResultModal({result: 'correct'}, 0, 0, p);
    return;
  }
  window.markChallengePresented();
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  content.innerHTML = `
    <div class="result-icon challenge"><i class="icon">workspace_premium</i></div>
    <h2>도전 문제!</h2>
    <p>같은 문제를 <b>다른 방법으로</b> 풀어볼래?<br>풀어보면 보석 +1 보너스!</p>
    <div class="thinking-modal-content" style="background: linear-gradient(135deg, #f0e6ff, #d9c5ff);">
      <span class="label" style="background: var(--rb-purple);">CHALLENGE</span>
      <p style="margin: 0; font-size:15px; font-weight:700;">${escapeHtml(p.challenge.text)}</p>
    </div>
    <div class="modal-btns">
      <button class="btn btn-ghost" data-action="skip-challenge">다음에</button>
      <button class="btn btn-purple" data-action="accept-challenge"><i class="icon">bolt</i> 도전!</button>
    </div>
  `;
  modal.classList.add('active');
}

window.acceptChallenge = function() {
  const s = window.SESSION;
  const p = s.problems[s.index];
  closeResultModal();
  // 캔버스 비우고 도전 문제로 잠시 전환
  window.clearCanvas();
  document.getElementById('problem-text').textContent = p.challenge.text;
  document.getElementById('problem-equation').textContent = '도전 문제 — 펜으로 풀이';
  // 도전 문제 제출 처리는 다음 submit에서 보석 +1 처리 + 다음 문제로
  s.inChallenge = true;
};

// ============ 결과 모달 ============
function showResultModal(score, coins, gems, problem) {
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');

  let title, message, iconClass, iconName;
  if (score.result === 'correct') {
    const titles = ['정답이야!', '잘했어!', '대단해!', '굿잡!'];
    title = titles[Math.floor(Math.random()*titles.length)];
    message = '풀이 과정도 깔끔했어요!';
    iconClass = 'correct'; iconName = 'check_circle';
  } else if (score.result === 'review') {
    title = '제출 완료!';
    message = '풀이를 부모님이 확인해주실 거예요. 다음 문제로 가볼까요?';
    iconClass = 'review'; iconName = 'pending';
  } else {
    title = '아쉬워!';
    message = '괜찮아. 힌트를 보고 다시 도전해볼까?';
    iconClass = 'wrong'; iconName = 'cancel';
  }

  let rewardHtml = '';
  if (score.result === 'correct') {
    rewardHtml = `
      <div class="reward-row">
        <div class="reward-pill coin"><i class="icon">monetization_on</i> +${coins}</div>
        ${gems ? `<div class="reward-pill gem"><i class="icon">diamond</i> +${gems}</div>` : ''}
      </div>`;
  }

  let buttons;
  if (score.result === 'correct' || score.result === 'review') {
    buttons = `<button class="btn btn-blue btn-big" data-action="next-problem"><i class="icon">arrow_forward</i> 다음 문제</button>`;
  } else {
    buttons = `
      <button class="btn btn-yellow" data-action="show-hint"><i class="icon">lightbulb</i> 힌트</button>
      <button class="btn btn-ghost" data-action="reveal-answer"><i class="icon">visibility</i> 정답 보기</button>
    `;
  }

  content.innerHTML = `
    <div class="result-icon ${iconClass}"><i class="icon">${iconName}</i></div>
    <h2>${title}</h2>
    <p>${message}</p>
    ${rewardHtml}
    <div class="modal-btns">${buttons}</div>
  `;
  modal.classList.add('active');
}

function closeResultModal() {
  document.getElementById('result-modal').classList.remove('active');
}

function nextProblem() {
  closeResultModal();
  const s = window.SESSION;
  if (!s) return;
  // 도전 문제 모드였다면 보너스 + 정상 흐름
  if (s.inChallenge) {
    window.MATHLAND_STATE.gems += 1;
    window.saveState();
    s.inChallenge = false;
  }
  s.index++;

  if (s.isWrongNote) {
    if (s.index >= s.problems.length) endWrongNoteSession();
    else loadCurrentProblem();
  } else {
    if (s.index >= s.problems.length) endSession();
    else loadCurrentProblem();
  }
}

// ============ 오답노트 세션 종료 ============
function endWrongNoteSession() {
  const s = window.SESSION;
  if (!s) return;

  // 카운트다운 정리
  if (s._countdownTimer) { clearInterval(s._countdownTimer); s._countdownTimer = null; }
  window.onCanvasFirstStroke = null;

  // 정복 통계
  const total = s.problems.length;
  const correct = s.finalResults.filter(r => r === 'correct').length;
  const fullClear = correct === total;

  // 추가 보너스
  let bonusCoins = 0;
  let bonusGems = 0;
  if (fullClear) {
    bonusCoins = 10;
    bonusGems = 1;
    window.MATHLAND_STATE.coins += bonusCoins;
    window.MATHLAND_STATE.gems += bonusGems;
  }
  window.saveState();

  // 결과 → 회고
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');

  const titleText = fullClear
    ? '오답노트 100% 정복!'
    : `${correct} / ${total} 정복!`;

  content.innerHTML = `
    <div class="result-icon ${fullClear ? 'correct' : 'review'}">
      <i class="icon">${fullClear ? 'emoji_events' : 'edit_note'}</i>
    </div>
    <h2>${titleText}</h2>
    <p>${fullClear
      ? '틀렸던 문제를 모두 다시 풀어냈어요! 정말 멋져요 ✨'
      : '도전한 자체가 멋진 거야. 모범 풀이 잘 봐뒀지?'}</p>
    ${fullClear ? `
    <div class="reward-row">
      <div class="reward-pill coin"><i class="icon">monetization_on</i> +${bonusCoins}</div>
      <div class="reward-pill gem"><i class="icon">diamond</i> +${bonusGems}</div>
    </div>` : ''}
    <div class="modal-btns">
      <button class="btn btn-purple btn-big" data-action="to-reflection-from-wrongnote">
        <i class="icon">menu_book</i> 회고하고 마치기
      </button>
    </div>
  `;
  modal.classList.add('active');
  if (fullClear) spawnConfetti();
}

window.toReflectionFromWrongNote = function() {
  // 회고 진입은 동일 흐름이지만 진단평가 X 분기 명시
  const s = window.SESSION;
  if (!s) return;
  closeResultModal();
  const todayDone = window.MATHLAND_STATE.reflections.find(r => r.date === window.todayKey());
  if (todayDone) {
    showFinalSummary(0, 0, false);
    return;
  }
  showReflectionScreen(0, s.problems.length);
};

function revealAnswer() {
  closeResultModal();
  const s = window.SESSION;
  const p = s.problems[s.index];
  const ha = document.getElementById('hint-area');
  ha.innerHTML = `
    <div class="hint-bubble" style="background: linear-gradient(135deg, #d6f6ff, #99ddff);">
      <strong style="background: var(--rb-green);">정답</strong>
      <div style="font-size: 15px; font-weight: 800;">${escapeHtml(p.eq)} → <b>${escapeHtml(p.answer)}</b></div>
    </div>
  `;
  setTimeout(() => {
    document.getElementById('result-modal-content').innerHTML = `
      <div class="result-icon review"><i class="icon">school</i></div>
      <h2>다음엔 잘 풀 수 있어!</h2>
      <p>풀이를 보고 이해했으면 다음 문제로 갈까요?</p>
      <div class="modal-btns">
        <button class="btn btn-blue btn-big" data-action="next-problem"><i class="icon">arrow_forward</i> 다음 문제</button>
      </div>
    `;
    document.getElementById('result-modal').classList.add('active');
  }, 1500);
}

// ============ 세션 종료 → 채점 → 결과 화면 ============
function endSession() {
  const s = window.SESSION;
  if (!s) return;

  closeResultModal();

  // 이제서야 채점!
  const state = window.MATHLAND_STATE;
  const results = [];      // 'correct' | 'wrong' | 'review'
  let correctCount = 0;
  let wrongCount = 0;

  for (let i = 0; i < s.problems.length; i++) {
    const p = s.problems[i];
    // 자신감이 'guess'(찍음)면 채점에 영향 — 단, 실제 채점은 그대로
    // 캔버스 그림 데이터는 이미 사라졌으니, 풀이 시도가 있었음을 가정해서 채점
    const score = window.scoreAnswer(p, true);
    results.push(score.result);

    if (score.result === 'correct') correctCount++;
    else if (score.result === 'wrong') wrongCount++;

    // 단원 마스터리 업데이트
    const unitId = p.id.split('-')[0];
    if (state.unitMastery[unitId] === undefined) state.unitMastery[unitId] = 50;
    if (score.result === 'correct') state.unitMastery[unitId] = Math.min(100, state.unitMastery[unitId] + 6);
    else if (score.result === 'wrong') state.unitMastery[unitId] = Math.max(0, state.unitMastery[unitId] - 3);

    // 푼 문제 기록
    window.recordSolved(p.id);

    // 통계
    state.todaySolved++;
    state.totalSolved++;
    if (score.result === 'correct') state.todayCorrect++;

    // 검수 큐 (memo형 등)
    if (score.result === 'review') {
      state.reviewQueue.push({
        id: Date.now() + Math.random() + i,
        problemId: p.id,
        eq: p.eq, answer: p.answer,
        aiGuess: score.aiAnswer, confidence: score.confidence,
        unit: unitId, ts: new Date().toISOString()
      });
    }
  }

  // 보상 계산 (단순화 버전)
  // 1. 정답 1개 = +10 (단계 3·4 +5 추가)
  // 2. 자신감 일치 보너스 = +3 (sure→정답 / guess→오답이면 정직)
  // 3. 완주 보상 = +20 (10문제 다 풀어냄)
  let earnedCoins = 0;
  let earnedGems = 0;
  let metaMatchCount = 0;     // 자신감 정확도용
  let metaTotalCount = 0;
  for (let i = 0; i < s.problems.length; i++) {
    const r = results[i];
    const conf = s.confidence[i];
    const p = s.problems[i];

    if (r === 'correct') {
      earnedCoins += 10;
      if (p.level >= 3) earnedCoins += 5;
    }

    // 자신감 정확도 계산
    if (conf && (r === 'correct' || r === 'wrong')) {
      metaTotalCount++;
      // sure → correct, guess → wrong 일 때 "정직"
      if ((conf === 'sure' && r === 'correct') ||
          (conf === 'guess' && r === 'wrong') ||
          (conf === 'unsure')) {  // unsure는 어느 쪽이든 OK (자기 인식 정확)
        metaMatchCount++;
        earnedCoins += 3;
      }
    }
  }

  // 완주 보상
  earnedCoins += 20;
  if (correctCount === s.problems.length) earnedGems += 1;  // 만점이면 보석

  state.coins += earnedCoins;
  state.gems += earnedGems;
  state.player.exp += earnedCoins;
  if (state.player.exp >= state.player.level * 50) {
    state.player.level++;
    state.player.exp = state.player.exp - state.player.level * 50;
  }
  state.unlockedItems = Math.min(20, Math.floor(state.totalSolved / 2));

  if (s.isDiagnostic) state.diagnosticDone = true;

  // 세션 결과 데이터 저장 (다음 라운드의 오답노트가 사용)
  s.results = results;
  s.metaAccuracy = metaTotalCount > 0 ? Math.round(metaMatchCount / metaTotalCount * 100) : null;
  s.earnedCoins = earnedCoins;
  s.earnedGems = earnedGems;

  window.saveState();

  // 결과 화면으로
  showSessionResult();
}

// ============ 세션 결과 화면 ============
function showSessionResult() {
  const s = window.SESSION;
  if (!s) return;

  const correctCount = s.results.filter(r => r === 'correct').length;
  const wrongCount = s.results.filter(r => r === 'wrong').length;
  const total = s.problems.length;

  document.getElementById('result-correct').textContent = correctCount;
  document.getElementById('result-wrong').textContent = wrongCount;
  document.getElementById('result-total').textContent = total;

  // 자신감 정확도 메시지
  const acc = s.metaAccuracy;
  let metaText;
  if (acc === null) {
    metaText = '자신감 데이터가 부족해요.';
  } else if (acc >= 80) {
    metaText = `<span class="pct-num">${acc}%</span> 너는 너 자신을 잘 알고 있구나! 자신 있을 때와 헷갈릴 때를 정확히 느꼈어.`;
  } else if (acc >= 50) {
    metaText = `<span class="pct-num">${acc}%</span> 자신감과 결과가 어느 정도 맞아. 좀 더 정확해질 수 있어!`;
  } else {
    metaText = `<span class="pct-num">${acc}%</span> 생각보다 결과가 다르게 나왔네. 다음엔 더 신중히 살펴볼까?`;
  }
  document.getElementById('meta-accuracy-text').innerHTML = metaText;

  // 한눈에 보기 그리드
  const cells = document.getElementById('result-cells');
  cells.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const r = s.results[i];
    const conf = s.confidence[i];
    const cell = document.createElement('div');

    let cellClass = 'result-cell ';
    let icon = '';
    let confMark = '';

    // 자신없는데 정답 = unsure (오답노트에서 다시 보기)
    // 정답 = correct
    // 오답 = wrong
    if (r === 'correct' && conf === 'guess') {
      cellClass += 'unsure';
      icon = '❓';   // 찍어서 맞은 것
    } else if (r === 'correct') {
      cellClass += 'correct';
      icon = '✅';
    } else if (r === 'wrong') {
      cellClass += 'wrong review-needed';
      icon = '❌';
    } else {
      cellClass += 'unsure';
      icon = '🔍';   // review (검수 대기)
    }

    // 자신감 마크
    if (conf === 'sure') confMark = '😎';
    else if (conf === 'unsure') confMark = '🤔';
    else if (conf === 'guess') confMark = '😅';

    cell.className = cellClass;
    cell.innerHTML = `
      ${confMark ? `<span class="conf-mark">${confMark}</span>` : ''}
      <span class="ico">${icon}</span>
      <span class="num">${i + 1}</span>
    `;
    cells.appendChild(cell);
  }

  // 액션 버튼 동적 생성 — 오답/자신없음 있으면 오답노트 버튼
  const actions = document.getElementById('session-result-actions');
  const wrongCount2 = s.results.filter(r => r === 'wrong').length;
  const guessCorrectCount = s.results.filter((r, i) => r === 'correct' && s.confidence[i] === 'guess').length;
  const wrongNoteCount = wrongCount2 + guessCorrectCount;

  if (wrongNoteCount > 0) {
    actions.innerHTML = `
      <button class="btn btn-pink btn-big" data-action="start-wrong-note">
        <i class="icon">edit_note</i> 오답노트 시작! (${wrongNoteCount}문제)
      </button>
      <button class="btn btn-ghost" data-action="to-reflection">
        건너뛰기
      </button>
    `;
  } else {
    actions.innerHTML = `
      <button class="btn btn-purple btn-big" data-action="to-reflection">
        <i class="icon">menu_book</i> 회고하고 마치기
      </button>
    `;
  }

  window.show('session-result-screen');

  // 약한 콘페티 (성취감)
  if (correctCount > total / 2) spawnConfetti();
}

// 결과 화면 → 회고 화면
window.toReflection = function() {
  const s = window.SESSION;
  if (!s) return;

  // 진단평가는 회고 없이 바로 끝
  if (s.isDiagnostic) {
    showFinalSummary(s.results.filter(r => r === 'correct').length, s.problems.length, true);
    return;
  }

  // 오늘 회고가 이미 있으면 건너뛰고 결과만
  const todayDone = window.MATHLAND_STATE.reflections.find(r => r.date === window.todayKey());
  if (todayDone) {
    showFinalSummary(s.results.filter(r => r === 'correct').length, s.problems.length, false);
    return;
  }

  showReflectionScreen(
    s.results.filter(r => r === 'correct').length,
    s.problems.length
  );
};

// ============ 오답노트 시작 흐름 ============
window.startWrongNoteFlow = function() {
  const mainSession = window.SESSION;
  if (!mainSession) return;

  // 분석: 자신있다 했는데 틀린 게 있는지?
  let confidentButWrong = 0;
  let guessButCorrect = 0;
  let pureWrong = 0;
  for (let i = 0; i < mainSession.problems.length; i++) {
    const r = mainSession.results[i];
    const c = mainSession.confidence[i];
    if (r === 'wrong' && c === 'sure') confidentButWrong++;
    else if (r === 'correct' && c === 'guess') guessButCorrect++;
    else if (r === 'wrong') pureWrong++;
  }

  // 메시지 동적 생성
  let title = '같이 들여다보자!';
  let subMessage = '';
  if (confidentButWrong > 0) {
    title = '자신 있다고 했는데...';
    subMessage = `<b style="color: var(--rb-red);">${confidentButWrong}문제</b>가 자신있다 했는데 틀렸구나! 어떤 부분이 헷갈렸을까?`;
  } else if (guessButCorrect > 0 && pureWrong === 0) {
    title = '찍어서 맞은 문제도 있구나!';
    subMessage = `정답이지만 잘 모른다고 표시한 <b style="color: var(--rb-orange);">${guessButCorrect}문제</b>를 같이 풀어보자.`;
  } else {
    subMessage = '틀린 문제를 같이 풀어보면 다음엔 더 잘 풀 수 있어!';
  }

  const targets = [];
  for (let i = 0; i < mainSession.problems.length; i++) {
    const r = mainSession.results[i];
    const c = mainSession.confidence[i];
    if (r === 'wrong' || (r === 'correct' && c === 'guess')) {
      targets.push({ idx: i, r, c });
    }
  }

  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  content.innerHTML = `
    <div class="result-icon" style="background: linear-gradient(135deg, var(--rb-pink), var(--rb-purple));">
      <i class="icon">edit_note</i>
    </div>
    <h2>${title}</h2>
    <p>${subMessage}</p>
    <div style="background: var(--paper-soft); border: 3px solid var(--ink); border-radius: 12px; padding: 12px; margin: 14px 0; box-shadow: 0 3px 0 var(--ink); text-align: left;">
      <p style="margin: 0 0 8px; font-size: 13px; font-family: 'Press Start 2P', monospace; color: var(--ink-soft);">RULES</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 14px; line-height: 1.7; font-family: 'Pretendard', sans-serif;">
        <li>한 획 그어야 힌트 30초 카운트 시작</li>
        <li>힌트 1개당 코인 -2</li>
        <li>한 번 더 도전 가능 (그래도 틀리면 정답 공개)</li>
        <li>다 정복하면 보석 +1!</li>
      </ul>
    </div>
    <div class="modal-btns">
      <button class="btn btn-ghost" data-action="to-reflection">건너뛰기</button>
      <button class="btn btn-pink btn-big" id="confirm-start-wrongnote">
        <i class="icon">play_arrow</i> 시작!
      </button>
    </div>
  `;
  modal.classList.add('active');

  document.getElementById('confirm-start-wrongnote').addEventListener('click', () => {
    if (window.startWrongNoteSession(mainSession)) {
      closeResultModal();
      window.show('problem-screen');
      setTimeout(loadCurrentProblem, 50);
    }
  });
};

function showReflectionScreen(correctCount, total) {
  const s = window.SESSION;
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');

  // 사고 로그에서 오늘 적은 것들 미리보기
  const todayThoughts = window.MATHLAND_STATE.thinkingLog.filter(t => {
    const td = new Date(t.ts);
    return td.toDateString() === new Date().toDateString();
  }).length;

  content.innerHTML = `
    <div class="result-icon" style="background: linear-gradient(135deg, var(--rb-cyan), var(--rb-blue));">
      <i class="icon">menu_book</i>
    </div>
    <h2>오늘의 회고</h2>
    <p style="margin: 0 0 8px;">하루를 마치기 전에, 짧게 돌아볼까?</p>

    <div class="reflection-summary">
      <div class="stat-block">
        <div class="num" style="color: var(--rb-green);">${correctCount}</div>
        <div class="lbl">정답</div>
      </div>
      <div class="stat-block">
        <div class="num" style="color: var(--rb-blue);">${total}</div>
        <div class="lbl">푼 문제</div>
      </div>
      <div class="stat-block">
        <div class="num" style="color: var(--rb-purple);">${todayThoughts}</div>
        <div class="lbl">생각 기록</div>
      </div>
    </div>

    <div class="reflection-card">
      <h4><i class="icon" style="color: var(--rb-green);">lightbulb</i> 오늘 뭐 알게 됐어?</h4>
      <p class="sub-text">한 가지만이라도 좋아!</p>
      <textarea id="reflect-learned" placeholder="예: 곱셈은 덧셈·뺄셈보다 먼저 한다는 걸 알았다."></textarea>
    </div>

    <div class="reflection-card" style="background: linear-gradient(135deg, #ffe0e0, #ffc4c4);">
      <h4><i class="icon" style="color: var(--rb-red);">help</i> 어떤 게 어려웠어?</h4>
      <p class="sub-text">힘들었던 부분을 적어두면 다음에 더 잘 풀 수 있어.</p>
      <textarea id="reflect-harder" placeholder="예: 괄호가 많은 식이 헷갈렸다."></textarea>
    </div>

    <div class="modal-btns">
      <button class="btn btn-ghost" data-action="skip-reflection">건너뛰기</button>
      <button class="btn btn-cyan btn-big" data-action="save-reflection"><i class="icon">save</i> 저장하고 끝내기</button>
    </div>
  `;
  modal.classList.add('active');
  window.SESSION._pendingFinal = { correctCount, total };
}

window.saveReflection = function(skip) {
  const learned = skip ? '' : (document.getElementById('reflect-learned')?.value?.trim() || '');
  const harder  = skip ? '' : (document.getElementById('reflect-harder')?.value?.trim() || '');

  if (!skip && (learned || harder)) {
    window.MATHLAND_STATE.reflections.push({
      date: window.todayKey(),
      learned, harder,
      ts: new Date().toISOString(),
    });
    // 회고 작성 보너스
    window.MATHLAND_STATE.coins += 5;
    window.MATHLAND_STATE.gems += 1;
    window.saveState();
  }

  const pending = window.SESSION?._pendingFinal;
  closeResultModal();
  if (pending) showFinalSummary(pending.correctCount, pending.total, false);
};

function showFinalSummary(correctCount, total, isDiagnostic) {
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  const state = window.MATHLAND_STATE;
  content.innerHTML = `
    <div class="result-icon correct"><i class="icon">emoji_events</i></div>
    <h2>${isDiagnostic ? '진단평가 완료!' : '오늘 학습 완료!'}</h2>
    <p>${total}문제 중 ${correctCount}문제 정답!<br>
       ${isDiagnostic ? 'AI가 너에게 맞는 학습 경로를 만들었어!' : '내일 또 만나자.'}</p>
    <div class="reward-row">
      <div class="reward-pill coin"><i class="icon">monetization_on</i> ${state.coins}</div>
      <div class="reward-pill gem"><i class="icon">diamond</i> ${state.gems}</div>
    </div>
    <div class="modal-btns">
      <button class="btn btn-blue btn-big" data-action="back-home"><i class="icon">home</i> 월드로</button>
    </div>
  `;
  modal.classList.add('active');
  spawnConfetti();
  window.SESSION = null;
  window.saveState();
}

// ============ 효과 ============
function spawnFloatingCoins(n) {
  for (let i = 0; i < Math.min(n, 6); i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.className = 'floating-coin';
      el.textContent = 'monetization_on';
      el.style.left = (50 + (Math.random()-0.5)*20) + '%';
      el.style.top = '50%';
      el.style.setProperty('--dx', ((Math.random()-0.5)*200) + 'px');
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 1300);
    }, i * 100);
  }
}

function spawnConfetti() {
  const colors = ['#ff3838', '#ffd23f', '#2ecc40', '#1a7aff', '#ff4ba0', '#a06cd5', '#00d4ff'];
  for (let i = 0; i < 24; i++) {
    const el = document.createElement('div');
    el.className = 'confetti';
    el.style.background = colors[i % colors.length];
    el.style.left = (40 + Math.random()*20) + '%';
    el.style.top = '40%';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '4px';
    el.style.transform = `rotate(${Math.random()*360}deg)`;
    el.style.animationDelay = (Math.random()*0.3) + 's';
    el.style.setProperty('--dx', ((Math.random()-0.5)*400) + 'px');
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

// ============ 이벤트 위임 ============
document.body.addEventListener('click', e => {
  // 도구 버튼
  const toolBtn = e.target.closest('.tool-btn');
  if (toolBtn) {
    e.preventDefault();
    e.stopPropagation();
    window.handleToolButton(toolBtn.dataset.tool);
    return;
  }

  // 굵기 버튼
  const sizeBtn = e.target.closest('.stroke-dot');
  if (sizeBtn) {
    e.preventDefault();
    document.querySelectorAll('.stroke-dot').forEach(x => x.classList.remove('active'));
    sizeBtn.classList.add('active');
    window.setStrokeSize(sizeBtn.dataset.size);
    return;
  }

  // 액션
  const target = e.target.closest('[data-action]');
  if (target) {
    e.preventDefault();
    handleAction(target.dataset.action, target);
    return;
  }

  // 자신감 버튼 (sure / unsure / guess)
  const confBtn = e.target.closest('.conf-btn');
  if (confBtn) {
    e.preventDefault();
    window.handleConfidenceChoice(confBtn.dataset.conf);
    return;
  }

  // 핀패드
  const pinKey = e.target.closest('.pin-key');
  if (pinKey && !pinKey.dataset.action) {
    const key = pinKey.dataset.key === 'del' ? 'del' : pinKey.textContent.trim();
    window.handlePinKey(key);
    return;
  }

  // 검수 버튼
  const reviewBtn = e.target.closest('[data-review-id]');
  if (reviewBtn) {
    window.handleReviewJudge(reviewBtn.dataset.reviewId, reviewBtn.dataset.judge);
  }
});

function handleAction(action, target) {
  switch (action) {
    case 'continue':
      window.show('home-screen');
      break;
    case 'diagnostic':
      if (window.startDiagnostic()) {
        window.show('problem-screen');
        setTimeout(loadCurrentProblem, 50);
      }
      break;
    case 'study':
      window.show('subject-select-screen');
      break;
    case 'to-subject-select':
      window.show('subject-select-screen');
      break;
    case 'to-grade-select':
      window.show('grade-select-screen');
      break;
    case 'ai-recommend':
      if (!window.MATHLAND_STATE.diagnosticDone) {
        if (window.startDiagnostic()) {
          window.show('problem-screen');
          setTimeout(loadCurrentProblem, 50);
        }
      } else {
        if (window.startAIRecommend()) {
          window.show('problem-screen');
          setTimeout(loadCurrentProblem, 50);
        }
      }
      break;
    case 'back-home':
      window.resetPin();
      if (window.SESSION) window.SESSION = null;
      closeResultModal();
      window.show('home-screen');
      break;
    case 'parent':
      window.resetPin();
      window.show('parent-pin-screen');
      break;
    case 'reset':
      if (confirm('정말 모든 데이터를 초기화할까요?')) {
        window.resetState();
        window.show('start-screen');
      }
      break;
    case 'submit':
      if (!window.SESSION) return;
      submitAnswer();
      break;
    case 'hint-request':
      if (!window.SESSION) return;
      showNextHint();
      break;
    case 'hint-locked-info':
      window.showHintLockedInfo();
      break;
    case 'close-modal':
      closeResultModal();
      break;
    case 'to-reflection':
      window.toReflection();
      break;
    case 'start-wrong-note':
      window.startWrongNoteFlow();
      break;
    case 'retry-wrong-note':
      window.retryWrongNote();
      break;
    case 'reveal-wrong-note':
      window.revealWrongNote();
      break;
    case 'to-reflection-from-wrongnote':
      window.toReflectionFromWrongNote();
      break;
    case 'hint-action':
      handleHintClick();
      break;
    case 'next-problem':
      nextProblem();
      break;
    case 'show-hint':
      closeResultModal();
      showNextHint();
      break;
    case 'reveal-answer':
      revealAnswer();
      break;
    case 'accept-challenge':
      window.acceptChallenge();
      break;
    case 'skip-challenge':
      closeResultModal();
      // 도전 거절 시에도 정상 결과 모달
      const s = window.SESSION;
      const p = s?.problems?.[s.index];
      showResultModal({result:'correct'}, 0, 0, p);
      break;
    case 'save-reflection':
      window.saveReflection(false);
      break;
    case 'skip-reflection':
      window.saveReflection(true);
      break;
  }
}

// ============ Service Worker 등록 ============
function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  // localhost나 file://에선 SW 등록 안 함 (개발 편의)
  if (location.protocol === 'file:') return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        console.log('[App] SW 등록됨');

        // 새 버전 감지
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            // 새 SW가 설치되었고, 기존 SW가 이미 있으면 = 업데이트 가능
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdateAvailable(newWorker);
            }
          });
        });

        // 1시간마다 업데이트 체크
        setInterval(() => reg.update(), 60 * 60 * 1000);
      })
      .catch(err => console.warn('[App] SW 등록 실패:', err.message));

    // SW가 새 버전으로 교체되면 페이지 자동 새로고침
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

// 업데이트 알림 모달
function showUpdateAvailable(newWorker) {
  // 학습 중에는 방해 X — SESSION 진행 중이면 다음 진입 때까지 미룸
  if (window.SESSION) {
    setTimeout(() => showUpdateAvailable(newWorker), 30 * 1000);
    return;
  }

  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  content.innerHTML = `
    <div class="result-icon" style="background: linear-gradient(135deg, var(--rb-cyan), var(--rb-blue));">
      <i class="icon">system_update</i>
    </div>
    <h2>새 버전이 있어요!</h2>
    <p>새로운 기능이나 개선사항이 추가되었어요.<br>지금 업데이트할까요?</p>
    <div class="modal-btns">
      <button class="btn btn-ghost" data-action="close-modal">나중에</button>
      <button class="btn btn-blue btn-big" id="apply-update"><i class="icon">refresh</i> 업데이트!</button>
    </div>
  `;
  modal.classList.add('active');

  document.getElementById('apply-update')?.addEventListener('click', () => {
    closeResultModal();
    newWorker.postMessage({ type: 'SKIP_WAITING' });
    // controllerchange 이벤트가 페이지 자동 새로고침 처리
  });
}

// ============ 초기화 ============
function boot() {
  window.initCanvas();
  registerServiceWorker();

  // 모바일 더블탭 줌 방지 (버튼/카드 위에서는 제외)
  let lastTouch = 0;
  document.addEventListener('touchend', e => {
    if (e.target.closest('button, input, textarea, .pin-key, .tool-btn, .stroke-dot, .unit-card, .review-item, .thinking-log-item, .conf-btn, .result-cell')) return;
    const now = Date.now();
    if (now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

  // PWA 앱 모드인지 감지 (홈에 추가해서 실행한 경우)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        window.navigator.standalone === true;
  if (isStandalone) {
    document.body.classList.add('pwa-mode');
  }

  // iOS Safari + 브라우저 모드면 "홈에 추가" 안내 (24시간에 한 번만)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
  if (isIOS && isSafari && !isStandalone) {
    const lastShown = parseInt(localStorage.getItem('pwa_hint_shown') || '0');
    if (Date.now() - lastShown > 24 * 60 * 60 * 1000) {
      setTimeout(showAddToHomeHint, 1500);
      localStorage.setItem('pwa_hint_shown', String(Date.now()));
    }
  }

  const state = window.MATHLAND_STATE;
  if (state.totalSolved > 0 || state.diagnosticDone) {
    window.show('home-screen');
  } else {
    window.show('start-screen');
  }
  window.saveState();
}

// "홈 화면에 추가" 안내 모달
function showAddToHomeHint() {
  const modal = document.getElementById('result-modal');
  const content = document.getElementById('result-modal-content');
  content.innerHTML = `
    <div class="result-icon" style="background: linear-gradient(135deg, var(--rb-cyan), var(--rb-blue));">
      <i class="icon">add_to_home_screen</i>
    </div>
    <h2>홈 화면에 추가해요!</h2>
    <p style="margin: 0 0 16px;">
      더 큰 화면으로 편하게 쓸 수 있어요.<br>
      <b>앱처럼 실행</b>되고 사파리 주소창도 안 보여요!
    </p>
    <div style="background: var(--paper-soft); border: 3px solid var(--ink); border-radius: 12px; padding: 14px; margin-bottom: 14px; text-align: left; box-shadow: 0 3px 0 var(--ink);">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="background: var(--rb-blue); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">1</span>
        <span style="font-size: 14px; font-weight: 700;">하단의 <i class="icon" style="font-size: 18px; vertical-align: -3px;">ios_share</i> 공유 버튼을 눌러요</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="background: var(--rb-blue); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">2</span>
        <span style="font-size: 14px; font-weight: 700;">"홈 화면에 추가"를 선택해요</span>
      </div>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="background: var(--rb-blue); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px;">3</span>
        <span style="font-size: 14px; font-weight: 700;">"추가" 버튼을 누르면 끝!</span>
      </div>
    </div>
    <div class="modal-btns">
      <button class="btn btn-blue btn-big" data-action="close-modal">알겠어요</button>
    </div>
  `;
  modal.classList.add('active');
}

// DOM 준비된 후 부팅
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

console.log('[MATHLAND] app 모듈 로드');
