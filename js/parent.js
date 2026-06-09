// js/parent.js
// 부모 대시보드 + PIN 입력

const PARENT_PIN = '1111';
let pinInput = '';

window.handlePinKey = function(key) {
  if (key === 'del') pinInput = pinInput.slice(0, -1);
  else if (pinInput.length < 4) pinInput += key;

  document.querySelectorAll('#parent-pin-screen .pin-dot').forEach((d, i) => {
    d.classList.toggle('filled', i < pinInput.length);
  });
  document.getElementById('pin-error').textContent = '';

  if (pinInput.length === 4) {
    if (pinInput === PARENT_PIN) {
      pinInput = '';
      document.querySelectorAll('#parent-pin-screen .pin-dot').forEach(d => d.classList.remove('filled'));
      window.show('parent-screen');
    } else {
      document.getElementById('pin-error').textContent = '비밀번호가 맞지 않아요';
      pinInput = '';
      setTimeout(() => {
        document.querySelectorAll('#parent-pin-screen .pin-dot').forEach(d => d.classList.remove('filled'));
      }, 300);
    }
  }
};

window.resetPin = function() {
  pinInput = '';
  const errEl = document.getElementById('pin-error');
  if (errEl) errEl.textContent = '';
  document.querySelectorAll('#parent-pin-screen .pin-dot').forEach(d => d.classList.remove('filled'));
};

