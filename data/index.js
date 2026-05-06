// 전체 문제 통합
// 각 단원 파일이 먼저 로드되어야 함 (script 순서로 보장)

window.MATHLAND_PROBLEMS_ALL = [
  ...(window.MATHLAND_PROBLEMS_MIX  || []),
  ...(window.MATHLAND_PROBLEMS_DIV  || []),
  ...(window.MATHLAND_PROBLEMS_RULE || []),
  ...(window.MATHLAND_PROBLEMS_FRAC || []),
  ...(window.MATHLAND_PROBLEMS_MULT || []),
  ...(window.MATHLAND_PROBLEMS_AREA || []),
];

// 단원 ID에서 문제 배열을 가져오는 헬퍼
window.getProblemsByUnit = function(unitId) {
  return window.MATHLAND_PROBLEMS_ALL.filter(p => p.id.startsWith(unitId + '-'));
};

// 단원 + 인지 단계로 필터링
window.getProblemsByUnitAndLevel = function(unitId, level) {
  return window.MATHLAND_PROBLEMS_ALL.filter(
    p => p.id.startsWith(unitId + '-') && p.level === level
  );
};

console.log(`[MATHLAND] 문제 ${window.MATHLAND_PROBLEMS_ALL.length}개 로드됨`);
