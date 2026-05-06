// js/scoring.js
// 모의 AI 채점.
// - numeric 답안: 정답률 시뮬레이션 (실제 출시 시 Mathpix/ML Kit 연동)
// - memo 답안: 항상 검수 큐로 (사람이 봐야 함)
//
// 실제 출시 시 이 모듈만 갈아끼우면 됨.

window.scoreAnswer = function(problem, hasDrawing) {
  // 아무것도 안 그렸으면 무조건 오답
  if (!hasDrawing) {
    return { result: 'wrong', confidence: 1.0, aiAnswer: '(빈 답)' };
  }

  // 메모형(논술/창의)은 일정 확률로 검수 큐로
  if (problem.answerType === 'memo') {
    const r = Math.random();
    if (r < 0.5) return { result: 'review', confidence: 0.5, aiAnswer: '검수 필요 (논술형)' };
    if (r < 0.85) return { result: 'correct', confidence: 0.7, aiAnswer: '논술 응답 인식됨' };
    return { result: 'wrong', confidence: 0.6, aiAnswer: '응답 부족' };
  }

  // 숫자형: 70% 정답, 20% 오답, 10% 검수
  const r = Math.random();
  if (r < 0.7) return { result: 'correct', confidence: 0.95, aiAnswer: problem.answer };
  if (r < 0.9) return { result: 'wrong', confidence: 0.88, aiAnswer: '오답으로 보임' };
  return { result: 'review', confidence: 0.55, aiAnswer: problem.answer + ' (?)' };
};

console.log('[MATHLAND] scoring 모듈 로드');
