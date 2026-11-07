import { LEVELS, type ReviewSheet, type Standard } from './api';
import guideTemplate from './review-guide/guide.md?raw';
import xlsxScript from './review-guide/make_xlsx.py?raw';

// 평가계획서 탭 — 생성형 AI에 넣는 검토 지침 md 와 프롬프트 예시를 브라우저에서 만든다 (서버 없이 동작)

const lf = (text: string) => text.replace(/\r\n/g, '\n');

// 항목마다 한 줄로 쓴다 — AI 가 읽기 쉽고, 엑셀 코드가 그대로 JSON 으로 읽는다
function checklistJson(sheets: ReviewSheet[]): string {
  const open = (head: object) => JSON.stringify(head).slice(0, -1);
  const sheetText = sheets.map(({ groups, ...head }) => {
    const groupText = groups.map(({ items, ...group }) => `${open(group)},"items":[\n${items.map((q) => JSON.stringify(q)).join(',\n')}\n]}`);
    return `${open(head)},"groups":[\n${groupText.join(',\n')}\n]}`;
  });
  return `[\n${sheetText.join(',\n')}\n]`;
}

function standardsText(standards: Standard[]): string {
  return standards
    .map((s) => [`### [${s.code}]`, '', s.statement, '', ...LEVELS.map((lv) => `- ${lv}: ${s.levels[lv]}`)].join('\n'))
    .join('\n\n');
}

// 판정 기준이 과목 유형에 따라 갈린다 (2022 개정 정보과 성취수준 문서). 모두 A~E 5단계
const SUBJECT_TYPE: Record<string, string> = {
  '중학교 정보': '구분 없음',
  '고등학교 정보': '일반선택',
  '고등학교 인공지능 기초': '진로선택',
  '고등학교 데이터 과학': '진로선택',
  '고등학교 소프트웨어와 생활': '융합선택',
  '고등학교 정보과학': '과학계열 진로선택',
};
const SUBJECT_NOTE: Record<string, string> = {
  '고등학교 정보과학': '- 이 과목의 표준 평가 도구는 평가 요소를 「~할 수 있다」 문장형으로 쓰기도 한다. 행동이 드러나면 문제로 보지 않는다.\n',
};

export const reviewGuideFilename = (schoolLevel: string, subject: string) =>
  `평가계획서_검토지침_${schoolLevel}_${subject.replace(/\s+/g, '_')}.md`;

export function reviewGuideMarkdown(sheets: ReviewSheet[], standards: Standard[], schoolLevel: string, subject: string): string {
  const values: Record<string, string> = {
    SCHOOL_LEVEL: schoolLevel,
    SUBJECT: subject,
    STANDARD_COUNT: String(standards.length),
    FIRST_CODE: standards[0]?.code ?? '',
    SUBJECT_TYPE: SUBJECT_TYPE[`${schoolLevel} ${subject}`] ?? '구분 없음',
    SUBJECT_NOTE: SUBJECT_NOTE[`${schoolLevel} ${subject}`] ?? '',
    CHECKLIST_JSON: checklistJson(sheets),
    STANDARDS: standardsText(standards),
    XLSX_SCRIPT: lf(xlsxScript).trimEnd().replace('평가계획서_검토지침.md', reviewGuideFilename(schoolLevel, subject)),
  };
  return lf(guideTemplate).replace(/\{\{(\w+)\}\}/g, (_, key: string) => values[key]);
}

export interface ReviewPrompt {
  id: string;
  label: string; // 목록에 보이는 이름
  file: string; // 내려받을 파일 이름
  text: string;
}

const READ_GUIDE = '첨부한 「평가계획서 검토 지침」(md)을 끝까지 읽고, 그 지침대로 첨부한 평가계획서를 검토해 줘.';
const CHECK_ALL = '- 지침 3장의 38개 항목을 빠짐없이 판정하고, 계산 항목은 직접 다시 계산해 줘.';
const ANSWER_FORM = '- 답은 지침 5장의 형식 그대로 써 줘. 검토 요약(판정 개수, 요약)에 이어 시트·영역별 표 순서야.';
const CONTINUE = '- 답이 길어 끊기면 마지막 항목 다음부터 이어서 써 줘.';

export const REVIEW_PROMPTS: ReviewPrompt[] = [
  {
    id: 'excel',
    label: '검토 + 엑셀 파일까지',
    file: '평가계획서_검토프롬프트_엑셀까지.txt',
    text: [
      READ_GUIDE,
      '',
      CHECK_ALL,
      ANSWER_FORM,
      '- 그다음 지침 6장의 코드를 실행해 엑셀 파일을 만들어 줘. 「채우는 곳」만 채우고 양식은 고치지 마.',
      '- 엑셀의 판정과 글은 화면 답변과 같아야 해.',
      CONTINUE,
    ].join('\n'),
  },
  {
    id: 'table',
    label: '엑셀을 못 만드는 AI용 (표로만 답하기)',
    file: '평가계획서_검토프롬프트_표로만.txt',
    text: [
      READ_GUIDE,
      '',
      CHECK_ALL,
      ANSWER_FORM,
      '- 엑셀 파일은 만들지 말고 표로만 답해 줘. 내가 표를 복사해 엑셀에 붙여 넣을 거야.',
      CONTINUE,
    ].join('\n'),
  },
  {
    id: 'recheck',
    label: '고친 계획서 다시 검토',
    file: '평가계획서_검토프롬프트_다시검토.txt',
    text: [
      '첨부한 「평가계획서 검토 지침」(md)을 끝까지 읽고, 그 지침대로 첨부한 고친 평가계획서를 다시 검토해 줘. 이전 검토 결과도 함께 첨부했어.',
      '',
      '- 지침 3장의 38개 항목을 처음부터 다시 판정해 줘. 이전 결과를 옮겨 적지 말고 고친 계획서에서 다시 확인해. 계산 항목도 직접 다시 계산해 줘.',
      '- 검토 요약의 첫 줄에 이전에 ✖ 문제였던 항목 중 고쳐진 것과 아직 남은 것, 새로 생긴 문제를 ID로 적어 줘.',
      ANSWER_FORM,
      '- 지침 6장의 코드를 실행할 수 있으면 엑셀 파일도 만들어 줘. 실행할 수 없으면 표로만 답해 줘.',
      CONTINUE,
    ].join('\n'),
  },
];
