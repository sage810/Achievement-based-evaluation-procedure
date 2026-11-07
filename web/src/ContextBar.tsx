import { useEffect, useRef, useState, type ReactNode } from 'react';

// 긴 화면에서 늘 위에 붙어 있는 막대 — 지금 무엇을 보는지와 구역 이동.
// 구역(id)은 화면에 있는 카드 id 로, 스크롤하면 지금 구역이 표시된다.

export interface BarSection {
  id: string;
  label: string;
  count?: number; // 칩에 붙는 작은 수 — 이 구역에 있는 고른 평가요소의 근거
}

// 구역으로 이동 — 키보드 포커스도 함께 옮겨, 그 자리에서 이어 읽을 수 있게 한다
export function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (el instanceof HTMLDetailsElement) el.open = true; // 접혀 있는 카드는 펼치고 간다
  el.tabIndex = -1;
  el.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'start' });
  el.focus({ preventScroll: true });
}

// 화면 위쪽 띠를 지나는 구역 — ◀▶ 뒤에도 같은 구역을 보게 하려고 미리 재 둔다
export function sectionInView(ids: string[]) {
  return (
    ids
      .filter((id) => {
        const r = document.getElementById(id)?.getBoundingClientRect();
        return r && r.top < 280 && r.bottom > 120;
      })
      .pop() ?? null
  );
}

// 움직임 없이 그 구역으로 (포커스는 누른 버튼에 그대로 둔다)
export function showSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ block: 'start' });
}

// 읽던 자리 — 탭을 옮겼다 오거나 새로 고침해도, 같은 내용(id)이면 그 자리로 돌아온다. 창을 닫으면 잊는다
export function useScrollMemory(tab: string, id: string | number | null | undefined, ready: boolean) {
  const key = `scroll:${tab}`;
  const idRef = useRef(id);
  idRef.current = id;
  const restored = useRef(false);
  useEffect(() => {
    if (!ready || restored.current) return;
    restored.current = true;
    try {
      const saved = JSON.parse(sessionStorage.getItem(key) ?? 'null');
      // 자식들의 첫 효과(근거 링크 등)로 높이가 바뀐 뒤에 옮긴다
      if (saved && saved.id === id) requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, saved.y)));
    } catch {
      /* 기억 못 해도 동작에는 문제없음 */
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const save = () => {
      if (!restored.current) return;
      try {
        sessionStorage.setItem(key, JSON.stringify({ id: idRef.current, y: Math.round(window.scrollY) }));
      } catch {
        /* 기억 못 해도 동작에는 문제없음 */
      }
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, [key]);
}

// 이 탭에서 읽던 자리가 남아 있는지 — 새 창이면 없다
export function hasScrollMemory(tab: string) {
  try {
    return (JSON.parse(sessionStorage.getItem(`scroll:${tab}`) ?? 'null')?.y ?? 0) > 0;
  } catch {
    return false;
  }
}

// 누른 버튼이 사라졌을 때(지우기 등) 포커스가 페이지 처음으로 튀지 않게, 화면 첫 카드 제목으로 옮긴다
export function focusFirstHeading() {
  requestAnimationFrame(() => {
    const h = document.querySelector<HTMLElement>('.analysis .msi-card-head h2');
    if (!h) return;
    h.tabIndex = -1;
    h.focus({ preventScroll: true });
  });
}

interface Props {
  label: string; // 굵게 보이는 짧은 이름 (성취기준 코드 등) — 바뀌면 화면 낭독기에도 알린다
  title?: string; // 그 옆 설명 — 위 선택 카드가 지나간 뒤(막대가 붙은 뒤)에만 한 줄로. 전체는 선택 카드에 있다
  sections: BarSection[];
  step?: { prev?: () => void; next?: () => void }; // 있으면 ◀ ▶ (없는 쪽은 눌러도 아무 일 없음)
  after?: ReactNode; // 돌아가기 버튼 자리
  onStuck?: () => void; // 막대가 화면 위에 붙었을 때 — 위 선택 영역을 지나갔다는 뜻
  titleAlways?: boolean; // title 을 막대가 붙기 전에도 늘 보여 준다
  below?: ReactNode; // 막대 맨 아래 줄
}

