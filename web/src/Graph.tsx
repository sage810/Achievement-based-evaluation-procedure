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
const AREA_COLORS = ['var(--area-1)', 'var(--area-2)', 'var(--area-3)', 'var(--area-4)', 'var(--area-5)', 'var(--area-6)'];
const RADIUS: Record<Kind, number> = { area: 30, idea: 16, std: 11 };
const W = 900;
const H = 640;

const clampZoom = (k: number) => Math.min(4, Math.max(0.4, k));

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
  const [loaded, setLoaded] = useState(false); // 분석을 다 받기 전에는 「연결 없음」으로 잘못 그리지 않는다
  const [rover, setRover] = useState<string | null>(null); // 탭으로 들어오는 점 하나(나머지는 방향키로 이동)
  const [svgW, setSvgW] = useState(W); // 화면에 그려진 폭 — 이름표 크기 맞춤에 쓴다
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ node?: Node; panFrom?: { x: number; y: number; vx: number; vy: number } } | null>(null);
  const panned = useRef(false); // 배경을 끈 직후의 click 으로 선택이 풀리지 않게

  // 이 과목의 분석을 한 번에 불러온다
  useEffect(() => {
    if (!curriculum) return;
    let alive = true;
    setError('');
    setSelected(null);
    setLoaded(false);
    api
      .analysesOf(curriculum.school_level, curriculum.subject)
      .then((all) => {
        if (!alive) return;
        setAnalyses(Object.fromEntries(items.map((s) => [s.id!, all[s.id!]?.data ?? null])));
        setLoaded(true);
      })
      .catch((e) => alive && setError(`분석을 불러오지 못했어요: ${e.message}`));
    return () => {
      alive = false;
    };
  }, [items, curriculum]);

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
    // 움직이는 동안에는 React 를 거치지 않고 위치만 옮긴다 — 매번 다시 그리면 느린 컴퓨터에서 화면이 멎는다
    const at = new Map(nodes.map((n) => [n.id, n]));
    const paint = () => {
      const svg = svgRef.current;
      if (!svg) return;
      svg.querySelectorAll<SVGLineElement>('line[data-link]').forEach((el) => {
        const l = links[Number(el.dataset.link)];
        const s = l?.source as Node;
        const t = l?.target as Node;
        if (s?.x == null || t?.x == null) return;
        el.setAttribute('x1', String(s.x));
        el.setAttribute('y1', String(s.y));
        el.setAttribute('x2', String(t.x));
        el.setAttribute('y2', String(t.y));
      });
      svg.querySelectorAll<SVGGElement>('g[data-at]').forEach((el) => {
        const n = at.get(el.dataset.at!);
        if (n) el.setAttribute('transform', `translate(${n.x},${n.y})`);
      });
    };
    const sim = forceSimulation(nodes)
      .force('link', forceLink<Node, Link>(links).id((n) => n.id).distance((l) => (l.loose ? 90 : 60)))
      .force('charge', forceManyBody().strength(-230))
      .force('center', forceCenter(W / 2, H / 2))
      // 영역끼리는 이어져 있지 않아 서로 밀어내기만 하므로 가운데로 살짝 당긴다
      .force('x', forceX(W / 2).strength(0.06))
      .force('y', forceY(H / 2).strength(0.1))
      .force('collide', forceCollide<Node>((n) => RADIUS[n.kind] + 6))
      .on('tick', paint);
    simRef.current = sim;
    setTick((t) => t + 1); // 위치가 정해졌으니 점을 그린다. 이후 움직임은 paint 가 맡는다
    // 움직임 줄이기: 점이 날아다니지 않게 미리 다 계산해서 한 번에 그린다
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sim.stop();
      sim.tick(300);
    }
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

  // 패널이 그래프 아래에 있을 때, 점을 고르면 패널 머리가 화면 아래쪽에 들어올 만큼만 굴린다 (그래프가 밀려나지 않게)
  const panelRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!selected || !panelRef.current) return;
    const dot = svgRef.current?.querySelector(`[data-node="${selected}"]`)?.getBoundingClientRect();
    // 고른 점이 화면 위로 밀려나지 않는 만큼만
    const over = Math.min(panelRef.current.getBoundingClientRect().top - window.innerHeight * 0.6, dot ? dot.top - 24 : Infinity);
    if (over <= 0) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollBy({ top: over, behavior: still ? 'auto' : 'smooth' });
  }, [selected]);

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
      panned.current = false;
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
      if (Math.hypot(p.sx - x, p.sy - y) > 3) panned.current = true;
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
    if (!e.ctrlKey && !e.metaKey) return; // 그냥 휠은 페이지 스크롤에 양보한다
    const p = toGraph(e);
    const k = clampZoom(view.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12));
    setView({ k, x: p.sx - p.x * k, y: p.sy - p.y * k });
  };
  // ＋·－ 버튼 — 키보드·터치로도 확대. 그림 가운데를 기준으로
  const zoomBy = (f: number) =>
    setView((v) => {
      const k = clampZoom(v.k * f);
      return { k, x: W / 2 - ((W / 2 - v.x) / v.k) * k, y: H / 2 - ((H / 2 - v.y) / v.k) * k };
    });

  // 방향키로 점 사이를 옮겨 다닌다. 옮겨 간 점이 화면 밖이면 가운데로 데려온다
  const moveFocus = (n: Node, key: string) => {
    const i = nodes.indexOf(n);
    const step = key === 'ArrowRight' || key === 'ArrowDown' ? 1 : -1;
    const next =
      key === 'Home' ? nodes[0] : key === 'End' ? nodes[nodes.length - 1] : nodes[(i + step + nodes.length) % nodes.length];
    setRover(next.id);
    const sx = next.x! * view.k + view.x;
    const sy = next.y! * view.k + view.y;
    if (sx < 0 || sx > W || sy < 0 || sy > H) setView({ ...view, x: W / 2 - next.x! * view.k, y: H / 2 - next.y! * view.k });
    svgRef.current?.querySelector<SVGGElement>(`[data-node="${next.id}"]`)?.focus();
  };

  // Ctrl+휠이 브라우저 확대가 되지 않게 (React onWheel 은 passive 라 막을 수 없음)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const stop = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) e.preventDefault();
    };
    svg.addEventListener('wheel', stop, { passive: false });
    const ro = new ResizeObserver(() => setSvgW(svg.getBoundingClientRect().width || W));
    ro.observe(svg);
    return () => {
      svg.removeEventListener('wheel', stop);
      ro.disconnect();
    };
  }, [curriculum, loaded]);

  if (!curriculum) {
    return (
      <div className="msi-note">
        <b>{subject}</b> 과목은 교육과정 내용 체계가 아직 없어 그래프를 그릴 수 없어요.
      </div>
    );
  }
  if (error) {
    return (
      <p className="status error" role="alert">
        {error}
      </p>
    );
  }
  if (!loaded) {
    return (
      <div className="msi-note" role="status">
        불러오는 중이에요…
      </div>
    );
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const sel = selected ? byId.get(selected) ?? null : null;
  const areaIdx = (no: string) => curriculum.areas.findIndex((a) => a.no === no);
  const color = (no: string) => AREA_COLORS[areaIdx(no) % AREA_COLORS.length];
  const looseCount = links.filter((l) => l.loose).length;
  const tabNode = byId.has(rover ?? '') ? rover : nodes[0]?.id;
  // 지도처럼: 이름표는 화면 크기와 확대에 상관없이 같은 글자 크기. 점이 빽빽할 만큼 작으면 영역 이름만 보이고 나머지는 확대하면 나온다
  const scale = (svgW / W) * view.k;
  const crowded = scale < 0.7;

  return (
    <div className="graph-layout">
      <section className="msi-card graph-card sec-pick">
        <div className="msi-card-head graph-head">
          <h2>영역 · 핵심 아이디어 · 성취기준</h2>
          <div className="graph-tools">
            <span className="r hint-mouse">끌기 · Ctrl+휠로 확대 · 방향키로 점 이동</span>
            <span className="r hint-touch">좌우로 밀기 · ＋－로 확대</span>
            <button type="button" className="head-btn" aria-label="확대" title="확대" onClick={() => zoomBy(1.25)}>
              ＋
            </button>
            <button type="button" className="head-btn" aria-label="축소" title="축소" onClick={() => zoomBy(1 / 1.25)}>
              －
            </button>
            <button type="button" className="head-btn" onClick={() => setView({ x: 0, y: 0, k: 1 })}>
              원위치
            </button>
          </div>
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
        <svg
          ref={svgRef}
          className={`graph-svg ${view.k > 1 ? 'is-zoomed' : ''}`}
          viewBox={`0 0 ${W} ${H}`}
          role="group"
          aria-label={`${subject} 교육과정 그래프`}
          style={{ ['--g-u' as string]: 1 / scale }}
          onPointerDown={(e) => onPointerDown(e)}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            // 터치를 브라우저가 페이지 스크롤로 가져간 경우 — 그새 조금 밀린 그래프를 되돌린다
            const from = drag.current?.panFrom;
            if (from) setView((v) => ({ ...v, x: from.vx, y: from.vy }));
            onPointerUp();
          }}
          onWheel={onWheel}
          onClick={() => {
            if (!panned.current) setSelected(null);
            panned.current = false;
          }}
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
                  data-link={i}
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
                  data-node={n.id}
                  data-at={n.id}
                  tabIndex={n.id === tabNode ? 0 : -1}
                  role="button"
                  aria-label={
                    n.std
                      ? `성취기준 ${n.std.code} ${n.full}, 평가요소 ${count}개`
                      : `${n.kind === 'area' ? '영역' : '핵심 아이디어'} ${n.full}`
                  }
                  aria-pressed={selected === n.id}
                  onPointerDown={(e) => onPointerDown(e, n)}
                  onPointerEnter={() => setHovered(n.id)}
                  onPointerLeave={() => setHovered(null)}
                  onFocus={() => setHovered(n.id)}
                  onBlur={() => setHovered(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRover(n.id);
                    setSelected(n.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelected(n.id);
                    } else if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
                      e.preventDefault();
                      moveFocus(n, e.key);
                    }
                  }}
                >
                  <title>{n.full}</title>
                  <circle r={r} style={{ fill: n.kind === 'idea' ? 'var(--msi-paper)' : color(n.area) }} />
                  {n.kind === 'idea' && <circle r={r - 6} style={{ fill: color(n.area) }} />}
                  {n.kind === 'std' && !crowded && (
                    <text className={`g-count ${count ? '' : 'is-zero'}`} dy="0.35em">
                      {count}
                    </text>
                  )}
                </g>
              );
            })}
            {/* 이름표는 점을 다 그린 뒤에 그려 다른 점에 가리지 않게 한다 */}
            {nodes.map((n) => {
              if (n.x == null) return null;
              // 핵심 아이디어 이름표는 길어서 겹치므로, 가리키거나 누른 점 주변에서만 보인다
              if (n.kind === 'idea' && !(focus && lit(n.id))) return null;
              if (n.kind === 'std' && crowded && !(focus && lit(n.id))) return null;
              return (
                <g key={n.id} data-at={n.id} className={`g-tag g-${n.kind} ${lit(n.id) ? '' : 'is-dim'}`} transform={`translate(${n.x},${n.y})`}>
                  <text className="g-label" y={RADIUS[n.kind]} dy="1.25em">
                    {/* 아주 좁으면 영역 이름끼리 겹치므로 번호만. 누르면 이름이 나온다 */}
                    {n.kind !== 'area'
                      ? n.label
                      : scale < 0.45 && !(focus && lit(n.id))
                        ? `${Number(n.area)}`
                        : `${Number(n.area)}. ${n.label}`}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </section>

      <aside ref={panelRef} className="msi-card graph-panel sec-elements">
        <div className="msi-card-head">
          <h2>{sel ? (sel.kind === 'area' ? '영역' : sel.kind === 'idea' ? '핵심 아이디어' : '성취기준') : '살펴보기'}</h2>
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
