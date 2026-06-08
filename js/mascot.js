// js/mascot.js
// 마스코트 "마리" — 카피바라 (머리 위 유자 포인트). 표정별 SVG 생성.
// 사용: window.mascotSVG('hello', 120)  →  SVG 문자열 반환
//
// 표정(mood): 'hello'(기본·순함), 'cheer'(축하·양손), 'wink'(격려), 'think'(생각), 'sad'(아쉬움)

window.mascotSVG = function(mood = 'hello', size = 120) {
  const id = 'cap' + Math.random().toString(36).slice(2, 7);

  const body = `
    <ellipse cx="75" cy="140" rx="42" ry="32" fill="#a87d5d"/>
    <ellipse cx="44" cy="138" rx="9" ry="12" fill="#9c7355"/>
    <ellipse cx="106" cy="138" rx="9" ry="12" fill="#9c7355"/>`;
  const bodyCheer = `
    <ellipse cx="75" cy="142" rx="42" ry="30" fill="#a87d5d"/>
    <ellipse cx="40" cy="116" rx="8" ry="11" fill="#9c7355" transform="rotate(-25 40 116)"/>
    <ellipse cx="110" cy="116" rx="8" ry="11" fill="#9c7355" transform="rotate(25 110 116)"/>`;
  const ears = `
    <ellipse cx="44" cy="48" rx="11" ry="12" fill="#9c7355"/>
    <ellipse cx="106" cy="48" rx="11" ry="12" fill="#9c7355"/>
    <ellipse cx="44" cy="49" rx="6" ry="7" fill="#7a5a42"/>
    <ellipse cx="106" cy="49" rx="6" ry="7" fill="#7a5a42"/>`;
  const head = `<path d="M75 36 C104 36 116 56 116 80 C116 104 98 116 75 116 C52 116 34 104 34 80 C34 56 46 36 75 36 Z" fill="url(#${id})"/>`;
  const yuzu = `
    <ellipse cx="75" cy="33" rx="13" ry="11" fill="#ffc832"/>
    <ellipse cx="71" cy="30" rx="3.5" ry="2.5" fill="#ffe08a" opacity="0.7"/>
    <path d="M75 22 Q72 18 69 19 Q73 20 75 24 Q77 20 81 19 Q78 18 75 22Z" fill="#5aa845"/>`;
  const snout = `
    <ellipse cx="75" cy="94" rx="22" ry="16" fill="#a87d5d" opacity="0.5"/>
    <ellipse cx="68" cy="91" rx="3" ry="4" fill="#3a2a1d"/>
    <ellipse cx="82" cy="91" rx="3" ry="4" fill="#3a2a1d"/>`;

  let eyes, mouth, extra = '', useBody = body, transform = '';

  switch (mood) {
    case 'cheer':
      useBody = bodyCheer;
      eyes = `<path d="M55 73 Q60 68 65 73" stroke="#3a2a1d" stroke-width="3" fill="none" stroke-linecap="round"/>
              <path d="M85 73 Q90 68 95 73" stroke="#3a2a1d" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      mouth = `<path d="M69 100 Q75 107 81 100 Z" fill="#3a2a1d"/>`;
      extra = `<text x="20" y="44" font-size="15">\u2728</text><text x="120" y="50" font-size="15">\u2728</text>`;
      break;
    case 'wink':
      eyes = `<circle cx="60" cy="74" r="5" fill="#3a2a1d"/><circle cx="62" cy="72" r="1.6" fill="#fff"/>
              <path d="M85 73 Q90 69 95 73" stroke="#3a2a1d" stroke-width="3" fill="none" stroke-linecap="round"/>`;
      mouth = `<path d="M71 102 Q75 105 79 102" stroke="#3a2a1d" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      extra = `<ellipse cx="52" cy="88" rx="5" ry="3.5" fill="#ff9b9b" opacity="0.45"/><ellipse cx="98" cy="88" rx="5" ry="3.5" fill="#ff9b9b" opacity="0.45"/>`;
      break;
    case 'think':
      transform = 'rotate(-7 75 80)';
      eyes = `<circle cx="60" cy="73" r="5" fill="#3a2a1d"/><circle cx="61" cy="71" r="1.6" fill="#fff"/>
              <circle cx="90" cy="73" r="5" fill="#3a2a1d"/><circle cx="91" cy="71" r="1.6" fill="#fff"/>`;
      mouth = `<circle cx="75" cy="103" r="3.5" fill="none" stroke="#3a2a1d" stroke-width="2.2"/>`;
      extra = `<text x="118" y="44" font-size="24" fill="#9aa1b5" font-family="sans-serif">?</text>`;
      break;
    case 'sad':
      eyes = `<circle cx="60" cy="76" r="5" fill="#3a2a1d"/><circle cx="61" cy="74" r="1.6" fill="#fff"/>
              <circle cx="90" cy="76" r="5" fill="#3a2a1d"/><circle cx="91" cy="74" r="1.6" fill="#fff"/>
              <path d="M54 68 Q60 66 65 68" stroke="#3a2a1d" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>
              <path d="M85 68 Q90 66 96 68" stroke="#3a2a1d" stroke-width="2" fill="none" stroke-linecap="round" opacity="0.5"/>`;
      mouth = `<path d="M71 105 Q75 101 79 105" stroke="#3a2a1d" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      break;
    case 'hello':
    default:
      eyes = `<circle cx="60" cy="74" r="5" fill="#3a2a1d"/><circle cx="62" cy="72" r="1.6" fill="#fff"/>
              <circle cx="90" cy="74" r="5" fill="#3a2a1d"/><circle cx="92" cy="72" r="1.6" fill="#fff"/>`;
      mouth = `<path d="M71 103 Q75 106 79 103" stroke="#3a2a1d" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      break;
  }

  const headGroup = transform
    ? `<g transform="${transform}">${ears}${head}${yuzu}${eyes}${snout}${mouth}</g>`
    : `${ears}${head}${yuzu}${eyes}${snout}${mouth}`;

  const h = Math.round(size * 170 / 150);
  return `<svg width="${size}" height="${h}" viewBox="0 0 150 170" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#b08968"/><stop offset="100%" stop-color="#9c7355"/>
    </linearGradient></defs>
    ${useBody}${headGroup}${extra}
  </svg>`;
};

console.log('[MATHLAND] mascot (capybara) 로드');
