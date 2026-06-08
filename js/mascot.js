// js/mascot.js
// 마스코트 "마리" — 젤리형 캐릭터. 표정별 SVG 생성.
// 사용: window.mascotSVG('happy', 120)  →  SVG 문자열 반환
//
// 표정(mood): 'hello'(기본), 'think'(생각), 'cheer'(축하), 'wink'(격려), 'sad'(아쉬움)

window.mascotSVG = function(mood = 'hello', size = 120) {
  const id = 'mg' + Math.random().toString(36).slice(2, 7); // 그라데이션 고유 id
  const body = `<path d="M60 12 C82 12 100 30 100 58 C100 86 82 104 60 104 C38 104 20 86 20 58 C20 30 38 12 60 12 Z" fill="url(#${id})"/>`;
  const cheeks = `<ellipse cx="38" cy="68" rx="7" ry="5" fill="#ff8fb0" opacity="0.6"/><ellipse cx="82" cy="68" rx="7" ry="5" fill="#ff8fb0" opacity="0.6"/>`;
  const antenna = `<line x1="60" y1="12" x2="60" y2="2" stroke="#ffc800" stroke-width="3" stroke-linecap="round"/><circle cx="60" cy="2" r="3.5" fill="#ffc800"/>`;

  let face = '';
  let extra = '';
  let transform = '';

  switch (mood) {
    case 'think':
      transform = 'rotate(-8 60 60)';
      face = `
        <circle cx="46" cy="54" r="7" fill="#fff"/><circle cx="47" cy="53" r="4" fill="#1a1d29"/>
        <circle cx="74" cy="54" r="7" fill="#fff"/><circle cx="75" cy="53" r="4" fill="#1a1d29"/>
        <circle cx="60" cy="74" r="4" fill="none" stroke="#fff" stroke-width="3"/>`;
      extra = `<text x="92" y="36" font-size="22" font-family="sans-serif" fill="#9aa1b5">?</text>`;
      break;
    case 'cheer':
      face = cheeks + `
        <path d="M40 54 Q46 48 52 54" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M68 54 Q74 48 80 54" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M50 70 Q60 82 70 70 Z" fill="#fff"/>`;
      extra = `<text x="12" y="30" font-size="16">✨</text><text x="92" y="94" font-size="16">✨</text>`;
      break;
    case 'wink':
      face = cheeks + `
        <circle cx="46" cy="54" r="7" fill="#fff"/><circle cx="48" cy="56" r="4" fill="#1a1d29"/>
        <path d="M68 54 Q74 49 80 54" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>
        <path d="M52 72 Q60 79 68 72" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      break;
    case 'sad':
      face = `
        <circle cx="46" cy="56" r="7" fill="#fff"/><circle cx="46" cy="58" r="4" fill="#1a1d29"/>
        <circle cx="74" cy="56" r="7" fill="#fff"/><circle cx="74" cy="58" r="4" fill="#1a1d29"/>
        <path d="M52 78 Q60 72 68 78" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      break;
    case 'hello':
    default:
      face = cheeks + `
        <circle cx="46" cy="54" r="7" fill="#fff"/><circle cx="48" cy="56" r="4" fill="#1a1d29"/>
        <circle cx="74" cy="54" r="7" fill="#fff"/><circle cx="76" cy="56" r="4" fill="#1a1d29"/>
        <path d="M52 72 Q60 80 68 72" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
      break;
  }

  const inner = transform
    ? `<g transform="${transform}">${body}${face}${antenna}</g>${extra}`
    : `${body}${face}${antenna}${extra}`;

  return `<svg width="${size}" height="${size}" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3dc4ff"/><stop offset="100%" stop-color="#1cb0f6"/>
    </linearGradient></defs>
    ${inner}
  </svg>`;
};

console.log('[MATHLAND] mascot 로드');
