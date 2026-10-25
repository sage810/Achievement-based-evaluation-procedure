// 학교급·과목 목록과 성취기준 코드 도우미

export const SCHOOL_LEVELS = ['중학교', '고등학교'];

export const SUBJECTS: Record<string, string[]> = {
  중학교: ['정보'],
  고등학교: ['정보', '인공지능 기초', '데이터 과학', '소프트웨어와 생활', '정보과학'],
};

export const areaNo = (code: string) => code.match(/(\d{2})-\d{2}\]?/)?.[1] ?? '';

// 한 줄에 한 항목. 앞의 「-」「•」 같은 글머리는 떼어 낸다.
export const lines = (text: string) =>
  text
    .split('\n')
    .map((l) => l.replace(/^\s*[-•·*⋅]\s*/, '').trim())
    .filter(Boolean);
