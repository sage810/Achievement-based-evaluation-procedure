import { useEffect, useMemo, useRef, useState } from 'react';
import { api, LEVELS, type AnalysisData, type Curriculum, type Standard } from './api';
import { analysisMarkdown, downloadMarkdown } from './analysisMarkdown';
import { areaNo } from './catalog';
import ElementsTable from './ElementsTable';
import LevelingCard from './Leveling';
import { forms, Marked, parseBasis, wordsAt, type ElWord, type Spot, type Where } from './basisMarks';
import { Bullets, Text } from './ReadOnly';

// 교육과정 분석 탭 — 연수 양식(①~⑧) 순서대로 한 성취기준의 분석을 보여 준다.
// 읽기 전용: 내용은 Claude Code 가 채우고 선생님은 고치지 않는다(선생님 지시 2026-10-24).

const CATS = [
  ['knowledge', '지식·이해'],
  ['skills', '과정·기능'],
  ['attitude', '가치·태도'],
] as const;

const CONN_ROWS = [
  ['standard', '성취기준'],
  ['idea', '핵심 아이디어'],
  ['link', '성취기준과 핵심 아이디어의 연결점'],
] as const;

// 해설 문단을 문장(「~다.」) 단위로 나눈다
const sentences = (text: string) => text.split(/(?<=다\.)\s+/).filter((t) => t.trim());

// 수준 구분 단서(「분석 → 구분」, 「관련지어(유지)」 …)에서 이 줄 진술문에 칠할 낱말을 뽑는다.
// 괄호 설명은 빼고, 「앞 → 뒤」는 바뀐 뒤 표현만(「빠짐」이면 칠할 것 없음).
// 바뀐 뒤 표현이 진술문에 그대로 없으면(「핵심요소 구분」 ↔ 「핵심요소를 구분하며」) 띄어쓰기 단위 낱말로 찾는다.
// 「구분하여·정확하게(유지)」처럼 가운뎃점으로 이은 단서는 낱말마다 찾는다.
const cueWords = (cues: string, statement: string) =>
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

// 읽기 전용 글·점 목록 (ReadOnly 의 Text·Bullets 와 같고, 평가요소 색 밑줄만 더함)
function MText({ value, els }: { value: string; els: ElWord[] }) {
  return value.trim() ? (
    <div className="ro-text">
      <Marked text={value} els={els} />
    </div>
  ) : (
    <span className="empty">—</span>
  );
}

function MBullets({ items, els }: { items: string[]; els: ElWord[] }) {
  const list = items.map((t) => t.trim()).filter(Boolean);
  if (!list.length) return <span className="empty">—</span>;
  return (
    <ul className="info-list">
      {list.map((t, i) => (
        <li key={i}>
          <Marked text={t} els={els} />
        </li>
      ))}
    </ul>
  );
}

interface Props {
  subject: string;
  items: Standard[];
  curriculum: Curriculum | null;
  initialStdId?: number | null; // 그래프 탭에서 넘어올 때 처음 열 성취기준
}

