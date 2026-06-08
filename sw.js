// MATHLAND 5 — Service Worker
// 역할:
//   1. 앱 자원(HTML/CSS/JS/이미지) 캐시 → 빠른 재접속, 오프라인 지원
//   2. 새 버전 배포 시 자동 갱신 (사용자에게 새로고침 안내)
//
// 캐시 전략:
//   - HTML(index.html): Network-first (네트워크 우선, 실패 시 캐시)
//     → 새 코드를 빨리 받아오기 위함
//   - 그 외 정적 자산: Cache-first (캐시 우선, 캐시에 없으면 네트워크)
//     → 빠른 로딩
//
// 버전 변경 시: CACHE_VERSION 숫자만 올리면 옛 캐시 자동 삭제됨

const CACHE_VERSION = 'v6';
const CACHE_NAME = `mathland5-${CACHE_VERSION}`;

// 설치 시 미리 캐시할 핵심 자산
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './landing.html',
  './manifest.json',
  './css/styles.css',
  './js/theme.js',
  './js/mascot.js',
  './js/state.js',
  './js/canvas.js',
  './js/scoring.js',
  './js/session.js',
  './js/parent.js',
  './js/app.js',
  './data/subjects.js',
  './data/units.js',
  './data/problems_mix.js',
  './data/problems_div.js',
  './data/problems_rule.js',
  './data/problems_frac.js',
  './data/problems_mult.js',
  './data/problems_area.js',
  './data/index.js',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  './favicon-32.png',
];

// ============ 설치 ============
self.addEventListener('install', event => {
  console.log('[SW] 설치 중...', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // 핵심 자산 미리 캐시 (실패해도 진행)
        return Promise.allSettled(
          PRECACHE_ASSETS.map(url => cache.add(url).catch(err => {
            console.warn('[SW] 캐시 실패:', url, err.message);
          }))
        );
      })
      .then(() => self.skipWaiting())  // 새 SW 즉시 활성화
  );
});

// ============ 활성화 (옛날 캐시 정리) ============
self.addEventListener('activate', event => {
  console.log('[SW] 활성화', CACHE_VERSION);
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names
          .filter(name => name.startsWith('mathland5-') && name !== CACHE_NAME)
          .map(name => {
            console.log('[SW] 옛 캐시 삭제:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())  // 모든 탭에 즉시 적용
  );
});

// ============ 요청 가로채기 ============
self.addEventListener('fetch', event => {
  const req = event.request;

  // GET이 아닌 요청은 무시
  if (req.method !== 'GET') return;

  // 같은 출처 요청만 캐시 (외부 폰트/CDN은 브라우저 캐시에 맡김)
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // HTML 요청 → Network-first (새 코드 우선)
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          // 받아온 HTML을 캐시에 저장 (오프라인 대비)
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return res;
        })
        .catch(() => caches.match(req).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // 그 외(JS/CSS/이미지) → Cache-first (빠른 로딩)
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) {
        // 백그라운드에서 새 버전도 받아옴 (다음 접속 시 신선한 자원 사용)
        fetch(req).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
        }).catch(() => {/* 오프라인이면 무시 */});
        return cached;
      }
      // 캐시에 없으면 네트워크에서 받고 캐시에 저장
      return fetch(req).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      });
    })
  );
});

// ============ 메시지 (수동 캐시 갱신용) ============
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
