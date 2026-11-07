import { useEffect, useMemo, useRef, useState } from 'react';
import { api, LEVELS, type AnalysisData, type Curriculum, type Standard } from './api';
import { analysisMarkdown, downloadMarkdown } from './analysisMarkdown';
import { areaNo } from './catalog';
import ContextBar, { sectionInView, showSection, useScrollMemory } from './ContextBar';
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
  stdCode: string | null; // 탭 사이에 이어지는 성취기준 — 처음 열 때 이것을 연다
  onStdChange: (code: string) => void;
  onDevelop?: () => void; // 「이 성취기준으로 문항 개발」 (읽기 전용 배포판에는 없음)
  pickerOpen: boolean; // false 면 ① 카드 대신 화면 위 한 줄 요약이 보인다
  onBarStuck: () => void;
}

const SECTIONS = [
  { id: 'sec-ideas', label: '② 핵심 아이디어' },
  { id: 'sec-system', label: '③·④ 내용 체계' },
  { id: 'sec-doc', label: '⑤ 해설' },
  { id: 'sec-levels', label: '⑥ 성취수준' },
  { id: 'sec-elements', label: '⑦ 평가요소' },
  { id: 'sec-leveling', label: '⑧ 수준화' },
];

export default function Analysis({ subject, items, curriculum, stdCode, onStdChange, onDevelop, pickerOpen, onBarStuck }: Props) {
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

  // ◀ ▶ — 영역을 넘어 과목 전체 성취기준을 차례로
  const stdIndex = items.findIndex((s) => s.id === stdId);
  const keep = useRef<string | null>(null); // ◀▶ 뒤에도 보던 구역을 유지한다
  const goStd = (s: Standard) => {
    keep.current = sectionInView(SECTIONS.map((x) => x.id));
    pending.current = s;
    setArea(areaNo(s.code));
    setStdId(s.id!);
  };
  // ⑦ 도출 근거 낱말로 이동한 뒤 돌아올 자리
  const [backTo, setBackTo] = useState<HTMLElement | null>(null);
  useEffect(() => setBackTo(null), [stdId]);
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
  useScrollMemory('analysis', std?.code, !stale && !!data);
  useEffect(() => {
    if (stale || !keep.current) return;
    showSection(keep.current);
    keep.current = null;
  }, [stale, loadedId]); // eslint-disable-line react-hooks/exhaustive-deps
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
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
    <div className={`analysis ${stale ? 'is-loading' : ''}`} aria-busy={stale}>
      {/* ① 영역·성취기준 고르기 */}
      {pickerOpen && (
        <section className="msi-card" style={{ ['--accent' as string]: 'var(--hd-pick)' }}>
          <div className="msi-card-head">
            <h2>① 영역 · 성취기준 선택</h2>
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
          title={stale ? '불러오는 중이에요…' : std.statement}
          sections={data ? SECTIONS : []}
          onStuck={onBarStuck}
          step={{
            prev: stdIndex > 0 ? () => goStd(items[stdIndex - 1]) : undefined,
            next: stdIndex >= 0 && stdIndex < items.length - 1 ? () => goStd(items[stdIndex + 1]) : undefined,
          }}
          after={
            backTo && (
              <button type="button" className="head-btn" onClick={goBack}>
                도출 근거로 돌아가기
              </button>
            )
          }
        />
      )}

      {error && (
        <p className="status error" role="alert">
          {error}
        </p>
      )}
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
          {/* ② 핵심 아이디어 */}
          <section id="sec-ideas" className="msi-card" style={{ ['--accent' as string]: 'var(--hd-ideas)' }}>
            <div className="msi-card-head">
              <h2>② 핵심 아이디어</h2>
              <span className="r">✓ 맞닿은 문장</span>
            </div>
            <div className="msi-card-body">
              {basis.some((spots) => spots.length > 0) && (
                <p className="msi-small el-legend">밑줄은 ⑦ 평가요소의 도출 근거예요. 평가요소마다 색과 모양이 달라요.</p>
              )}
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
          <section id="sec-system" className="msi-card" style={{ ['--accent' as string]: 'var(--hd-system)' }}>
            <div className="msi-card-head">
              <h2>③·④ 내용 체계 — 범주별 내용 요소</h2>
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
                    <div role="cell" data-label="내용 요소 (교육과정 내용 체계)">
                      <ul>
                        {/* 3열(이 성취기준과 직접 관련)에 있는 요소는 형광펜 밑줄 */}
                        {areaInfo[key].map((t, i) => (
                          <li key={i}>
                            <Marked text={t} hl={std[key].includes(t) ? [t] : []} els={at({ sec: '③', part: key })} />
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div role="cell" data-label="★ 이 성취기준과 직접 관련된 요소">
                      <ul>
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
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ⑤ 해설 · 적용 시 고려 사항 — 3×3 표 */}
          <section id="sec-doc" className="msi-card" style={{ ['--accent' as string]: 'var(--hd-doc)' }}>
            <div className="msi-card-head">
              <h2>⑤ 성취기준 해설 · 적용 시 고려 사항</h2>
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
                      <td data-label="교육과정 문서 내용">
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
                      <td data-label="분석 — 평가에 주는 시사점">
                        <MBullets items={data.explanation_implications} els={at({ sec: '⑤', part: 'explanation' })} />
                      </td>
                    </tr>
                    <tr>
                      <th scope="row">적용 시 고려 사항</th>
                      <td data-label="교육과정 문서 내용">
                        <ul className="info-list">
                          {areaInfo.considerations.map((t, i) => (
                            <li key={i}>
                              <Marked text={t} els={at({ sec: '⑤', part: 'consideration' })} />
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td data-label="분석 — 평가에 주는 시사점">
                        <MBullets items={data.consideration_implications} els={at({ sec: '⑤', part: 'consideration' })} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* ⑥ 성취수준 범주별 분석 — 6×6 표 */}
          <section id="sec-levels" className="msi-card" style={{ ['--accent' as string]: 'var(--hd-levels)' }}>
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
                          />
                        </td>
                        {(['knowledge', 'skills', 'attitude', 'cues'] as const).map((key) => (
                          <td
                            key={key}
                            className={key === 'cues' ? 'cue' : ''}
                            data-label={{ knowledge: '지식·이해', skills: '과정·기능', attitude: '가치·태도', cues: '수준 구분 단서' }[key]}
                          >
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
          <section id="sec-elements" className="msi-card" style={{ ['--accent' as string]: 'var(--hd-elements)' }}>
            <div className="msi-card-head">
              <h2>⑦ 평가요소 추출</h2>
              <span className="r">무엇을 + 어떻게 → ~하기</span>
            </div>
            <div className="msi-card-body">
              <ElementsTable rows={data.elements} basis={basis} onJump={setBackTo} />
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
