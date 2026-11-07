import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api, LEVELS, type AnalysisData, type Curriculum, type Standard } from './api';
import { analysisMarkdown, downloadMarkdown } from './analysisMarkdown';
import { areaNo } from './catalog';
import ContextBar, { useScrollMemory } from './ContextBar';
import DocTable from './DocTable';
import ElementsTable from './ElementsTable';
import LevelingCard from './Leveling';
import { categoryTints, cueWords, EL_COLORS, forms, Marked, parseBasis, wordsAt, type ElWord, type Spot, type Where } from './basisMarks';
import { Bullets, Text } from './ReadOnly';

// 교육과정 분석 탭 — 연수 양식(①~⑧) 순서대로 한 성취기준의 분석을 보여 준다.
// 읽기 전용: 내용은 Claude Code 가 채우고 선생님은 고치지 않는다(선생님 지시 2026-10-24).

const CATS = [
  ['knowledge', '지식·이해'],
  ['skills', '과정·기능'],
  ['attitude', '가치·태도'],
] as const;

// 성취기준 → 연결점 → 핵심 아이디어 — 위에서 아래로 문장처럼 읽는다
const CONN_STEPS = [
  ['standard', '이 성취기준을 배우면'],
  ['link', '이 지점을 거쳐'],
  ['idea', '이 핵심 아이디어에 다가가요'],
] as const;

// 해설 문단을 문장(「~다.」) 단위로 나눈다
const sentences = (text: string) => text.split(/(?<=다\.)\s+/).filter((t) => t.trim());

// 읽기 전용 글·점 목록 (ReadOnly 의 Text·Bullets 와 같고, 평가요소 근거 표시만 더함)
function MText({ value, els, hl }: { value: string; els: ElWord[]; hl?: string[] }) {
  return value.trim() ? (
    <div className="ro-text">
      <Marked text={value} hl={hl} els={els} />
    </div>
  ) : (
    <span className="empty">—</span>
  );
}

interface Props {
  subject: string;
  items: Standard[];
  curriculum: Curriculum | null;
  overview: ReactNode; // ③ 바로 위에 놓는 과목 개요 카드
  stdCode: string | null; // 탭 사이에 이어지는 성취기준 — 처음 열 때 이것을 연다
  onStdChange: (code: string) => void;
  onDevelop?: () => void; // 「이 성취기준으로 문항 개발」 (읽기 전용 배포판에는 없음)
  pickerOpen: boolean; // false 면 ② 카드 대신 화면 위 한 줄 요약이 보인다
  onBarStuck: () => void;
}

const SECTIONS = [
  { id: 'sec-ideas', label: '③ 핵심 아이디어' },
  { id: 'sec-system', label: '④ 내용 체계' },
  { id: 'sec-doc', label: '⑤ 해설' },
  { id: 'sec-levels', label: '⑥ 성취수준' },
  { id: 'sec-elements', label: '⑦ 평가요소' },
  { id: 'sec-leveling', label: '⑧ 수준화' },
];

