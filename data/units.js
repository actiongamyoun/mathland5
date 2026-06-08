// 단원 메타정보
// 출처: 2022 개정 교육과정 / 천재교육 5학년 수학 (1·2학기)
// 단원명·순서는 천재교육 교과서 기준
window.MATHLAND_UNITS = [
  // === 5학년 1학기 ===
  {
    id: 'mix',
    subject: 'math',
    name: '자연수의 혼합 계산',
    grade: 5, semester: 1, unitNum: 1,
    icon: 'calculate',
    color: '#1a7aff',
    description: '괄호와 사칙연산이 섞인 식의 계산 순서',
    keyConcepts: ['계산 순서', '괄호의 역할', '곱셈·나눗셈 우선'],
  },
  {
    id: 'div',
    subject: 'math',
    name: '약수와 배수',
    grade: 5, semester: 1, unitNum: 2,
    icon: 'grid_view',
    color: '#2ecc40',
    description: '약수, 배수, 공약수, 공배수의 의미와 활용',
    keyConcepts: ['약수', '배수', '최대공약수', '최소공배수'],
  },
  {
    id: 'rule',
    subject: 'math',
    name: '규칙과 대응',
    grade: 5, semester: 1, unitNum: 3,
    icon: 'pattern',
    color: '#a06cd5',
    description: '두 양 사이의 관계를 식으로 나타내기',
    keyConcepts: ['대응 관계', '식으로 표현', '규칙 찾기'],
  },
  {
    id: 'frac',
    subject: 'math',
    name: '약분과 통분',
    grade: 5, semester: 1, unitNum: 4,
    icon: 'pie_chart',
    color: '#ff4ba0',
    description: '분수의 크기 비교, 분수의 덧셈과 뺄셈',
    keyConcepts: ['약분', '통분', '분수의 덧·뺄셈'],
  },
  // === 5학년 2학기 ===
  {
    id: 'mult',
    subject: 'math',
    name: '분수의 곱셈',
    grade: 5, semester: 2, unitNum: 5,
    icon: 'close',
    color: '#ff3838',
    description: '분수와 자연수, 분수와 분수의 곱셈',
    keyConcepts: ['(분수)×(자연수)', '(자연수)×(분수)', '(분수)×(분수)'],
  },
  {
    id: 'area',
    subject: 'math',
    name: '다각형의 둘레와 넓이',
    grade: 5, semester: 2, unitNum: 6,
    icon: 'category',
    color: '#ffd23f',
    description: '평행사변형, 삼각형, 사다리꼴, 마름모의 넓이',
    keyConcepts: ['둘레', '넓이 단위', '도형별 넓이 공식'],
  },
];

// 인지 단계 라벨 (블룸 분류 기반, 5학년 친화 표현)
window.MATHLAND_LEVELS = {
  1: { key: 'understand', label: '이해',  color: '#2ecc40',  description: '개념을 알고 있나요?' },
  2: { key: 'apply',      label: '적용',  color: '#1a7aff',  description: '배운 걸 써먹어 봐요' },
  3: { key: 'analyze',    label: '분석',  color: '#ff8a00',  description: '왜 그런지 들여다봐요' },
  4: { key: 'create',     label: '창의',  color: '#a06cd5',  description: '나만의 방법으로!' },
};