// 끝에 닿아도 포커스를 잃지 않도록 disabled 대신 aria-disabled
function StepButton({ dir, go }: { dir: 'prev' | 'next'; go?: () => void }) {
  const name = dir === 'prev' ? '이전 성취기준' : '다음 성취기준';
  return (
    <button type="button" className="head-btn ctx-step" aria-label={name} title={name} aria-disabled={!go} onClick={go}>
      <span aria-hidden="true">{dir === 'prev' ? '◀' : '▶'}</span>
    </button>
  );
}

export default function ContextBar({ label, title, sections, step, after, onStuck, titleAlways, below }: Props) {
  const onStuckRef = useRef(onStuck);
  onStuckRef.current = onStuck;
  const [active, setActive] = useState<string | null>(null);
  const ids = sections.map((s) => s.id).join('|');
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);

  // 표 머리줄이 막대 바로 아래에 붙도록 막대 높이를 알린다
  useEffect(() => {
    const el = bar.current!;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--ctx-h', `${el.offsetHeight}px`));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    // 막대 바로 아래 띠를 지나는 구역 중 가장 아래 것을 「지금 구역」으로 본다
    const order = ids ? ids.split('|') : [];
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id)));
        setActive(order.filter((id) => seen.has(id)).pop() ?? null);
      },
      { rootMargin: '-120px 0px -65% 0px' },
    );
    order.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, [ids]);

  useEffect(() => {
    // 막대가 화면 맨 위 근처까지 올라오면 위 선택 카드는 지나간 것으로 본다
    const io = new IntersectionObserver(
      ([e]) => {
        // 화면 아래쪽에 있어 안 보이는 것, 다시 그리는 도중(맨 위)과 구분
        const past = !e.isIntersecting && e.boundingClientRect.top < 60 && window.scrollY > 0;
        setStuck(past);
        if (past) onStuckRef.current?.();
      },
      { rootMargin: '-60px 0px 0px 0px' },
    );
    io.observe(sentinel.current!);
    return () => io.disconnect();
  }, []);

  // 좁은 화면에서 칩 줄이 가로로 밀릴 때, 지금 구역 칩이 보이게 (페이지는 움직이지 않음)
  useEffect(() => {
    const box = chips.current;
    const el = box?.querySelector<HTMLElement>('[aria-current]');
    if (box && el && box.scrollWidth > box.clientWidth) {
      box.scrollLeft = el.offsetLeft - box.offsetLeft - (box.clientWidth - el.offsetWidth) / 2;
    }
  }, [active]);

  return (
    <>
      <div ref={sentinel} className="ctx-sentinel" aria-hidden="true" />
      <nav ref={bar} className="ctx-bar" aria-label="이 화면에서 이동">
        <div className="ctx-main">
          {step && <StepButton dir="prev" go={step.prev} />}
          {step && <StepButton dir="next" go={step.next} />}
          <b className="ctx-label" title={label} aria-live="polite">
            {label}
          </b>
          {title && titleAlways && <span className="ctx-title is-always">{title}</span>}
          {title && !titleAlways && stuck && <span className="ctx-title">{title}</span>}
          {after}
        </div>
        {sections.length > 0 && (
          <div ref={chips} className="ctx-chips">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                className="ctx-chip"
                aria-current={active === s.id ? 'true' : undefined}
                aria-label={s.count ? `${s.label}, 근거 ${s.count}곳` : undefined}
                onClick={() => {
                  onStuckRef.current?.(); // 위 선택 영역을 먼저 접어, 움직이는 도중에 자리가 바뀌지 않게 한다
                  jumpTo(s.id);
                }}
              >
                {s.label}
                {!!s.count && <span className="ctx-count">{s.count}</span>}
              </button>
            ))}
          </div>
        )}
        {below}
      </nav>
    </>
  );
}
