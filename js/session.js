// js/session.js
// 학습 세션 관리: 문제 출제, 진행 흐름, 도전 문제 등장 로직
//
// === 출제 원칙 ===
// 1. 한 세션 = 단원당 약 13문제 (20분 분량)
//    - 단계 1: 3문제 (이해)
//    - 단계 2: 4문제 (적용)
//    - 단계 3: 3문제 (분석)
//    - 단계 4: 2문제 (창의)
//    - +1 메타인지 회고
// 2. 중복 회피: 최근 7일 안에 푼 문제는 우선순위 낮춤 (7일 지나면 다시 등장 OK)
// 3. 도전 문제 ("다른 방법으로?"): 3번째 턴 이후, 정답률 80% 이상일 때만 등장
//
// 진단평가는 별도 — 단원당 1문제씩 (단계 2 적용 문제 위주)

window.SESSION = {
  isDiagnostic: false,
  problems: [],          // 출제된 문제 배열
  index: 0,              // 현재 문제 인덱스
  results: [],           // 'correct' | 'wrong' | 'review'
  hintLevel: 0,
  thinkingAnswers: [],   // 문제별 사고 답변
  challengePresented: false,  // 이번 세션에 도전 문제를 제시했는지
};

// 7일 (밀리초)
const REPEAT_BLOCK_MS = 7 * 24 * 60 * 60 * 1000;

// 단원과 인지단계로 문제 풀에서 N개 뽑기 (중복 회피)
function pickProblems(unitId, level, count) {
  const all = window.MATHLAND_PROBLEMS_ALL.filter(
    p => p.id.startsWith(unitId + '-') && p.level === level
  );
  if (all.length === 0) return [];

  const now = Date.now();
  const history = window.MATHLAND_STATE.solvedHistory || {};

  // 최근 7일 내 푼 문제는 후순위
  const fresh = all.filter(p => !history[p.id] || (now - history[p.id]) > REPEAT_BLOCK_MS);
  const stale = all.filter(p => history[p.id] && (now - history[p.id]) <= REPEAT_BLOCK_MS);

  // 셔플
  const shuffled = [...fresh.sort(() => Math.random() - 0.5),
                    ...stale.sort(() => Math.random() - 0.5)];
  return shuffled.slice(0, count);
}

// 단원 학습 세션 시작 (단원별 13문제 균형 출제)
window.startUnitSession = function(unitId) {
  const dist = [
    { level: 1, count: 3 },  // 이해
    { level: 2, count: 4 },  // 적용
    { level: 3, count: 3 },  // 분석
    { level: 4, count: 2 },  // 창의
  ];
  let problems = [];
  dist.forEach(d => {
    problems = problems.concat(pickProblems(unitId, d.level, d.count));
  });

  // 단원에 충분한 문제가 없으면 (placeholder 단원처럼) 있는 만큼만
  if (problems.length === 0) {
    alert('이 단원은 아직 준비 중이에요. 다른 단원을 골라줘!');
    return false;
  }

  window.SESSION = {
    isDiagnostic: false,
    unitId,
    problems,
    index: 0, results: [],
    hintLevel: 0, thinkingAnswers: [],
    challengePresented: false,
  };
  return true;
};

// 진단평가 시작 (단원당 1문제, 단계 2 위주)
window.startDiagnostic = function() {
  const problems = [];
  window.MATHLAND_UNITS.forEach(u => {
    const candidates = window.MATHLAND_PROBLEMS_ALL.filter(
      p => p.id.startsWith(u.id + '-') && (p.level === 2 || p.level === 1)
    );
    if (candidates.length > 0) {
      problems.push(candidates[Math.floor(Math.random() * candidates.length)]);
    }
  });
  if (problems.length === 0) return false;

  window.SESSION = {
    isDiagnostic: true,
    problems, index: 0, results: [],
    hintLevel: 0, thinkingAnswers: [],
    challengePresented: false,
  };
  return true;
};

// AI 추천 (약점 단원 학습)
window.startAIRecommend = function() {
  const w = window.findWeakestUnit();
  return window.startUnitSession(w.id);
};

// 도전 문제를 지금 띄울지 결정
//  - 3번째 턴 이후
//  - 한 세션에 한 번만
//  - 현재 문제에 challenge 정의가 있어야 함
//  - 이번 문제를 정답으로 풀었을 때만
window.shouldShowChallenge = function() {
  const s = window.SESSION;
  if (!s) return false;
  if (s.challengePresented) return false;
  if (s.index < 2) return false;  // 0, 1, 2 → 즉 3번째 (인덱스 2) 이후
  const p = s.problems[s.index];
  if (!p || !p.challenge) return false;
  if (s.results[s.index] !== 'correct') return false;
  return true;
};

window.markChallengePresented = function() {
  window.SESSION.challengePresented = true;
};

// 푼 문제 히스토리 갱신
window.recordSolved = function(problemId) {
  if (!window.MATHLAND_STATE.solvedHistory) window.MATHLAND_STATE.solvedHistory = {};
  window.MATHLAND_STATE.solvedHistory[problemId] = Date.now();
};

console.log('[MATHLAND] session 모듈 로드');