export default function Analysis({ subject, items, curriculum, overview, stdCode, onStdChange, onDevelop, pickerOpen, onBarStuck }: Props) {
  const areas = curriculum?.areas ?? [];
  const pending = useRef(items.find((s) => s.code === stdCode) ?? null);
  const firstArea = () => {
    const p = pending.current;
    const same = p && p.subject === curriculum?.subject && p.school_level === curriculum?.school_level;
    return same ? areaNo(p.code) : areas[0]?.no ?? '';
  };
  const [area, setArea] = useState(firstArea);
  const inArea = useMemo(() => items.filter((s) => areaNo(s.code) === area), [items, area]);
  const [stdId, setStdId] = useState<number | null>(() => {
    const p = pending.current;
    return p && inArea.includes(p) ? p.id! : inArea[0]?.id ?? null;
  });
  const std = items.find((s) => s.id === stdId) ?? null;
  const areaInfo = areas.find((a) => a.no === area) ?? null;
  useEffect(() => {
    if (std) onStdChange(std.code);
  }, [std?.code]); // eslint-disable-line react-hooks/exhaustive-deps

  // ⑦ 도출 근거 카드로 이동한 뒤 돌아올 자리
  const [backTo, setBackTo] = useState<HTMLElement | null>(null);
  // 본문에 근거를 칠해 볼 평가요소 (없으면 본문에 표시 없음)
  const [pick, setPick] = useState<number | null>(null);
  useEffect(() => {
    setBackTo(null);
    setPick(null);
  }, [stdId]);
  const goBack = () => {
    if (!backTo) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    backTo.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' });
    backTo.focus({ preventScroll: true });
    setBackTo(null);
  };

  const [data, setData] = useState<AnalysisData | null>(null);
  const [loadedId, setLoadedId] = useState<number | null>(null); // data 가 어느 성취기준 것인지
  const stale = stdId !== null && loadedId !== stdId; // 다음 성취기준을 받는 중 — 지금 보이는 분석은 이전 것
  // ⑤는 처음에 접어 둔다. 펼친 채 탭을 옮겼다 와도 읽던 자리가 맞도록 창을 닫기 전까지 기억한다
  const [docOpen, setDocOpen] = useState(() => {
    try {
      return sessionStorage.getItem('analysis-doc-open') === '1';
    } catch {
      return false;
    }
  });
  const toggleDoc = (open: boolean) => {
    setDocOpen(open);
    try {
      sessionStorage.setItem('analysis-doc-open', open ? '1' : '0');
    } catch {
      /* 기억 못 해도 동작에는 문제없음 */
    }
  };
  useScrollMemory('analysis', std?.code, !stale && !!data);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [connHint, setConnHint] = useState(false); // 「성취기준과의 연결」 ? 질문
  // ⑥ 진술문의 범주 색 — 근거 번호를 고를 때마다 다시 계산하지 않게 둔다
  const catTints = useMemo(
    () => (data && std ? Object.fromEntries(LEVELS.map((l) => [l, categoryTints(std.levels[l], data.levels[l])])) : null),
    [data, std],
  );
  // 평가요소마다 도출 근거가 가리키는 곳 — 위 ③④⑤⑥ 본문에 표시
  // 근거가 가리킨 칸·수준 줄에 그 말이 없으면 같은 구역 전체에서 찾는다
  // (예: 「④ 지식·이해(컴퓨팅 시스템의 구성요소)」는 ④ 과정·기능 줄에만 그 말이 있음)
  const basis = useMemo(() => {
    const raw = data?.elements.map((e) => parseBasis(e.basis)) ?? [];
    if (!data || !std || !areaInfo) return raw;
    const textOf = (s: Pick<Spot, 'sec' | 'part' | 'levels'>): string => {
      if (s.sec === '③') return [...areaInfo.core_ideas, ...Object.values(data.core_idea_connection)].join('\n');
      if (s.sec === '④') {
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
  // 고른 평가요소의 근거가 구역마다 몇 곳인지 — 구역 칩에 붙인다
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    const next: Record<string, number> = {};
    if (pick !== null) {
      for (const { id } of SECTIONS) {
        next[id] = document.getElementById(id)?.querySelectorAll(`.ul[data-el="${pick}"]`).length ?? 0;
      }
    }
    setCounts(next);
  }, [pick, basis]);

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
      setLoading(false);
      return;
    }
    let alive = true;
    setError('');
    setLoading(true);
    api
      .analysis(stdId)
      .then((a) => {
        if (!alive) return;
        setData(a?.data ?? null);
        setLoadedId(stdId);
        setLoading(false);
      })
      .catch((e) => {
        if (!alive) return;
        setData(null);
        setLoadedId(stdId);
        setLoading(false);
        setError(`분석을 불러오지 못했어요: ${e.message}`);
      });
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
    <div className={`analysis ${stale ? 'is-loading' : ''}`} aria-busy={stale} data-pick={pick ?? undefined}>
      {/* ② 영역·성취기준 고르기 */}
      {pickerOpen && (
        <section className="msi-card sec-pick">
          <div className="msi-card-head">
            <h2>② 영역 · 성취기준 선택</h2>
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
              {/* 선택칸은 글이 길면 잘리므로 전문을 아래에 한 번 더 보여 준다 */}
              {std && (
                <p className="msi-small std-full">
                  [{std.code}] {std.statement}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {std && (
        <ContextBar
          label={`[${std.code}]`}
          title={std.statement}
          titleAlways
          sections={data ? SECTIONS.map((s) => ({ ...s, count: counts[s.id] })) : []}
          onStuck={onBarStuck}
          below={
            !!data?.elements.length && (
              <div className="ev-row">
                <div className="ev-pick" role="group" aria-labelledby="ev-label">
                  <span id="ev-label" className="ev-label">
                    근거 보기
                  </span>
                  {data.elements.map((e, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`ev-pill ${pick === i ? `el-c${i % EL_COLORS}` : ''}`}
                      aria-pressed={pick === i}
                      aria-label={`평가요소 ${i + 1}`}
                      title={e.element}
                      onClick={() => setPick(pick === i ? null : i)}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <p className={`ev-name ${pick === null ? 'is-hint' : `el-c${pick % EL_COLORS}`}`} aria-live="polite">
                  {pick === null ? (
                    '번호를 고르면 그 평가요소의 근거가 본문에 칠해져요.'
                  ) : (
                    <>
                      <b>평가요소 {pick + 1}</b>
                      {data.elements[pick]?.element}
                    </>
                  )}
                </p>
                {backTo && (
                  <button type="button" className="head-btn" onClick={goBack}>
                    도출 근거로 돌아가기
                  </button>
                )}
              </div>
            )
          }
        />
      )}

      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}
      {overview}
      {!std || !areaInfo ? (
        <div className="msi-note">이 영역에 성취기준이 없어요.</div>
      ) : !data ? (
        error ? null : loading ? (
          <div className="msi-note" role="status">
            불러오는 중이에요…
          </div>
        ) : (
          <div className="msi-note">이 성취기준은 아직 분석이 없어요. Claude Code에 분석을 채워 달라고 말해 주세요.</div>
        )
      ) : (
        <>
          {/* ③ 핵심 아이디어 */}
          <section id="sec-ideas" className="msi-card sec-ideas">
            <div className="msi-card-head">
              <h2>③ 핵심 아이디어</h2>
              <span className="r">✓ 맞닿은 문장</span>
            </div>
            <div className="msi-card-body">
              <ul className="idea-list">
                {/* 맞닿은 문장을 맨 위로 — 나머지는 점선 칸으로 낮춘다 */}
                {areaInfo.core_ideas
                  .map((t, i) => ({ t, on: data.core_idea_links.includes(i) }))
                  .sort((a, b) => Number(b.on) - Number(a.on))
                  .map(({ t, on }) => (
                    <li key={t}>
                      <div className={`idea ${on ? 'is-on' : ''}`}>
                        {on && (
                          <span className="idea-mark" role="img" aria-label="맞닿음">
                            ✓
                          </span>
                        )}
                        <span>
                          <Marked text={t} els={at({ sec: '③' })} />
                        </span>
                      </div>
                    </li>
                  ))}
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
              <ol className="conn-flow">
                {CONN_STEPS.map(([key, lead]) => (
                  <li key={key} className="conn-step">
                    <span className="conn-lead">{lead}</span>
                    <div className={`conn-box conn-${key}`}>
                      <MText value={data.core_idea_connection[key]} els={at({ sec: '③' })} />
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* ④ 내용 체계 */}
          <section id="sec-system" className="msi-card sec-system">
            <div className="msi-card-head">
              <h2>④ 내용 체계 — 범주별 내용 요소</h2>
            </div>
            <div className="msi-card-body">
              <div className="ks-table" role="table" aria-label="범주별 내용 요소">
                <div className="ks-head" role="row">
                  <span role="columnheader">범주</span>
                  <span role="columnheader">내용 요소 (교육과정 내용 체계)</span>
                  <span role="columnheader">★ 이 성취기준과 직접 관련된 요소</span>
                </div>
                {CATS.map(([key, label]) => {
                  const source = areaInfo[key];
                  const related = std[key];
                  const els = at({ sec: '④', part: key });
                  // 뽑힌 요소는 왼쪽 목록과 같은 줄에 화살표로 잇는다. 왼쪽에 같은 말이 없는 요소는 맨 아래에
                  const lines = [...source, ...related.filter((t) => !source.includes(t))];
                  const rows = lines.length ? lines : [''];
                  return (
                    <div key={key} className="ks-group" role="rowgroup">
                      {rows.map((t, i) => {
                        const inSource = source.includes(t);
                        const isRelated = related.includes(t);
                        const on = inSource && isRelated ? 'is-on' : '';
                        return (
                          <div key={i} className="ks-line" role="row">
                            {i === 0 && (
                              <b className="ks-cat" role="rowheader" aria-rowspan={rows.length} style={{ gridRowEnd: `span ${rows.length}` }}>
                                {label}
                              </b>
                            )}
                            <div className={`ks-src ${on}`} role="cell">
                              {inSource && (
                                <span>
                                  <Marked text={t} els={els} />
                                </span>
                              )}
                            </div>
                            <div className={`ks-got ${on}`} role="cell">
                              {isRelated ? (
                                <span className="ks-sticker">
                                  <Marked text={t} els={els} />
                                </span>
                              ) : (
                                i === 0 && !related.length && <span className="empty">없음</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ⑤ 해설 · 적용 시 고려 사항 — 3×3 표 */}
          <details
            id="sec-doc"
            className="msi-card info-card sec-doc"
            open={docOpen}
            onToggle={(e) => toggleDoc(e.currentTarget.open)}
          >
            <summary className="msi-card-head">
              <h2>⑤ 성취기준 해설 · 적용 시 고려 사항</h2>
              <span className="r" />
            </summary>
            <div className="msi-card-body">
              <div className="msi-table-scroll">
                <DocTable
                  rows={[
                    {
                      label: '성취기준 해설',
                      source: std.explanation ? sentences(std.explanation) : [],
                      implications: data.explanation_implications,
                      els: at({ sec: '⑤', part: 'explanation' }),
                      empty: '해설 없음',
                    },
                    {
                      label: '적용 시 고려 사항',
                      source: areaInfo.considerations,
                      implications: data.consideration_implications,
                      els: at({ sec: '⑤', part: 'consideration' }),
                    },
                  ]}
                />
              </div>
            </div>
          </details>

          {/* ⑥ 성취수준 범주별 분석 — 6×6 표 */}
          <section id="sec-levels" className="msi-card sec-levels">
            <div className="msi-card-head">
              <h2>⑥ 성취기준별 성취수준 범주별 분석</h2>
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
                        <td className="lv-statement" data-label="성취수준 진술문">
                          <Marked
                            text={std.levels[lv]}
                            hl={cueWords(data.levels[lv].cues, std.levels[lv])}
                            els={at({ sec: '⑥', level: lv })}
                            tint={catTints?.[lv]}
                          />
                        </td>
                        {(['knowledge', 'skills', 'attitude', 'cues'] as const).map((key) => (
                          <td
                            key={key}
                            className={key === 'cues' ? 'cue' : ''}
                            data-label={{ knowledge: '지식·이해', skills: '과정·기능', attitude: '가치·태도', cues: '수준 구분 단서' }[key]}
                          >
                            {/* 지식·이해, 과정·기능은 한 줄에 하나씩 점으로. 단서는 진술문에서 뽑은 낱말을 같은 모양으로 */}
                            {key === 'cues' ? (
                              <MText value={data.levels[lv].cues} els={[]} hl={cueWords(data.levels[lv].cues, std.levels[lv])} />
                            ) : key === 'knowledge' || key === 'skills' ? (
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
          <section id="sec-elements" className="msi-card sec-elements">
            <div className="msi-card-head">
              <h2>⑦ 평가요소 추출</h2>
              <span className="r">무엇을 + 어떻게 → ~하기</span>
            </div>
            <div className="msi-card-body">
              <ElementsTable rows={data.elements} basis={basis} pick={pick} onPick={setPick} onJump={setBackTo} />
            </div>
          </section>

          {/* ⑧ 평가요소 수준화 */}
          <LevelingCard std={std} elements={data.elements} cues={data.levels} />

          <div className="md-save">
            {onDevelop && (
              <button type="button" className="msi-btn" onClick={onDevelop}>
                이 성취기준으로 문항 개발
              </button>
            )}
            <button
              type="button"
              className={`msi-btn ${onDevelop ? 'secondary' : ''}`}
              onClick={() => downloadMarkdown(`교육과정분석_${std.code}.md`, analysisMarkdown(std, areaInfo, data))}
            >
              분석 내용을 파일(.md)로 저장
            </button>
          </div>
        </>
      )}
    </div>
  );
}
