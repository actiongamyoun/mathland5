// 과목 / 학년 메타데이터
// 정보 구조: 과목 → 학년 → 단원 → 문제

// ============ 과목 정의 ============
// status: 'ready' = 콘텐츠 있음 / 'soon' = 준비 중 (UI엔 보이되 잠김)
window.MATHLAND_SUBJECTS = [
  {
    id: 'math',
    name: '수학',
    icon: 'calculate',
    color: '#1a7aff',
    status: 'ready',
    tagline: '스스로 푸는 힘',
  },
  {
    id: 'english',
    name: '영어',
    icon: 'translate',
    color: '#ff8a00',
    status: 'soon',
    tagline: '곧 만나요',
  },
  {
    id: 'korean',
    name: '국어',
    icon: 'menu_book',
    color: '#ff4ba0',
    status: 'soon',
    tagline: '곧 만나요',
  },
  {
    id: 'science',
    name: '과학',
    icon: 'science',
    color: '#2ecc40',
    status: 'soon',
    tagline: '곧 만나요',
  },
  {
    id: 'history',
    name: '역사',
    icon: 'history_edu',
    color: '#a06cd5',
    status: 'soon',
    tagline: '곧 만나요',
  },
];

// ============ 학년 정의 ============
// 과목별로 어떤 학년이 준비됐는지
window.MATHLAND_GRADES = [
  { grade: 5, name: '5학년', status: { math: 'ready' } },
  { grade: 6, name: '6학년', status: { math: 'soon' } },
];

// 헬퍼: 과목 정보 가져오기
window.getSubject = function(subjectId) {
  return window.MATHLAND_SUBJECTS.find(s => s.id === subjectId);
};

// 헬퍼: 특정 과목+학년이 준비됐는지
window.isGradeReady = function(subjectId, grade) {
  const g = window.MATHLAND_GRADES.find(x => x.grade === grade);
  return g && g.status[subjectId] === 'ready';
};

// 헬퍼: 특정 과목+학년의 단원 목록
window.getUnitsBySubjectGrade = function(subjectId, grade) {
  return (window.MATHLAND_UNITS || []).filter(u =>
    (u.subject || 'math') === subjectId && u.grade === grade
  );
};

console.log('[MATHLAND] subjects 로드');
