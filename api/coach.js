// api/coach.js
// Vercel Serverless Function — Claude API로 학습 코칭 멘트 생성
// 환경변수 ANTHROPIC_API_KEY 필요 (Vercel 프로젝트 설정에 등록)
//
// 요청(POST):
//   { type: 'plan' | 'stuck', payload: {...} }
// 응답:
//   { message: "마리의 코칭 멘트", suggestion?: {...} }

const MODEL = 'claude-sonnet-4-5-20250929';

// 마리(마스코트) 공통 페르소나
const PERSONA = `너는 "마리"라는 이름의 학습 코치야. 초등학교 5~6학년 학생의 학습을 옆에서 돕는 친근한 친구 같은 존재야.

중요한 원칙:
- 가르치지 않아. 문제의 정답이나 풀이 방법을 절대 알려주지 않아.
- 대신 스스로 공부하도록 동기를 주고, 학습 방향을 코칭해.
- 반말로, 친근하고 따뜻하게 말해. 초등학생이 이해하기 쉬운 쉬운 말로.
- 짧고 간결하게. 2~3문장 이내.
- 잔소리나 부담을 주지 않아. 격려와 응원 중심.
- 이모지는 가끔 1개 정도만 자연스럽게.`;

function buildPrompt(type, payload) {
  if (type === 'plan') {
    // payload: { units: [{name, mastery}], grade, subjectName }
    const unitList = (payload.units || [])
      .map(u => `- ${u.name}: ${u.mastery}% 이해`)
      .join('\n');
    return `${PERSONA}

지금 학생이 이번 주 학습 계획을 세우려고 해. 학생의 ${payload.subjectName || '수학'} ${payload.grade || 5}학년 단원별 현재 이해도는 이래:

${unitList}

이 정보를 보고, 이번 주에 어떤 단원에 집중하면 좋을지 따뜻하게 제안해줘. 가장 이해도가 낮은 단원을 자연스럽게 추천하되, 강요하지 말고 "~해보는 건 어때?" 같은 느낌으로. 학생이 스스로 선택한다는 느낌을 주는 게 중요해.`;
  }

  if (type === 'stuck') {
    // payload: { unitName, recentWrong, totalAttempts, easierUnitName }
    const easierLine = payload.easierUnitName
      ? `\n\n만약 학생이 너무 힘들어하면, "${payload.easierUnitName}" 단원처럼 좀 더 익숙한 걸 먼저 다지고 오는 것도 좋다고 부드럽게 권해줘. 단, 강요하지 말고 선택은 학생 몫이라는 느낌으로.`
      : '';
    return `${PERSONA}

학생이 "${payload.unitName}" 단원에서 계속 어려워하고 있어. 최근 ${payload.totalAttempts || 0}번 시도 중 ${payload.recentWrong || 0}번 틀렸어.

지금 학생이 막혀서 좀 지쳐 보여. 정답이나 푸는 방법은 절대 알려주지 말고, 잠깐 쉬어가거나 마음을 다잡을 수 있게 따뜻하게 응원해줘. "틀려도 괜찮아", "천천히 해도 돼" 같은 메시지로 부담을 덜어주는 게 좋아. 학년을 낮추라는 말은 절대 하지 마. 같은 학년 안에서 더 쉬운 내용을 권하는 정도만.${easierLine}`;
  }

  return `${PERSONA}\n\n학생에게 짧은 응원 한마디 해줘.`;
}

export default async function handler(req, res) {
  // CORS (같은 도메인이라 사실 불필요하지만 안전하게)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST only' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API 키가 설정되지 않았어요' });
  }

  try {
    const { type, payload } = req.body || {};
    const prompt = buildPrompt(type, payload || {});

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error('[coach] Claude API 오류:', r.status, errText);
      return res.status(502).json({ error: '코칭을 불러오지 못했어요', detail: r.status });
    }

    const data = await r.json();
    const message = (data.content || [])
      .filter(c => c.type === 'text')
      .map(c => c.text)
      .join('\n')
      .trim();

    return res.status(200).json({ message: message || '오늘도 화이팅! 같이 해보자 😊' });
  } catch (err) {
    console.error('[coach] 서버 오류:', err);
    return res.status(500).json({ error: '잠깐 문제가 생겼어요' });
  }
}
