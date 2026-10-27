import { useEffect, useMemo, useRef, useState } from 'react';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';
import { api, type AnalysisData, type Curriculum, type Standard } from './api';
import { areaNo } from './catalog';

// 교육과정 그래프 탭 — 영역 · 핵심 아이디어 · 성취기준을 옵시디언 그래프처럼 잇는다 (평가요소 검토용).
// 성취기준–핵심 아이디어 선은 분석의 core_idea_links. 연결이 없는 성취기준은 영역에 점선으로 붙여 눈에 띄게 한다.

type Kind = 'area' | 'idea' | 'std';

interface Node extends SimulationNodeDatum {
  id: string;
  kind: Kind;
  area: string; // 영역 번호
  label: string;
  full: string; // 전체 글 (title·패널)
  std?: Standard;
}

interface Link extends SimulationLinkDatum<Node> {
  source: string | Node;
  target: string | Node;
  loose?: boolean; // 핵심 아이디어 연결이 없어 영역에 붙인 선
}

// 영역마다 다른 머리줄 파스텔
const AREA_COLORS = ['var(--hd-pick)', 'var(--hd-ideas)', 'var(--hd-system)', 'var(--hd-doc)', 'var(--hd-levels)', 'var(--hd-elements)'];
const RADIUS: Record<Kind, number> = { area: 30, idea: 16, std: 11 };
const W = 900;
const H = 640;

const short = (t: string, n: number) => (t.length > n ? `${t.slice(0, n)}…` : t);
const idOf = (x: string | Node) => (typeof x === 'string' ? x : x.id);

interface Props {
  subject: string;
  items: Standard[];
  curriculum: Curriculum | null;
  onOpen: (stdId: number) => void; // 「분석 화면에서 보기」
}

