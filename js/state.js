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

  // 현재 선택된 학습 컨텍스트 (자기주도 학습)
  currentSubject: 'math',
  currentGrade: 5,

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

  // 주간 학습 계획 (자기주도)
  // { weekStart: 'YYYY-MM-DD', goalUnits: [unitId], targetSessions: N, doneSessions: N }
  weeklyPlan: null,

  // 단원별 최근 시도 기록 (막혔을 때 감지용)
  // { unitId: { attempts: N, wrong: N } }
  unitStruggle: {},

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

// 헬퍼: 단원별 약점 찾기 (현재 과목/학년 안에서)
window.findWeakestUnit = function() {
  const st = window.MATHLAND_STATE;
  const subj = st.currentSubject || 'math';
  const grade = st.currentGrade || 5;
  const units = (window.MATHLAND_UNITS || []).filter(u =>
    (u.subject || 'math') === subj && u.grade === grade
  );
  if (units.length === 0) return window.MATHLAND_UNITS[0];
  if (!st.diagnosticDone) return units[0];
  return units.reduce((min, u) => {
    const m = st.unitMastery[u.id] ?? 0;
    return (m < (st.unitMastery[min.id] ?? 0)) ? u : min;
  }, units[0]);
};

// 이번 주 월요일 날짜 (YYYY-MM-DD) — 주간 계획 기준
window.getWeekStart = function() {
  const now = new Date();
  const day = now.getDay(); // 0(일)~6(토)
  const diff = (day === 0 ? -6 : 1 - day); // 월요일로
  const mon = new Date(now);
  mon.setDate(now.getDate() + diff);
  const y = mon.getFullYear();
  const m = String(mon.getMonth() + 1).padStart(2, '0');
  const d = String(mon.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// 현재 유효한 주간 계획 가져오기 (지난 주 거면 만료 처리)
window.getActivePlan = function() {
  const st = window.MATHLAND_STATE;
  const wk = window.getWeekStart();
  if (st.weeklyPlan && st.weeklyPlan.weekStart === wk) return st.weeklyPlan;
  return null; // 없거나 만료됨
};

// 막힘 기록 업데이트 (세션 채점 후 호출)
window.recordStruggle = function(unitId, attempts, wrong) {
  const st = window.MATHLAND_STATE;
  if (!st.unitStruggle) st.unitStruggle = {};
  const cur = st.unitStruggle[unitId] || { attempts: 0, wrong: 0 };
  cur.attempts += attempts;
  cur.wrong += wrong;
  st.unitStruggle[unitId] = cur;
  window.saveState();
};

// 막힘 여부 판단: 최근 시도에서 틀린 비율이 높으면 true
window.isStruggling = function(unitId) {
  const st = window.MATHLAND_STATE;
  const s = (st.unitStruggle || {})[unitId];
  if (!s || s.attempts < 4) return false; // 최소 4번은 해봐야
  return (s.wrong / s.attempts) >= 0.6; // 60% 이상 틀림
};

console.log('[MATHLAND] state 로드 완료');
