// js/state.js
// 전역 앱 상태 + localStorage 관리

const STORAGE_KEY = 'mathland5_state_v3';

const initialState = {
  player: { level: 1, exp: 0 },
  coins: 0,
  gems: 0,
  unitMastery: {},        // { unitId: 0~100 }
  unlockedItems: 0,
  todaySolved: 0,
  todayCorrect: 0,
  totalSolved: 0,
  diagnosticDone: false,

  // AI 검수 큐 (부모 검수 대기)
  reviewQueue: [],

  // 사고 과정 로그 — 부모 대시보드에서 보여주는 핵심 자산
  // [{ id, problemId, eq, level, childThought, ts, unit }]
  thinkingLog: [],

  // 푼 문제 기록 (중복 회피용)
  // { problemId: lastSolvedTimestamp }
  solvedHistory: {},

  // 오늘의 회고 (1일 1개)
  reflections: [], // [{ date: 'YYYY-MM-DD', text, learned, harder }]

  // 현재 학습 세션 (저장 안 함)
  session: null,
};

window.MATHLAND_STATE = loadState();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(initialState);
    const parsed = JSON.parse(raw);
    // 기본값 머지 (구버전 호환)
    return { ...structuredClone(initialState), ...parsed, session: null };
  } catch {
    return structuredClone(initialState);
  }
}

window.saveState = function() {
  try {
    const toSave = { ...window.MATHLAND_STATE, session: null };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('saveState failed', e);
  }
};

window.resetState = function() {
  window.MATHLAND_STATE = structuredClone(initialState);
  window.saveState();
};

// 헬퍼: 오늘 날짜 (YYYY-MM-DD)
window.todayKey = function() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
};

// 헬퍼: 단원별 약점 찾기
window.findWeakestUnit = function() {
  const units = window.MATHLAND_UNITS;
  if (!window.MATHLAND_STATE.diagnosticDone) return units[0];
  return units.reduce((min, u) => {
    const m = window.MATHLAND_STATE.unitMastery[u.id] ?? 0;
    return (m < (window.MATHLAND_STATE.unitMastery[min.id] ?? 0)) ? u : min;
  }, units[0]);
};

console.log('[MATHLAND] state 로드 완료');
