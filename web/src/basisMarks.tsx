import { Fragment, type ReactNode } from 'react';
import { LEVELS, type Level } from './api';

// 평가요소 도출 근거 → 본문 표시 (교육과정 분석 ③④⑤⑥).
// 「④ 지식·이해(컴퓨팅 시스템의 구성요소) + ⑥ D·E 구분 단서(설명 → 인지)」를 구역·칸·수준 줄과 찾을 낱말로 나눠,
// 그 구역 글의 낱말에만 표시를 달아 둔다. 「설명」같은 짧은 낱말이 아무 데나 칠해지지 않게 하려는 것.
// 표시는 평소 보이지 않고, 막대에서 고른 평가요소의 것만 칠해진다 (app.css .analysis[data-pick]).

export type Sec = '③' | '④' | '⑤' | '⑥';
type Part = 'knowledge' | 'skills' | 'attitude' | 'explanation' | 'consideration';

export interface Spot {
  sec: Sec;
  part?: Part; // ④ 범주 줄 · ⑤ 해설/고려 사항 줄 (없으면 구역 전체)
  levels?: Level[]; // ⑥ 수준 줄 (없으면 모든 줄)
  words: string[];
}

export interface Where {
  sec: Sec;
  part?: Part;
  level?: Level;
}

const PARTS: [string, Part][] = [
  ['지식·이해', 'knowledge'],
  ['과정·기능', 'skills'],
  ['가치·태도', 'attitude'],
  ['해설', 'explanation'],
  ['고려', 'consideration'],
];

// 괄호·낫표 밖의 쉼표로만 나눈다 — 「A 「효율적으로 활용」, C·D 구분 단서(분석 → 구분)」
function splitTop(s: string) {
  const out = [''];
  let depth = 0;
  for (const ch of s) {
    if (ch === '(' || ch === '「') depth++;
    if (ch === ')' || ch === '」') depth = Math.max(0, depth - 1);
    if (ch === ',' && depth === 0) out.push('');
    else out[out.length - 1] += ch;
  }
  return out;
}

// 「A·B」「A~D」「C·D 구분 단서」 → 수준 목록
function levelsOf(label: string): Level[] | undefined {
  const range = label.match(/([A-E])\s*~\s*([A-E])/);
  if (range) return LEVELS.filter((l) => l >= range[1] && l <= range[2]);
  const list = label.match(/(?:^|\s)([A-E](?:·[A-E])*)(?=\s|$)/);
  return list ? (list[1].split('·') as Level[]) : undefined;
}

// 괄호·낫표 안 글과 밖 글로 나눈다 — 「해설(인공지능 윤리(지침), 개발자 관점)」처럼 겹친 괄호도 맨 바깥 기준으로
function splitBrackets(clause: string) {
  const inside: string[] = [];
  let outside = '';
  let cur = '';
  let depth = 0;
  for (const ch of clause) {
    if (ch === '(' || ch === '「') {
      if (depth++ > 0) cur += ch;
      else outside += ' ';
    } else if ((ch === ')' || ch === '」') && depth > 0) {
      if (--depth > 0) cur += ch;
      else {
        inside.push(cur);
        cur = '';
      }
    } else if (depth > 0) cur += ch;
    else outside += ch;
  }
  return { inside, outside };
}
const wordsIn = (inside: string[]) =>
  inside
    .flatMap((t) => t.split(/[,，→·]/))
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && w !== '빠짐');

export function parseBasis(basis: string): Spot[] {
  const spots: Spot[] = [];
  for (const chunk of basis.split('+')) {
    const m = chunk.trim().match(/^([③④⑤⑥])\s*(.*)$/s);
    if (!m) continue; // 「PDF 원문 평가요소」 같은 것은 화면에 없음
    const sec = m[1] as Sec;
    for (const clause of sec === '⑥' ? splitTop(m[2]) : [m[2]]) {
      const { inside, outside: label } = splitBrackets(clause);
      const words = wordsIn(inside);
      if (!words.length) continue;
      spots.push({
        sec,
        part: PARTS.find(([k]) => label.includes(k))?.[1],
        levels: sec === '⑥' ? levelsOf(label) : undefined,
        words,
      });
    }
  }
  return spots;
}

