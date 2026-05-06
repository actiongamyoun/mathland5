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

  // 진행 점
  const prog = document.getElementById('problem-progress');
  prog.innerHTML = '';
  for (let i = 0; i < s.problems.length; i++) {
    const d = document.createElement('div');
    d.className = 'dot';
    if (i < s.index) {
      d.classList.add(s.results[i] === 'correct' ? 'done' : (s.results[i] === 'wrong' ? 'wrong' : 'done'));
    }
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
  const score = window.scoreAnswer(p, window.hasDrawing());
  s.results.push(score.result);

  const state = window.MATHLAND_STATE;

  // 단원 마스터리 업데이트
  const unitId = p.id.split('-')[0];
  if (state.unitMastery[unitId] === undefined) state.unitMastery[unitId] = 50;
  if (score.result === 'correct') state.unitMastery[unitId] = Math.min(100, state.unitMastery[unitId] + 8);
  else if (score.result === 'wrong') state.unitMastery[unitId] = Math.max(0, state.unitMastery[unitId] - 4);

  state.todaySolved++;
  state.totalSolved++;
  if (score.result === 'correct') state.todayCorrect++;

  // 푼 문제 기록 (중복 회피용)
  window.recordSolved(p.id);

  // 검수 큐
  if (score.result === 'review') {
    state.reviewQueue.push({
      id: Date.now() + Math.random(),
      problemId: p.id,
      eq: p.eq, answer: p.answer,
      aiGuess: score.aiAnswer, confidence: score.confidence,
      unit: unitId, ts: new Date().toISOString()
    });
  }

  // 보상
  let coins = 0, gems = 0;
  if (score.result === 'correct') {
    coins = 10 + (s.isDiagnostic ? 5 : 0) + (p.level >= 3 ? 5 : 0);  // 분석/창의는 보상 더
    if (Math.random() < 0.2) gems = 1;
    state.coins += coins;
    state.gems += gems;
    state.player.exp += (5 + p.level * 3);
    if (state.player.exp >= state.player.level * 50) {
      state.player.level++;
      state.player.exp = 0;
    }
    state.unlockedItems = Math.min(20, Math.floor(state.totalSolved));
  }

  window.saveState();

  // 분기:
  // 1) 정답 + 분석/창의 문제(메타질문 있음) → 사고 모달
  // 2) 정답 + 도전 가능 → 도전 모달
  // 3) 정답 + 일반 → 결과 모달
  // 4) 오답 → 결과 모달 (틀릴 때 "왜 그렇게 생각했어?" 묻기)
  // 5) 검수 → 결과 모달 (다음 문제로)

  if (score.result === 'correct') {
    spawnFloatingCoins(coins);
    spawnConfetti();
    if (p.metaQuestion) {
      // 메타 질문이 있으면 먼저 묻기
      showThinkingModal({
        title: '잘 풀었어! 한 가지 더 물어봐도 돼?',
        question: p.metaQuestion,
        problemId: p.id, eq: p.eq, level: p.level, unit: unitId,
        onDone: () => {
          if (window.shouldShowChallenge()) showChallenge();
          else showResultModal(score, coins, gems, p);
        }
      });
      return;
    }
    if (window.shouldShowChallenge()) {
      showChallenge();
      return;
    }
    showResultModal(score, coins, gems, p);
    return;
  }

  if (score.result === 'wrong') {
    // 오답이면 사고 질문 — 선생님 강조 사항: "왜 그렇게 생각했어?"
    showThinkingModal({
      title: '괜찮아! 한번 같이 들여다볼까?',
      question: '왜 그렇게 풀어야 한다고 생각했어? 적어보면 다음에 더 잘 풀 수 있어.',
      problemId: p.id, eq: p.eq, level: p.level, unit: unitId,
      onDone: () => showResultModal(score, coins, gems, p),
    });
    return;
  }

  showResultModal(score, coins, gems, p);
}

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

// ============ 세션 종료 → 회고 화면 ============
function endSession() {
  const s = window.SESSION;
  if (!s) return;
  const correctCount = s.results.filter(r => r === 'correct').length;
  const total = s.results.length;

  if (s.isDiagnostic) {
    window.MATHLAND_STATE.diagnosticDone = true;
    window.saveState();
  }

  closeResultModal();

  // 진단평가는 회고 없이 바로 결과
  if (s.isDiagnostic) {
    showFinalSummary(correctCount, total, true);
    return;
  }

  // 오늘 회고가 이미 있으면 건너뛰고 결과만
  const todayDone = window.MATHLAND_STATE.reflections.find(r => r.date === window.todayKey());
  if (todayDone) {
    showFinalSummary(correctCount, total, false);
    return;
  }

  // 회고 화면
  showReflectionScreen(correctCount, total);
}

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
    if (e.target.closest('button, input, textarea, .pin-key, .tool-btn, .stroke-dot, .unit-card, .review-item, .thinking-log-item')) return;
    const now = Date.now();
    if (now - lastTouch <= 300) e.preventDefault();
    lastTouch = now;
  }, { passive: false });

  const state = window.MATHLAND_STATE;
  if (state.totalSolved > 0 || state.diagnosticDone) {
    window.show('home-screen');
  } else {
    window.show('start-screen');
  }
  window.saveState();
}

// DOM 준비된 후 부팅
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

console.log('[MATHLAND] app 모듈 로드');
