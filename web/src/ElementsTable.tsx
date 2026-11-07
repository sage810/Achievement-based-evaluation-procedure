import { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import type { ElementRow } from './api';
import { basisClauses, EL_COLORS, goToBasis, type Clause, type Spot } from './basisMarks';
import { Text } from './ReadOnly';

// 평가요소 표 — 교육과정 분석 ⑦ (연수 양식의 평가요소 추출 표). 읽기 전용.
// 평가요소마다: 도출 근거 카드들 → 평가요소 그림. 도출 이유·평가 내용 표는 평가요소 칸의 버튼으로 펼친다.

const COLS = [
  ['reason', '도출 이유 (왜 이것을 평가해야 하는가)'],
  ['content', '평가 내용 (무엇으로 확인할 것인가)'],
] as const;

// 위 본문에 표시가 있는 근거는 눌러서 그 자리로 간다. 없으면 글로만 보여 준다
function BasisCard({ clause, linked, onGo }: { clause: Clause; linked: string[]; onGo: (from: HTMLElement) => void }) {
  const inner = (
    <>
      {clause.tag && <span className="el-src-tag">{clause.tag}</span>}
      <span className="el-src-body">{clause.body}</span>
    </>
  );
  if (!linked.length)
    return (
      <div className="el-src is-plain" title="위 본문에 같은 말이 없어 옮겨 갈 자리가 없어요">
        {inner}
      </div>
    );
  return (
    <button type="button" className="el-src" title="본문의 그 자리로 가기" onClick={(e) => onGo(e.currentTarget)}>
      {inner}
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d="M6 11V2M2.5 5.5 6 2l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export default function ElementsTable({
  rows,
  basis,
  pick,
  onPick,
  onJump,
}: {
  rows: ElementRow[];
  basis: Spot[][];
  pick: number | null;
  onPick: (i: number) => void;
  onJump: (from: HTMLElement) => void;
}) {
  // 위 본문에 실제로 표시가 있는 「평가요소 번호|낱말」 — 이것만 누를 수 있는 카드로 만든다
  const [drawn, setDrawn] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState<number[]>([]); // 도출 이유·평가 내용을 펼친 평가요소
  useEffect(() => setOpen([]), [rows]); // 다른 성취기준으로 가면 다시 접는다
  useEffect(() => {
    const found = new Set<string>();
    document.querySelectorAll<HTMLElement>('.analysis .ul[data-el]').forEach((el) =>
      el.dataset.words!.split('|').forEach((w) => found.add(`${el.dataset.el}|${w}`)),
    );
    setDrawn(found);
  }, [rows, basis]);

  return (
    <>
      {rows.length > 0 && (
        <p className="msi-small el-legend">왼쪽 근거들을 모아 오른쪽 평가요소를 뽑았어요. 근거를 누르면 위 본문의 그 자리로 가요.</p>
      )}
      {rows.map((r, i) => {
        const isOpen = open.includes(i);
        return (
        <div key={i} className={`el-block ${pick === i ? 'is-pick' : ''}`}>
          <h3 className={`msi-unit el-tag el-c${i % EL_COLORS}`}>평가요소 {i + 1}</h3>
          <div className="el-flow">
            <span className="el-flow-label el-flow-from">도출 근거 (③~⑥의 어떤 내용·해설에서)</span>
            <ul className="el-srcs">
              {basisClauses(r.basis).map((c, j) => {
                const linked = c.words.filter((w) => drawn.has(`${i}|${w}`));
                return (
                  <li key={j}>
                    <BasisCard
                      clause={c}
                      linked={linked}
                      onGo={(from) => {
                        // 칠한 뒤에 옮겨야 막대의 평가요소 이름과 본문이 함께 맞는다
                        flushSync(() => onPick(i));
                        onJump(from);
                        goToBasis(i, linked);
                      }}
                    />
                  </li>
                );
              })}
            </ul>
            <i className="el-arrow" aria-hidden="true" />
            <span className="el-flow-label el-flow-to">평가요소 (「~하기」로 진술)</span>
            <div className={`el-goal el-c${i % EL_COLORS}`}>
              <p>{r.element}</p>
              <button
                type="button"
                className="head-btn el-why"
                aria-expanded={isOpen}
                aria-controls={`el-why-${i}`}
                onClick={() => setOpen(isOpen ? open.filter((n) => n !== i) : [...open, i])}
              >
                <span aria-hidden="true">{isOpen ? '▾' : '▸'}&nbsp;</span>
                {isOpen ? '이유·평가 내용 접기' : '왜 이 평가요소인가요?'}
              </button>
            </div>
          </div>
          {isOpen && (
            <table id={`el-why-${i}`} className="an-table el-table">
              <colgroup>
                <col className="el-label-col" />
                <col />
              </colgroup>
              <tbody>
                {COLS.map(([key, label]) => (
                  <tr key={key}>
                    <th scope="row">{label}</th>
                    <td>
                      <Text value={r[key]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        );
      })}
    </>
  );
}