export interface ElWord {
  word: string;
  i: number; // 평가요소 번호(0부터)
}

// 한 곳(구역·칸·수준 줄)에 칠할 평가요소 낱말
export const wordsAt = (perElement: Spot[][], w: Where): ElWord[] =>
  perElement.flatMap((spots, i) =>
    spots
      .filter(
        (s) =>
          s.sec === w.sec &&
          (!s.part || !w.part || s.part === w.part) &&
          (!s.levels || !w.level || s.levels.includes(w.level)),
      )
      .flatMap((s) => s.words.map((word) => ({ word, i }))),
  );

export const EL_COLORS = 5;

// 「구성요소를 파악하기」 ↔ 본문 「구성요소를 파악하고」 — 「~하기」는 「~하」로도 찾는다
export const forms = (w: string) => (w.endsWith('하기') ? [w, w.slice(0, -1)] : [w]);

// 수준 구분 단서(「분석 → 구분」, 「관련지어(유지)」 …)에서 이 줄 진술문에 칠할 낱말을 뽑는다.
// 괄호 설명은 빼고, 「앞 → 뒤」는 바뀐 뒤 표현만(「빠짐」이면 칠할 것 없음).
// 바뀐 뒤 표현이 진술문에 그대로 없으면(「핵심요소 구분」 ↔ 「핵심요소를 구분하며」) 띄어쓰기 단위 낱말로 찾는다.
// 「구분하여·정확하게(유지)」처럼 가운뎃점으로 이은 단서는 낱말마다 찾는다.
export const cueWords = (cues: string, statement: string) =>
  cues
    .replace(/\([^)]*\)/g, '')
    .split(/[,，\n]/)
    .flatMap((part) => {
      const arrow = part.includes('→');
      const t = part.split('→').pop()!.replace(/[「」]/g, '').trim();
      if (t.length < 2 || t === '빠짐') return [];
      if (statement.includes(t)) return [t];
      if (!arrow) return /^[^\s·]+(·[^\s·]+)+$/.test(t) ? t.split('·') : [t];
      return t.split(/\s+/).filter((w) => w.length > 1);
    });

// a 중에서 b 에 그대로 있는 가장 긴 조각의 위치
function longestShared(a: string, b: string): [number, number] {
  let best: [number, number] = [0, 0];
  for (let i = 0; i < a.length; i++) {
    for (let j = i + best[1] - best[0] + 1; j <= a.length; j++) {
      if (b.includes(a.slice(i, j))) best = [i, j];
      else break;
    }
  }
  return best;
}

const sameDot = (s: string) => s.replace(/ㆍ/g, '·'); // 「비교ㆍ분석」과 「비교·분석」은 같은 말 (글자 수는 그대로)
const MIN_SHARED = 4; // 이보다 짧게 겹치는 조각은 우연일 때가 많다

// ⑥ 지식·이해, 과정·기능, 가치·태도 칸의 문구를 진술문에서 찾아 글자마다 칠할 class 를 돌려준다 ('' = 칠하지 않음).
// 문구가 진술문에 그대로 있으면 그 자리를, 없으면 네 글자 이상 겹치는 구절들을 칠한다.
// 지식·이해 문구는 과정·기능 문구 안에 드는 일이 많아(「운영 체제의 기능과 관련지어 설명」) 맨 위에 칠해 둘 다 보이게 한다.
export function categoryTints(statement: string, cells: { knowledge: string; skills: string; attitude: string }) {
  const S = sameDot(statement);
  const tints = new Array<string>(statement.length).fill('');
  const paint = (w: string, cls: string) => {
    for (let p = S.indexOf(w); p >= 0; p = S.indexOf(w, p + w.length)) tints.fill(cls, p, p + w.length);
  };
  for (const [key, cls] of [['attitude', 'cat-a'], ['skills', 'cat-s'], ['knowledge', 'cat-k']] as const) {
    for (const line of cells[key].split('\n')) {
      const phrase = sameDot(line).replace(/\([^)]*\)/g, '').trim().replace(/하기$/, '');
      if (!phrase) continue;
      if (S.includes(phrase)) {
        paint(phrase, cls);
        continue;
      }
      for (let rest = phrase; ; ) {
        const [x, y] = longestShared(rest, S);
        const w = rest.slice(x, y).trim();
        if (w.length < MIN_SHARED) break;
        paint(w, cls);
        rest = `${rest.slice(0, x)}\u0001${rest.slice(y)}`; // 찾은 조각을 빼고 다시
      }
    }
  }
  // 다른 색에 덮이고 한 글자만 남은 조각은 지운다
  for (let i = 0; i < tints.length; ) {
    let j = i;
    while (j < tints.length && tints[j] === tints[i]) j++;
    if (j - i < 2) tints.fill('', i, j);
    i = j;
  }
  return tints;
}

