// js/coach.js
// 앱에서 서버(/api/coach)를 통해 마리의 AI 코칭 멘트를 받아온다.
// API 실패 시에도 앱이 멈추지 않도록 폴백 멘트를 제공.

// 폴백 멘트 (API 안 될 때, 또는 로컬 file:// 환경)
const FALLBACK = {
  plan: [
    '오늘은 어떤 걸 공부하고 싶어? 약한 단원부터 차근차근 해보자!',
    '한 단원씩 천천히 도전해보자. 무리하지 않아도 괜찮아 😊',
  ],
  stuck: [
    '괜찮아, 틀려도 돼! 잠깐 쉬었다가 다시 해볼까?',
    '천천히 해도 돼. 어려운 건 원래 시간이 좀 걸리는 거야 🌱',
  ],
  default: ['오늘도 같이 해보자! 화이팅 😊'],
};

function pickFallback(type) {
  const arr = FALLBACK[type] || FALLBACK.default;
  return arr[Math.floor(Math.random() * arr.length)];
}

// 코칭 요청 — Promise<string> 반환 (항상 성공, 실패 시 폴백)
window.getCoaching = async function(type, payload) {
  // 로컬 파일 환경에선 API 없음 → 폴백
  if (location.protocol === 'file:') {
    return pickFallback(type);
  }
  try {
    const r = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, payload }),
    });
    if (!r.ok) throw new Error('coach api ' + r.status);
    const data = await r.json();
    return (data && data.message) ? data.message : pickFallback(type);
  } catch (e) {
    console.warn('[coach] 폴백 사용:', e.message);
    return pickFallback(type);
  }
};

console.log('[MATHLAND] coach 로드');