export default function Graph({ subject, items, curriculum, onOpen }: Props) {
  const [analyses, setAnalyses] = useState<Record<number, AnalysisData | null>>({});
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ node?: Node; panFrom?: { x: number; y: number; vx: number; vy: number } } | null>(null);

  // 성취기준마다 분석을 불러온다
  useEffect(() => {
    let alive = true;
    setError('');
    setSelected(null);
    Promise.all(items.map((s) => api.analysis(s.id!).then((a) => [s.id!, a?.data ?? null] as const)))
      .then((pairs) => alive && setAnalyses(Object.fromEntries(pairs)))
      .catch((e) => alive && setError(`분석을 불러오지 못했어요: ${e.message}`));
    return () => {
      alive = false;
    };
  }, [items]);

  const { nodes, links } = useMemo(() => {
    const nodes: Node[] = [];
    const links: Link[] = [];
    for (const a of curriculum?.areas ?? []) {
      nodes.push({ id: `area-${a.no}`, kind: 'area', area: a.no, label: a.name, full: a.name });
      a.core_ideas.forEach((t, i) => {
        nodes.push({ id: `idea-${a.no}-${i}`, kind: 'idea', area: a.no, label: short(t, 12), full: t });
        links.push({ source: `area-${a.no}`, target: `idea-${a.no}-${i}` });
      });
    }
    const ids = new Set(nodes.map((n) => n.id));
    for (const s of items) {
      const no = areaNo(s.code);
      if (!ids.has(`area-${no}`)) continue;
      const id = `std-${s.id}`;
      nodes.push({ id, kind: 'std', area: no, label: s.code, full: s.statement, std: s });
      const ideas = (analyses[s.id!]?.core_idea_links ?? []).map((i) => `idea-${no}-${i}`).filter((x) => ids.has(x));
      if (ideas.length) ideas.forEach((x) => links.push({ source: x, target: id }));
      else links.push({ source: `area-${no}`, target: id, loose: true });
    }
    return { nodes, links };
  }, [curriculum, items, analyses]);

  // 서로 밀고 당기는 배치
  const simRef = useRef<ReturnType<typeof forceSimulation<Node>> | null>(null);
  useEffect(() => {
    const sim = forceSimulation(nodes)
      .force('link', forceLink<Node, Link>(links).id((n) => n.id).distance((l) => (l.loose ? 90 : 60)))
      .force('charge', forceManyBody().strength(-230))
      .force('center', forceCenter(W / 2, H / 2))
      // 영역끼리는 이어져 있지 않아 서로 밀어내기만 하므로 가운데로 살짝 당긴다
      .force('x', forceX(W / 2).strength(0.06))
      .force('y', forceY(H / 2).strength(0.1))
      .force('collide', forceCollide<Node>((n) => RADIUS[n.kind] + 6))
      .on('tick', () => setTick((t) => t + 1));
    simRef.current = sim;
    return () => {
      sim.stop();
    };
  }, [nodes, links]);

  const neighbors = useMemo(() => {
    const m = new Map<string, Set<string>>();
    const add = (a: string, b: string) => m.set(a, (m.get(a) ?? new Set()).add(b));
    for (const l of links) {
      add(idOf(l.source), idOf(l.target));
      add(idOf(l.target), idOf(l.source));
    }
    return m;
  }, [links]);

  const focus = hovered ?? selected;
  const lit = (id: string) => !focus || id === focus || !!neighbors.get(focus)?.has(id);

  // 화면 좌표 → 그래프 좌표
  const toGraph = (e: { clientX: number; clientY: number }) => {
    const r = svgRef.current!.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * W;
    const sy = ((e.clientY - r.top) / r.height) * H;
    return { x: (sx - view.x) / view.k, y: (sy - view.y) / view.k, sx, sy };
  };

  // 끄는 동안 점을 손에 붙이고 배치를 다시 움직인다
  const reheat = (n: Node) => {
    simRef.current?.alphaTarget(0.2).restart();
    n.fx = n.x;
    n.fy = n.y;
  };

  const onPointerDown = (e: React.PointerEvent, n?: Node) => {
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    if (n) {
      reheat(n);
      drag.current = { node: n };
    } else {
      const p = toGraph(e);
      drag.current = { panFrom: { x: p.sx, y: p.sy, vx: view.x, vy: view.y } };
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const p = toGraph(e);
    if (d.node) {
      d.node.fx = p.x;
      d.node.fy = p.y;
    } else if (d.panFrom) {
      const { x, y, vx, vy } = d.panFrom;
      setView((v) => ({ ...v, x: vx + p.sx - x, y: vy + p.sy - y }));
    }
  };
  const onPointerUp = () => {
    const n = drag.current?.node;
    if (n) {
      n.fx = null;
      n.fy = null;
      simRef.current?.alphaTarget(0);
    }
    drag.current = null;
  };
  const onWheel = (e: React.WheelEvent) => {
    const p = toGraph(e);
    const k = Math.min(3, Math.max(0.4, view.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
    setView({ k, x: p.sx - p.x * k, y: p.sy - p.y * k });
  };

  // 휠이 페이지를 굴리지 않게 (React onWheel 은 passive 라 막을 수 없음)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const stop = (e: WheelEvent) => e.preventDefault();
    svg.addEventListener('wheel', stop, { passive: false });
    return () => svg.removeEventListener('wheel', stop);
  }, [curriculum]);

  if (!curriculum) {
    return (
      <div className="msi-note">
        <b>{subject}</b> 과목은 교육과정 내용 체계가 아직 없어 그래프를 그릴 수 없어요.
      </div>
    );
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const sel = selected ? byId.get(selected) ?? null : null;
  const areaIdx = (no: string) => curriculum.areas.findIndex((a) => a.no === no);
  const color = (no: string) => AREA_COLORS[areaIdx(no) % AREA_COLORS.length];
  const looseCount = links.filter((l) => l.loose).length;

  return (
    <div className="graph-layout">
      <section className="msi-card graph-card" style={{ ['--accent' as string]: 'var(--hd-pick)' }}>
        <div className="msi-card-head">
          <span>영역 · 핵심 아이디어 · 성취기준</span>
          <span className="r">끌기 · 휠로 확대</span>
        </div>
        <div className="graph-legend">
          <span>
            <i className="lg-dot lg-area" /> 영역
          </span>
          <span>
            <i className="lg-dot lg-idea" /> 핵심 아이디어
          </span>
          <span>
            <i className="lg-dot lg-std" /> 성취기준 (숫자 = 평가요소 수)
          </span>
          <span>
            <i className="lg-line" /> 핵심 아이디어 연결 없음{looseCount ? ` ${looseCount}개` : ''}
          </span>
        </div>
        {error && <p className="status error">{error}</p>}
        <svg
          ref={svgRef}
          className="graph-svg"
          viewBox={`0 0 ${W} ${H}`}
          role="group"
          aria-label={`${subject} 교육과정 그래프`}
          onPointerDown={(e) => onPointerDown(e)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onClick={() => setSelected(null)}
        >
          <g transform={`translate(${view.x},${view.y}) scale(${view.k})`}>
            {links.map((l, i) => {
              const s = l.source as Node;
              const t = l.target as Node;
              if (s.x == null || t.x == null) return null;
              const on = !focus || idOf(l.source) === focus || idOf(l.target) === focus;
              return (
                <line
                  key={i}
                  className={`g-link ${l.loose ? 'is-loose' : ''} ${on ? '' : 'is-dim'}`}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                />
              );
            })}
            {nodes.map((n) => {
              if (n.x == null) return null;
              const r = RADIUS[n.kind];
              const count = n.std ? analyses[n.std.id!]?.elements.length ?? 0 : 0;
              return (
                <g
                  key={n.id}
                  className={`g-node g-${n.kind} ${lit(n.id) ? '' : 'is-dim'} ${selected === n.id ? 'is-sel' : ''}`}
                  transform={`translate(${n.x},${n.y})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`${n.kind === 'area' ? '영역' : n.kind === 'idea' ? '핵심 아이디어' : '성취기준'} ${n.full}`}
                  aria-pressed={selected === n.id}
                  onPointerDown={(e) => onPointerDown(e, n)}
                  onPointerEnter={() => setHovered(n.id)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(n.id)}
                  onBlur={() => setHovered(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(n.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(n.id);
                    }
                  }}
                >
                  <title>{n.full}</title>
                  <circle r={r} style={{ fill: n.kind === 'idea' ? 'var(--msi-paper)' : color(n.area) }} />
                  {n.kind === 'idea' && <circle r={r - 6} style={{ fill: color(n.area) }} />}
                  {n.kind === 'std' && (
                    <text className={`g-count ${count ? '' : 'is-zero'}`} dy="0.35em">
                      {count}
                    </text>
                  )}
                  {/* 핵심 아이디어 이름표는 길어서 겹치므로, 가리키거나 누른 점 주변에서만 보인다 */}
                  {(n.kind !== 'idea' || (focus && lit(n.id))) && (
                    <text className="g-label" y={r + 15}>
                      {n.kind === 'area' ? `${Number(n.area)}. ${n.label}` : n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </section>

      <aside className="msi-card graph-panel" style={{ ['--accent' as string]: 'var(--hd-elements)' }}>
        <div className="msi-card-head">
          <span>{sel ? (sel.kind === 'area' ? '영역' : sel.kind === 'idea' ? '핵심 아이디어' : '성취기준') : '살펴보기'}</span>
        </div>
        <div className="msi-card-body">
          {!sel ? (
            <p className="msi-small">점을 누르면 여기에 내용이 나와요. 성취기준(작은 점)을 누르면 평가요소를 검토할 수 있어요.</p>
          ) : sel.kind === 'std' && sel.std ? (
            <StdPanel std={sel.std} data={analyses[sel.std.id!] ?? null} ideas={(neighbors.get(sel.id) ?? new Set())} byId={byId} onOpen={onOpen} />
          ) : (
            <>
              <p className="info-p">
                <b>{sel.full}</b>
              </p>
              <h3 className="info-title">이어진 {sel.kind === 'area' ? '핵심 아이디어·성취기준' : '성취기준'}</h3>
              <ul className="graph-links">
                {[...(neighbors.get(sel.id) ?? [])]
                  .map((id) => byId.get(id)!)
                  .filter((n) => n.kind !== 'area')
                  .map((n) => (
                    <li key={n.id}>
                      <button type="button" className="graph-link-btn" onClick={() => setSelected(n.id)}>
                        {n.kind === 'std' ? `[${n.label}] ${n.full}` : n.full}
                      </button>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

function StdPanel({
  std,
  data,
  ideas,
  byId,
  onOpen,
}: {
  std: Standard;
  data: AnalysisData | null;
  ideas: Set<string>;
  byId: Map<string, Node>;
  onOpen: (stdId: number) => void;
}) {
  const ideaNodes = [...ideas].map((id) => byId.get(id)!).filter((n) => n.kind === 'idea');
  return (
    <>
      <p className="info-p">
        <b>[{std.code}]</b> {std.statement}
      </p>
      <div className="info-block">
        <h3 className="info-title">이어진 핵심 아이디어</h3>
        {ideaNodes.length ? (
          <ul className="info-list">
            {ideaNodes.map((n) => (
              <li key={n.id}>{n.full}</li>
            ))}
          </ul>
        ) : (
          <p className="msi-small">연결된 핵심 아이디어가 없어요.</p>
        )}
      </div>
      <div className="info-block">
        <h3 className="info-title">평가요소 {data?.elements.length ?? 0}개</h3>
        {!data ? (
          <p className="msi-small">아직 분석이 없어요.</p>
        ) : (
          <ol className="graph-elements">
            {data.elements.map((el, i) => (
              <li key={i}>
                <b>{el.element}</b>
                {el.reason && <p className="msi-small">{el.reason}</p>}
              </li>
            ))}
          </ol>
        )}
      </div>
      <button type="button" className="msi-btn secondary" onClick={() => onOpen(std.id!)}>
        분석 화면에서 보기
      </button>
    </>
  );
}
