// MATHLAND 5 — Service Worker v7
// 역할: 정적 자원 캐시(빠른 로딩/오프라인) + 새 버전 자동 갱신
//
// ★ v7 핵심 수정: navigate(페이지 이동) 요청은 항상 네트워크 그대로 사용.
//   루트(/)=랜딩, /index.html=앱 을 SW가 절대 서로 덮어쓰지 않게 함.
//   (이전 버전이 루트를 캐시된 index.html로 바꿔버리던 문제 해결)

const CACHE_VERSION = 'v8';
const CACHE_NAME = `mathland5-${CACHE_VERSION}`;

// 정적 자원만 미리 캐시 (HTML 문서는 프리캐시하지 않음 → navigate는 항상 네트워크)
const PRECACHE_ASSETS = [
  './index.html',
  './app.html',
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
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(
        PRECACHE_ASSETS.map(url => cache.add(url).catch(() => {}))
      ))
      .then(() => self.skipWaiting())
  );
});

// ============ 활성화 (옛 캐시 정리) ============
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names => Promise.all(
      names.filter(n => n.startsWith('mathland5-') && n !== CACHE_NAME)
           .map(n => caches.delete(n))
    )).then(() => self.clients.claim())
  );
});

// ============ 요청 처리 ============
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== location.origin) return;  // 외부(폰트/CDN)는 건드리지 않음

  const isNavigation = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  // ★ HTML 문서(페이지 이동): 항상 네트워크 우선, 캐시에 저장하지도 않음.
  //   온라인이면 서버가 준 페이지(랜딩이든 앱이든)를 그대로 보여줌.
  //   오프라인일 때만, 요청 경로에 맞는 페이지로만 폴백.
  if (isNavigation) {
    event.respondWith(
      fetch(req).catch(() => {
        // 오프라인 폴백: 경로에 맞춰 분기 (루트/landing → landing, 그 외 → index)
        const p = url.pathname;
        const wantApp = (p.endsWith('/app.html') || p.endsWith('/app'));
        return caches.match(wantApp ? './app.html' : './index.html')
          .then(c => c || fetch(req));
      })
    );
    return;
  }

  // 정적 자원: 캐시 우선 + 백그라운드 갱신
  event.respondWith(
    caches.match(req).then(cached => {
      const fetchAndUpdate = fetch(req).then(res => {
        if (res && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetchAndUpdate;
    })
  );
});

// 수동 즉시 적용 (앱에서 '업데이트' 누를 때)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
