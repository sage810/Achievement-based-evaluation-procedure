import { Fragment, type ReactNode } from 'react';
import { LEVELS, type Level } from './api';

// 평가요소 도출 근거 → 본문 색 밑줄 (교육과정 분석 ②③⑤⑥).
// 「④ 지식·이해(컴퓨팅 시스템의 구성요소) + ⑥ D·E 구분 단서(설명 → 인지)」를 구역·칸·수준 줄과 찾을 낱말로 나눠,
// 그 구역 글에서만 평가요소마다 다른 색으로 밑줄을 긋는다. 「설명」같은 짧은 낱말이 아무 데나 칠해지지 않게 하려는 것.

export type Sec = '②' | '③' | '⑤' | '⑥';
type Part = 'knowledge' | 'skills' | 'attitude' | 'explanation' | 'consideration';

export interface Spot {
  sec: Sec;
  part?: Part; // ③ 범주 줄 · ⑤ 해설/고려 사항 줄 (없으면 구역 전체)
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

export function parseBasis(basis: string): Spot[] {
  const spots: Spot[] = [];
  for (const chunk of basis.split('+')) {
    const m = chunk.trim().match(/^([②③④⑤⑥])\s*(.*)$/s);
    if (!m) continue; // 「PDF 원문 평가요소」 같은 것은 화면에 없음
    const sec: Sec = m[1] === '④' ? '③' : (m[1] as Sec); // ④ 관련 요소는 ③ 표에 나온다
    for (const clause of sec === '⑥' ? splitTop(m[2]) : [m[2]]) {
      const inside = [...clause.matchAll(/\(([^)]*)\)|「([^」]*)」/g)].map((x) => x[1] ?? x[2]);
      const label = clause.replace(/\([^)]*\)|「[^」]*」/g, ' ');
      const words = inside
        .flatMap((t) => t.split(/[,，→·]/))
        .map((w) => w.trim())
        .filter((w) => w.length > 1 && w !== '빠짐')
        // 「구성요소를 파악하기」 ↔ 본문 「구성요소를 파악하고」 — 「~하기」는 「~하」로도 찾는다
        .flatMap((w) => (w.endsWith('하기') ? [w, w.slice(0, -1)] : [w]));
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
  i: number; // 평가요소 번호(0부터) — 밑줄 색
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

// 글에 노란 형광펜(hl)과 평가요소 색 밑줄(els)을 함께 긋는다. 밑줄이 겹치면 아래로 한 칸씩 내려 둘 다 보이게.
export function Marked({ text, hl = [], els = [] }: { text: string; hl?: string[]; els?: ElWord[] }) {
  const n = text.length;
  const yellow = new Array<boolean>(n).fill(false);
  const sets: number[][] = Array.from({ length: n }, () => []);
  const paint = (w: string, f: (k: number) => void) => {
    for (let p = text.indexOf(w); w && p >= 0; p = text.indexOf(w, p + w.length)) {
      for (let k = p; k < p + w.length; k++) f(k);
    }
  };
  hl.forEach((w) => paint(w, (k) => (yellow[k] = true)));
  els.forEach(({ word, i }) => paint(word, (k) => sets[k].includes(i) || sets[k].push(i)));

  const runs: { s: string; y: boolean; e: number[] }[] = [];
  for (let k = 0; k < n; k++) {
    const e = [...sets[k]].sort();
    const last = runs[runs.length - 1];
    if (last && last.y === yellow[k] && last.e.join() === e.join()) last.s += text[k];
    else runs.push({ s: text[k], y: yellow[k], e });
  }
  return (
    <>
      {runs.map((r, j) => {
        let node: ReactNode = r.s;
        r.e.forEach((i, d) => {
          node = (
            <span className={`ul ul-${i % EL_COLORS}`} style={{ textUnderlineOffset: `${3 + d * 5}px` }}>
              {node}
            </span>
          );
        });
        return r.y ? (
          <mark key={j} className="hl">
            {node}
          </mark>
        ) : (
          <Fragment key={j}>{node}</Fragment>
        );
      })}
    </>
  );
}
