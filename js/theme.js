// js/theme.js
// 라이트/다크 테마 관리
// 우선순위: 사용자가 수동 설정한 값 > 기기 설정(prefers-color-scheme)

const THEME_KEY = 'mathland5_theme';  // 'light' | 'dark' | null(=기기 따라감)

window.getEffectiveTheme = function() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  // 저장값 없으면 기기 설정
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

window.applyTheme = function(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  // 테마 토글 버튼 아이콘 갱신
  document.querySelectorAll('.theme-toggle .icon').forEach(el => {
    el.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
  });
  // 상태바 색 (PWA)
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f1320' : '#1cb0f6');
};

// 토글: light <-> dark (수동 설정으로 저장)
window.toggleTheme = function() {
  const cur = document.documentElement.getAttribute('data-theme') || window.getEffectiveTheme();
  const next = cur === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  window.applyTheme(next);
};

// 초기화 (앱 부팅 시 호출)
window.initTheme = function() {
  window.applyTheme(window.getEffectiveTheme());
  // 기기 설정 변경 실시간 반영 (사용자가 수동 설정 안 한 경우만)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (!localStorage.getItem(THEME_KEY)) {
      window.applyTheme(e.matches ? 'dark' : 'light');
    }
  });
};

// FOUC 방지: 즉시 적용 (DOM 준비 전에도)
(function() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    const t = (saved === 'light' || saved === 'dark') ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', t);
  } catch (e) {}
})();

console.log('[MATHLAND] theme 로드');
