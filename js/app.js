// js/app.js
// 화면 전환, UI 렌더링, 학습 흐름 컨트롤러

// ============ 화면 전환 ============
window.show = function(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  if (!target) return;
  target.classList.add('active');
  if (screenId === 'home-screen') refreshHome();
  if (screenId === 'unit-select-screen') refreshUnitSelect();
  if (screenId === 'parent-screen') window.refreshParent();
  if (screenId === 'problem-screen') {
    requestAnimationFrame(() => requestAnimationFrame(window.resizeCanvas));
  }
};

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

// ============ 단원 선택 ============
function refreshUnitSelect() {
  const state = window.MATHLAND_STATE;
  const grid = document.getElementById('unit-grid');
  grid.innerHTML = '';
  window.MATHLAND_UNITS.forEach((u, idx) => {
    const mastery = state.unitMastery[u.id] || 0;
    let levelText, levelClass;
    if (mastery < 30)      { levelText = '쉬움'; levelClass = 'easy'; }
    else if (mastery < 70) { levelText = '보통'; levelClass = 'mid'; }
    else                   { levelText = '심화'; levelClass = 'hard'; }

    // 문제 수 표시 (문제 부족한 단원 안내용)
    const probCount = window.MATHLAND_PROBLEMS_ALL.filter(p => p.id.startsWith(u.id+'-')).length;
    const isReady = probCount >= 13; // 한 세션 분량

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

  // 진행 점 (정답/오답 안 보이게 — 푼 것만 표시)
  const prog = document.getElementById('problem-progress');
  prog.innerHTML = '';
  for (let i = 0; i < s.problems.length; i++) {
    const d = document.createElement('div');
    d.className = 'dot';
    if (i < s.index) d.classList.add('done');     // 푼 문제 (색은 회색→초록)
    if (i === s.index) d.classList.add('current');
    prog.appendChild(d);
  }

  document.getElementById('coin-mini').textContent = window.MATHLAND_STATE.coins;
  window.clearCanvas();
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

  // 채점은 나중에 (세션 끝). 지금은 자신감 체크만.
  showConfidenceModal(p);
}

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
  if (s.index >= s.problems.length) endSession();
  else loadCurrentProblem();
}

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
      window.show('unit-select-screen');
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

// ============ 초기화 ============
function boot() {
  window.initCanvas();

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
