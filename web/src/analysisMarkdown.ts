import { LEVELS, type AnalysisData, type Area, type Standard } from './api';

// 교육과정 분석 탭(①~⑧) 한 성취기준을 화면과 같은 순서의 마크다운으로 만든다 — 「md 파일로 저장」 버튼용

// 표 칸 안에서는 줄바꿈을 <br> 로, 「|」는 이스케이프
const cell = (t: string) => (t.trim() ? t.trim().replace(/\|/g, '\\|').replace(/\n+/g, '<br>') : '—');
const list = (items: string[]) => items.map((t) => t.trim()).filter(Boolean);
const bullets = (items: string[]) => (list(items).length ? list(items).map((t) => `- ${t}`).join('\n') : '- —');
const table = (head: string[], rows: string[][]) =>
  [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');

const CATS = [
  ['knowledge', '지식·이해'],
  ['skills', '과정·기능'],
  ['attitude', '가치·태도'],
] as const;

export function analysisMarkdown(std: Standard, area: Area, data: AnalysisData): string {
  const out: string[] = [];
  out.push(`# 교육과정 분석 — [${std.code}]`, '');
  out.push(`> ${std.statement}`, '');

  out.push('## ① 영역 · 성취기준', '');
  out.push(`- 학교급·과목: ${std.school_level} ${std.subject}`);
  out.push(`- 영역: ${Number(area.no)}. ${area.name}`);
  out.push(`- 성취기준: [${std.code}] ${std.statement}`, '');

  out.push('## ② 핵심 아이디어', '');
  out.push(area.core_ideas.map((t, i) => `- [${data.core_idea_links.includes(i) ? 'x' : ' '}] ${t}`).join('\n'), '');
  out.push('### 성취기준과의 연결', '');
  out.push(
    table(
      ['구분', '내용'],
      [
        ['성취기준', data.core_idea_connection.standard],
        ['핵심 아이디어', data.core_idea_connection.idea],
        ['성취기준과 핵심 아이디어의 연결점', data.core_idea_connection.link],
      ],
    ),
    '',
  );

  out.push('## ③ 내용 체계 — 범주별 내용 요소', '');
  out.push(
    table(
      ['범주', '내용 요소 (교육과정 내용 체계)', '★ 이 성취기준과 직접 관련된 요소'],
      CATS.map(([key, label]) => [label, list(area[key]).join('\n'), list(std[key]).join('\n') || '없음']),
    ),
    '',
  );

  out.push('## ⑤ 성취기준 해설 · 적용 시 고려 사항', '');
  out.push('### 성취기준 해설', '');
  out.push(std.explanation.trim() || '해설 없음', '');
  out.push('**분석 — 평가에 주는 시사점**', '', bullets(data.explanation_implications), '');
  out.push('### 적용 시 고려 사항', '');
  out.push(bullets(area.considerations), '');
  out.push('**분석 — 평가에 주는 시사점**', '', bullets(data.consideration_implications), '');

  out.push('## ⑥ 성취기준별 성취수준 범주별 분석', '');
  out.push(
    table(
      ['수준', '성취수준 진술문', '지식·이해', '과정·기능', '가치·태도', '수준 구분 단서 (수식어·동사)'],
      LEVELS.map((lv) => [lv, std.levels[lv], data.levels[lv].knowledge, data.levels[lv].skills, data.levels[lv].attitude, data.levels[lv].cues]),
    ),
    '',
  );

  out.push('## ⑦ 평가요소 추출', '');
  data.elements.forEach((el, i) => {
    out.push(`### 평가요소 ${i + 1}`, '');
    out.push(
      table(
        ['항목', '내용'],
        [
          ['평가요소 (「~하기」로 진술)', el.element],
          ['도출 근거 (②~⑥의 어떤 내용·해설에서)', el.basis],
          ['도출 이유 (왜 이것을 평가해야 하는가)', el.reason],
          ['평가 내용 (무엇으로 확인할 것인가)', el.content],
          ['평가방법', el.method],
        ],
      ),
      '',
    );
  });

  out.push('## ⑧ 평가요소 수준화', '');
  data.elements.forEach((el, i) => {
    out.push(`### 평가요소 ${i + 1} — ${el.element || '(빈 평가요소)'}`, '');
    out.push(`- 도출 이유 재확인: ${el.leveling?.recheck.trim() || '—'}`, '');
    out.push(
      table(
        ['수준', '성취수준 진술문', '수준 구분 단서 (분석 ⑥)', '③ 수준화된 평가요소', '판단 준거', '문항·과제 아이디어'],
        LEVELS.map((lv) => {
          const c = el.leveling?.levels[lv];
          return [lv, std.levels[lv], data.levels[lv].cues, c?.performance ?? '', c?.criteria ?? '', c?.idea ?? ''];
        }),
      ),
      '',
    );
  });

  return out.join('\n');
}

export function downloadMarkdown(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