// ⑧ 수준화된 평가요소가 진술문에서 가져온 말 — 두 글에 함께 나오는 말을 찾아 글자마다 칠할 class 를 돌려준다.
// 끝의 「~할 수 있다.」는 떼어 내고, 낱말 중간에서 시작한 조각(해석「하는 절차를」)은 앞 낱말을 뗀다.
// 세 글자 말(데이터, 딥러닝)은 낱말 첫머리에 있을 때만 — 「빅데이터」 속 「데이터」처럼 우연히 겹친 조각을 막는다.
const SENTENCE_END = /\s*(?:[할을]\s*수(?:\s*있\S*)?|수\s*있\S*)$/;
export function sharedTints(statement: string, performance: string): [string[], string[]] {
  const S = sameDot(statement);
  const P = sameDot(performance);
  const sTint = new Array<string>(S.length).fill('');
  const pTint = new Array<string>(P.length).fill('');
  const spots = (text: string, w: string) => {
    const out: number[] = [];
    for (let p = text.indexOf(w); p >= 0; p = text.indexOf(w, p + w.length)) out.push(p);
    return out;
  };
  const wordStart = (text: string) => (p: number) => p === 0 || text[p - 1] === ' ';
  for (let rest = P; ; ) {
    const [x, y] = longestShared(rest, S);
    let w = rest.slice(x, y).trim();
    if (w.length < 3) break;
    rest = `${rest.slice(0, x)}\u0001${rest.slice(y)}`; // 찾은 조각을 빼고 다시
    const space = w.indexOf(' ');
    if (space > 0 && !(spots(S, w).some(wordStart(S)) && spots(P, w).some(wordStart(P)))) w = w.slice(space + 1);
    w = w.replace(SENTENCE_END, '').trim();
    if (w.length < 3) continue;
    const short = w.length < MIN_SHARED;
    const inS = spots(S, w).filter((p) => !short || wordStart(S)(p));
    const inP = spots(P, w).filter((p) => !short || wordStart(P)(p));
    if (!inS.length || !inP.length) continue;
    inS.forEach((p) => sTint.fill('taken', p, p + w.length));
    inP.forEach((p) => pTint.fill('taken', p, p + w.length));
  }
  return [sTint, pTint];
}

