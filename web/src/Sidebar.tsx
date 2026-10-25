// 좌측 사이드바 — 평가 절차 4단계 메뉴. 왼쪽에 떠 있는 도크이고, 오른쪽 가장자리 손잡이로 열고 닫는다.
// (score/teacher.html 의 도크 구조를 스티커 디자인으로 옮김)

export type Tab = 'analysis' | 'review' | 'items';

const icon = (name: string) => new URL(`./design-sticker/assets/icons/${name}.png`, import.meta.url).href;

interface Item {
  tab?: Tab; // 없으면 준비 중
  label: string;
  icon: string;
}

const STAGES: { title: string; items: Item[] }[] = [
  {
    title: '① 운영 계획',
    items: [
      { tab: 'analysis', label: '교육과정 분석', icon: 'tab-rules' },
      { tab: 'review', label: '평가계획서', icon: 'tab-sheet' },
    ],
  },
  { title: '② 문항·평가도구 개발', items: [{ tab: 'items', label: '문항 개발', icon: 'ic-palette' }] },
  { title: '③ 채점', items: [{ label: '채점', icon: 'ic-check' }] },
  { title: '④ 결과 분석·피드백', items: [{ label: '분석·피드백', icon: 'ic-search' }] },
];

interface Props {
  tab: Tab;
  onSelect: (t: Tab) => void;
  open: boolean;
  onToggle: () => void;
}

export default function Sidebar({ tab, onSelect, open, onToggle }: Props) {
  return (
    <>
      <nav className="sidebar" id="sidebar" aria-label="평가 절차 메뉴" hidden={!open}>
        {STAGES.map((stage, i) => (
          <div key={stage.title} className="sb-group">
            {i > 0 && <div className="sb-divider" aria-hidden="true" />}
            <p className="sb-stage">{stage.title}</p>
            {stage.items.map((it) =>
              it.tab ? (
                <button
                  key={it.label}
                  type="button"
                  className="sb-item"
                  aria-current={tab === it.tab ? 'page' : undefined}
                  onClick={() => onSelect(it.tab!)}
                >
                  <span className="sb-icon" style={{ backgroundImage: `url(${icon(it.icon)})` }} aria-hidden="true" />
                  <span className="sb-label">{it.label}</span>
                </button>
              ) : (
                <button key={it.label} type="button" className="sb-item" disabled>
                  <span className="sb-icon" style={{ backgroundImage: `url(${icon(it.icon)})` }} aria-hidden="true" />
                  <span className="sb-label">{it.label}</span>
                  <span className="sb-soon">준비 중</span>
                </button>
              ),
            )}
          </div>
        ))}
      </nav>
      <button
        type="button"
        className="sidebar-handle"
        aria-controls="sidebar"
        aria-expanded={open}
        aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
        title={open ? '메뉴 닫기' : '메뉴 열기'}
        onClick={onToggle}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M14 6l-6 6 6 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </>
  );
}