window.refreshParent = function() {
  const state = window.MATHLAND_STATE;

  // 아이 정보 입력칸 채우기
  const nameInput = document.getElementById('parent-child-name');
  if (nameInput) nameInput.value = state.childName || '';
  window._parentGrade = state.currentGrade || 5;
  document.querySelectorAll('.child-grade-btn').forEach(b => {
    b.classList.toggle('selected', parseInt(b.dataset.pgrade) === (state.currentGrade || 5));
  });

  document.getElementById('dash-today').textContent = state.todaySolved + '개';
  document.getElementById('dash-rate').textContent =
    state.todaySolved > 0 ? Math.round(state.todayCorrect/state.todaySolved*100) + '%' : '-';
  document.getElementById('dash-total').textContent = state.totalSolved + '개';
  document.getElementById('dash-level').textContent = state.player.level;
  document.getElementById('dash-review-count').textContent = state.reviewQueue.length + '건';

  // 검수 큐
  const list = document.getElementById('review-list-content');
  document.getElementById('review-badge').textContent = state.reviewQueue.length;
  if (state.reviewQueue.length === 0) {
    list.innerHTML = `<p style="color: var(--ink-soft); font-size: 14px; margin: 0;">검수할 항목이 없습니다 👍</p>`;
  } else {
    list.innerHTML = '';
    state.reviewQueue.forEach(item => {
      const unit = window.MATHLAND_UNITS.find(u => u.id === item.unit);
      const div = document.createElement('div');
      div.className = 'review-item';
      div.innerHTML = `
        <div class="equation">
          ${escapeHtml(item.eq)} <br><span style="font-size:12px;color:var(--ink-soft);">정답: ${escapeHtml(item.answer)}</span>
          <div class="ai-guess">${unit?.name || ''} · AI 판정: ${escapeHtml(item.aiGuess)} (확신 ${Math.round(item.confidence*100)}%)</div>
        </div>
        <div class="actions">
          <button class="mini-btn correct" data-review-id="${item.id}" data-judge="correct"><i class="icon">check</i></button>
          <button class="mini-btn wrong" data-review-id="${item.id}" data-judge="wrong"><i class="icon">close</i></button>
        </div>
      `;
      list.appendChild(div);
    });
  }

  // 사고 과정 로그 (선생님이 강조하신 부분 - 부모가 아이 사고 흐름을 본다)
  const tlog = document.getElementById('thinking-log-content');
  const tBadge = document.getElementById('thinking-badge');
  if (tlog && tBadge) {
    tBadge.textContent = state.thinkingLog.length;
    if (state.thinkingLog.length === 0) {
      tlog.innerHTML = `<p style="color: var(--ink-soft); font-size: 14px; margin: 0;">아직 아이의 사고 기록이 없어요. 분석·창의 문제를 풀면 여기에 쌓입니다.</p>`;
    } else {
      tlog.innerHTML = '';
      // 최근 10개만
      const recent = state.thinkingLog.slice(-10).reverse();
      recent.forEach(item => {
        const unit = window.MATHLAND_UNITS.find(u => u.id === item.unit);
        const dt = new Date(item.ts);
        const div = document.createElement('div');
        div.className = 'thinking-log-item';
        div.style.flexDirection = 'column';
        div.innerHTML = `
          <div class="equation" style="width:100%">
            ${escapeHtml(item.eq)}
            <div class="meta">${unit?.name || ''} · 단계 ${item.level} · ${dt.toLocaleString('ko-KR', {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</div>
            <div class="meta" style="color: var(--rb-purple); font-weight: 700; margin-top: 4px;">Q. ${escapeHtml(item.question)}</div>
            <div class="child-thought">"${escapeHtml(item.childThought)}"</div>
          </div>
        `;
        tlog.appendChild(div);
      });
    }
  }

  // 회고 (오늘의 메타인지)
  const rlog = document.getElementById('reflection-log-content');
  if (rlog) {
    if (!state.reflections || state.reflections.length === 0) {
      rlog.innerHTML = `<p style="color: var(--ink-soft); font-size: 14px; margin: 0;">아직 회고 기록이 없어요. 학습 세션 마지막에 작성됩니다.</p>`;
    } else {
      rlog.innerHTML = '';
      const recent = state.reflections.slice(-7).reverse();
      recent.forEach(r => {
        const div = document.createElement('div');
        div.className = 'thinking-log-item';
        div.style.flexDirection = 'column';
        div.innerHTML = `
          <div class="equation" style="width:100%">
            <strong style="color: var(--rb-blue);">${r.date}</strong>
            ${r.learned ? `<div style="margin-top:6px;"><span style="font-weight:700;color:var(--rb-green);">알게 된 것:</span> ${escapeHtml(r.learned)}</div>` : ''}
            ${r.harder ? `<div style="margin-top:4px;"><span style="font-weight:700;color:var(--rb-orange);">어려웠던 것:</span> ${escapeHtml(r.harder)}</div>` : ''}
          </div>
        `;
        rlog.appendChild(div);
      });
    }
  }

  // 단원별 진행도
  const upc = document.getElementById('unit-progress-content');
  upc.innerHTML = '';
  window.MATHLAND_UNITS.forEach(u => {
    const m = state.unitMastery[u.id] ?? 0;
    let barColor;
    if (m < 30) barColor = 'var(--rb-red)';
    else if (m < 70) barColor = 'var(--rb-yellow)';
    else barColor = 'var(--rb-green)';
    const row = document.createElement('div');
    row.className = 'unit-row';
    row.innerHTML = `
      <div class="ui-icon" style="background: ${u.color}"><i class="icon">${u.icon}</i></div>
      <div class="name">${u.name}</div>
      <div class="bar-wrap"><div class="bar" style="width: ${m}%; background: ${barColor}"></div></div>
      <div class="pct">${m}%</div>
    `;
    upc.appendChild(row);
  });
};

window.handleReviewJudge = function(id, judge) {
  const state = window.MATHLAND_STATE;
  const item = state.reviewQueue.find(r => String(r.id) === id);
  if (!item) return;
  const unit = item.unit;
  if (state.unitMastery[unit] === undefined) state.unitMastery[unit] = 50;
  if (judge === 'correct') state.unitMastery[unit] = Math.min(100, state.unitMastery[unit] + 8);
  else state.unitMastery[unit] = Math.max(0, state.unitMastery[unit] - 4);
  state.reviewQueue = state.reviewQueue.filter(r => String(r.id) !== id);
  window.saveState();
  window.refreshParent();
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

console.log('[MATHLAND] parent 모듈 로드');