// 글에 수준 구분 단서 표시(hl)와 평가요소 근거 표시(els), 글자별 색(tint)을 함께 단다.
// 근거 표시마다 data-el(평가요소 번호)·data-words(근거 낱말)를 달아 ⑦ 도출 근거 카드가 찾아올 수 있게 한다.
export function Marked({ text, hl = [], els = [], tint }: { text: string; hl?: string[]; els?: ElWord[]; tint?: string[] }) {
  const n = text.length;
  const yellow = new Array<boolean>(n).fill(false);
  const marks: Map<number, Set<string>>[] = Array.from({ length: n }, () => new Map());
  const paint = (w: string, f: (k: number) => void) => {
    for (let p = text.indexOf(w); w && p >= 0; p = text.indexOf(w, p + w.length)) {
      for (let k = p; k < p + w.length; k++) f(k);
    }
  };
  hl.forEach((w) => paint(w, (k) => (yellow[k] = true)));
  els.forEach(({ word, i }) =>
    forms(word).forEach((f) => paint(f, (k) => marks[k].set(i, (marks[k].get(i) ?? new Set()).add(word)))),
  );

  const key = (k: number) =>
    [...marks[k].entries()]
      .sort(([a], [b]) => a - b)
      .map(([i, ws]) => `${i}:${[...ws].sort().join('|')}`)
      .join(';');
  const runs: { s: string; y: boolean; key: string; k: number; t: string }[] = [];
  for (let k = 0; k < n; k++) {
    const last = runs[runs.length - 1];
    const t = tint?.[k] ?? '';
    if (last && last.y === yellow[k] && last.key === key(k) && last.t === t) last.s += text[k];
    else runs.push({ s: text[k], y: yellow[k], key: key(k), k, t });
  }
  const nodes = runs.map((r, j) => {
    let node: ReactNode = r.s;
    [...marks[r.k].entries()]
      .sort(([a], [b]) => a - b)
      .forEach(([i, ws]) => {
        node = (
          <span
            className={`ul ul-${i % EL_COLORS}`}
            data-el={i}
            data-words={[...ws].join('|')}
          >
            {node}
          </span>
        );
      });
    if (r.y) node = <mark className="hl">{node}</mark>;
    return <Fragment key={j}>{node}</Fragment>;
  });
  // 같은 색이 이어지는 곳은 한 덩어리로 감싼다 (단서가 끼어도 스티커가 끊기지 않게)
  const out: ReactNode[] = [];
  for (let j = 0; j < runs.length; ) {
    let e = j;
    while (e < runs.length && runs[e].t === runs[j].t) e++;
    out.push(
      runs[j].t ? (
        <span key={j} className={runs[j].t}>
          {nodes.slice(j, e)}
        </span>
      ) : (
        nodes.slice(j, e)
      ),
    );
    j = e;
  }
  return <>{out}</>;
}

// ⑦ 도출 근거 카드 하나 — 「⑥ A·B「체계적으로」」 → 어디(⑥ A·B)·무엇(체계적으로)·찾을 낱말
export interface Clause {
  tag: string;
  body: string;
  words: string[];
}

export function basisClauses(basis: string): Clause[] {
  return basis.split('+').flatMap((chunk) => {
    const m = chunk.trim().match(/^([③④⑤⑥])\s*(.*)$/s);
    const sec = m?.[1] ?? '';
    return splitTop(m ? m[2] : chunk)
      .map((c) => c.trim())
      .filter(Boolean)
      .map((clause) => {
        const { inside, outside } = splitBrackets(clause);
        const label = outside.replace(/\s+/g, ' ').trim();
        const words = sec ? wordsIn(inside) : []; // 「PDF 원문 평가요소」처럼 구역 번호가 없는 근거는 본문에 표시가 없다
        // 괄호 뒤로 말이 이어지면(「AI 초안(…)에 성취수준의 추가」) 문장이 끊기지 않게 통째로 보여 준다
        const isList = inside.length > 0 && /[)」]$/.test(clause);
        return isList ? { tag: `${sec} ${label}`.trim(), body: inside.join(', '), words } : { tag: sec, body: clause, words };
      });
  });
}

// 근거 카드를 눌렀을 때 — 위 본문의 그 자리로 옮겨 잠깐 반짝인다
export function goToBasis(i: number, words: string[]) {
  const targets = [...document.querySelectorAll<HTMLElement>(`.analysis .ul[data-el="${i}"]`)].filter((el) =>
    el.dataset.words!.split('|').some((w) => words.includes(w)),
  );
  targets.forEach((el) => {
    const card = el.closest('details');
    if (card) card.open = true; // ⑤처럼 접혀 있으면 펼치고 간다
  });
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  targets[0]?.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
  document.querySelectorAll('.ul.is-target').forEach((el) => el.classList.remove('is-target')); // 앞서 누른 자리는 지운다
  // 키보드 포커스도 함께 옮겨, 이동한 곳에서 이어 읽을 수 있게 한다
  if (targets[0]) {
    targets[0].tabIndex = -1;
    targets[0].focus({ preventScroll: true });
  }
  void document.body.offsetWidth; // 다시 누르면 깜빡임을 처음부터
  targets.forEach((el) => el.classList.add('is-target'));
}