export default function Analysis({ subject, items, curriculum, initialStdId }: Props) {
  const areas = curriculum?.areas ?? [];
  const pending = useRef(items.find((s) => s.id === initialStdId) ?? null);
  const firstArea = () => {
    const p = pending.current;
    const same = p && p.subject === curriculum?.subject && p.school_level === curriculum?.school_level;
    return same ? areaNo(p.code) : areas[0]?.no ?? '';
  };
  const [area, setArea] = useState(firstArea);
  const inArea = useMemo(() => items.filter((s) => areaNo(s.code) === area), [items, area]);
  const [stdId, setStdId] = useState<number | null>(null);
  const std = items.find((s) => s.id === stdId) ?? null;
  const areaInfo = areas.find((a) => a.no === area) ?? null;

  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState('');
  const [connHint, setConnHint] = useState(false); // 「성취기준과의 연결」 ? 질문
  // 평가요소마다 도출 근거가 가리키는 곳 — 위 ②③⑤⑥ 본문에 평가요소 색 밑줄
  // 근거가 가리킨 칸·수준 줄에 그 말이 없으면 같은 구역 전체에서 찾는다
  // (예: 「④ 지식·이해(컴퓨팅 시스템의 구성요소)」는 ③ 과정·기능 줄에만 그 말이 있음)
  const basis = useMemo(() => {
    const raw = data?.elements.map((e) => parseBasis(e.basis)) ?? [];
    if (!data || !std || !areaInfo) return raw;
    const textOf = (s: Pick<Spot, 'sec' | 'part' | 'levels'>): string => {
      if (s.sec === '②') return [...areaInfo.core_ideas, ...Object.values(data.core_idea_connection)].join('\n');
      if (s.sec === '③') {
        const keys = s.part && s.part in std ? [s.part as (typeof CATS)[number][0]] : CATS.map(([k]) => k);
        return keys.flatMap((k) => [...areaInfo[k], ...std[k]]).join('\n');
      }
      if (s.sec === '⑤') {
        const ex = [std.explanation, ...data.explanation_implications];
        const co = [...areaInfo.considerations, ...data.consideration_implications];
        return (s.part === 'explanation' ? ex : s.part === 'consideration' ? co : [...ex, ...co]).join('\n');
      }
      return (s.levels ?? LEVELS).map((l) => std.levels[l]).join('\n');
    };
    const found = (s: Pick<Spot, 'sec' | 'part' | 'levels'>, w: string) => forms(w).some((f) => textOf(s).includes(f));
    return raw.map((spots) =>
      spots.flatMap((s) => {
        const missing = s.words.filter((w) => !found(s, w));
        if (!missing.length || (!s.part && !s.levels)) return [s];
        const kept = s.words.filter((w) => found(s, w));
        return [...(kept.length ? [{ ...s, words: kept }] : []), { sec: s.sec, words: missing }];
      }),
    );
  }, [data, std, areaInfo]);
  const at = (w: Where) => wordsAt(basis, w);

  // 과목이 바뀌면 첫 영역으로
  useEffect(() => setArea(firstArea()), [curriculum]); // eslint-disable-line react-hooks/exhaustive-deps

  // 영역이 바뀌면 그 영역 첫 성취기준으로 (그래프에서 넘어왔으면 그 성취기준으로 한 번)
  useEffect(() => {
    const p = pending.current;
    setStdId(p && inArea.includes(p) ? p.id! : inArea[0]?.id ?? null);
  }, [area, items]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (stdId === null) {
      setData(null);
      return;
    }
    let alive = true;
    setError('');
    api
      .analysis(stdId)
      .then((a) => alive && setData(a?.data ?? null))
      .catch((e) => alive && setError(`분석을 불러오지 못했어요: ${e.message}`));
    return () => {
      alive = false;
    };
  }, [stdId]);

  if (!curriculum) {
    return (
      <div className="msi-note">
        <b>{subject}</b> 과목은 교육과정 내용 체계(핵심 아이디어·지식·이해·과정·기능·가치·태도)가 아직 없어 분석할 수 없어요.
        Claude Code에 이 과목의 교육과정을 넣어 달라고 말해 주세요.
      </div>
    );
  }

  return (
    <div className="analysis">
      {/* ① 영역·성취기준 고르기 */}
      <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-pick)' }}>
        <div className="msi-card-head">
          <span>① 영역 · 성취기준 선택</span>
        </div>
        <div className="msi-card-body">
          <div className="pick-row pick-stack">
            <label className="msi-label">
              영역
              <select
                className="msi-field"
                value={area}
                onChange={(e) => {
                  pending.current = null;
                  setArea(e.target.value);
                }}
              >
                {areas.map((a) => (
                  <option key={a.no} value={a.no}>
                    {Number(a.no)}. {a.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="msi-label pick-std">
              성취기준
              <select className="msi-field" value={stdId ?? ''} onChange={(e) => setStdId(Number(e.target.value))}>
                {inArea.map((s) => (
                  <option key={s.id} value={s.id}>
                    [{s.code}] {s.statement}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      {error && <p className="status error">{error}</p>}
      {!std || !areaInfo ? (
        <div className="msi-note">이 영역에 성취기준이 없어요.</div>
      ) : !data ? (
        <div className="msi-note">이 성취기준은 아직 분석이 없어요. Claude Code에 분석을 채워 달라고 말해 주세요.</div>
      ) : (
        <>
          {/* ② 핵심 아이디어 */}
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-ideas)' }}>
            <div className="msi-card-head">
              <span>② 핵심 아이디어</span>
              <span className="r">✓ 맞닿은 문장</span>
            </div>
            <div className="msi-card-body">
              <ul className="idea-list">
                {areaInfo.core_ideas.map((t, i) => {
                  const on = data.core_idea_links.includes(i);
                  return (
                    <li key={i}>
                      <div className={`idea ${on ? 'is-on' : ''}`}>
                        <span className="idea-mark" aria-label={on ? '맞닿음' : undefined}>
                          {on ? '✓' : ''}
                        </span>
                        <span>
                          <Marked text={t} els={at({ sec: '②' })} />
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <span className="th-with-help conn-head">
                <b className="msi-label">성취기준과의 연결</b>
                <button
                  type="button"
                  className="help-btn"
                  aria-expanded={connHint}
                  aria-controls="conn-hint"
                  aria-label="성취기준과의 연결 점검 질문 보기"
                  title="점검 질문 보기"
                  onClick={() => setConnHint(!connHint)}
                >
                  ?
                </button>
              </span>
              {connHint && (
                <p id="conn-hint" className="lvz-hint" role="note">
                  이 성취기준을 배우면 핵심 아이디어의 어느 부분에 다가가는가?
                </p>
              )}
              <table className="an-table conn-table">
                <tbody>
                  {CONN_ROWS.map(([key, label]) => (
                    <tr key={key}>
                      <th scope="row">{label}</th>
                      <td>
                        <MText value={data.core_idea_connection[key]} els={at({ sec: '②' })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ③ 내용 체계 */}
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-system)' }}>
            <div className="msi-card-head">
              <span>③ 내용 체계 — 범주별 내용 요소</span>
            </div>
            <div className="msi-card-body">
              <div className="ks-table" role="table">
                <div className="ks-row ks-head" role="row">
                  <span role="columnheader">범주</span>
                  <span role="columnheader">내용 요소 (교육과정 내용 체계)</span>
                  <span role="columnheader">★ 이 성취기준과 직접 관련된 요소</span>
                </div>
                {CATS.map(([key, label]) => (
                  <div key={key} className="ks-row" role="row">
                    <b role="rowheader">{label}</b>
                    <ul role="cell">
                      {/* 3열(이 성취기준과 직접 관련)에 있는 요소는 형광펜 밑줄 */}
                      {areaInfo[key].map((t, i) => (
                        <li key={i}>
                          <Marked text={t} hl={std[key].includes(t) ? [t] : []} els={at({ sec: '③', part: key })} />
                        </li>
                      ))}
                    </ul>
                    <ul role="cell">
                      {std[key].length ? (
                        std[key].map((t, i) => (
                          <li key={i}>
                            <Marked text={t} els={at({ sec: '③', part: key })} />
                          </li>
                        ))
                      ) : (
                        <li className="empty">없음</li>
                      )}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ⑤ 해설 · 적용 시 고려 사항 — 3×3 표 */}
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-doc)' }}>
            <div className="msi-card-head">
              <span>⑤ 성취기준 해설 · 적용 시 고려 사항</span>
            </div>
            <div className="msi-card-body">
              <div className="msi-table-scroll">
                <table className="an-table doc-table">
                  <thead>
                    <tr>
                      <th scope="col">구분</th>
                      <th scope="col">교육과정 문서 내용</th>
                      <th scope="col">분석 — 평가에 주는 시사점</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">성취기준 해설</th>
                      <td>
                        {std.explanation ? (
                          <ul className="info-list">
                            {sentences(std.explanation).map((t, i) => (
                              <li key={i}>
                                <Marked text={t} els={at({ sec: '⑤', part: 'explanation' })} />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <b className="empty">해설 없음</b>
                        )}
                      </td>
                      <td>
                        <MBullets items={data.explanation_implications} els={at({ sec: '⑤', part: 'explanation' })} />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">적용 시 고려 사항</th>
                      <td>
                        <ul className="info-list">
                          {areaInfo.considerations.map((t, i) => (
                            <li key={i}>
                              <Marked text={t} els={at({ sec: '⑤', part: 'consideration' })} />
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td>
                        <MBullets items={data.consideration_implications} els={at({ sec: '⑤', part: 'consideration' })} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ⑥ 성취수준 범주별 분석 — 6×6 표 */}
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-levels)' }}>
            <div className="msi-card-head">
              <span>⑥ 성취기준별 성취수준 범주별 분석</span>
              <span className="r">위에서 아래로 무엇이 빠지는지</span>
            </div>
            <div className="msi-card-body">
              <div className="msi-table-scroll">
                <table className="an-table lv-table">
                  <thead>
                    <tr>
                      <th scope="col">수준</th>
                      <th scope="col">성취수준 진술문</th>
                      <th scope="col">지식·이해</th>
                      <th scope="col">과정·기능</th>
                      <th scope="col">가치·태도</th>
                      <th scope="col">수준 구분 단서 (수식어·동사)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEVELS.map((lv) => (
                      <tr key={lv}>
                        <th scope="row">{lv}</th>
                        <td className="lv-statement">
                          <Marked
                            text={std.levels[lv]}
                            hl={cueWords(data.levels[lv].cues, std.levels[lv])}
                            els={at({ sec: '⑥', level: lv })}
                          />
                        </td>
                        {(['knowledge', 'skills', 'attitude', 'cues'] as const).map((key) => (
                          <td key={key} className={key === 'cues' ? 'cue' : ''}>
                            {/* 지식·이해, 과정·기능은 한 줄에 하나씩 점으로 */}
                            {key === 'knowledge' || key === 'skills' ? (
                              <Bullets items={data.levels[lv][key].split('\n')} />
                            ) : (
                              <Text value={data.levels[lv][key]} />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ⑦ 평가요소 추출 */}
          <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-elements)' }}>
            <div className="msi-card-head">
              <span>⑦ 평가요소 추출</span>
              <span className="r">무엇을 + 어떻게 → ~하기</span>
            </div>
            <div className="msi-card-body">
              <ElementsTable rows={data.elements} basis={basis} />
            </div>
          </section>

          {/* ⑧ 평가요소 수준화 */}
          <LevelingCard std={std} elements={data.elements} cues={data.levels} />

          <div className="md-save">
            <button
              type="button"
              className="msi-btn"
              onClick={() => downloadMarkdown(`교육과정분석_${std.code}.md`, analysisMarkdown(std, areaInfo, data))}
            >
              이 성취기준 분석 md 파일로 저장
            </button>
          </div>
        </>
      )}
    </div>
  );
}
