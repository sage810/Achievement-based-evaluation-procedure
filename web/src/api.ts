export const LEVELS = ['A', 'B', 'C', 'D', 'E'] as const;
export type Level = (typeof LEVELS)[number];

export interface Standard {
  id?: number;
  school_level: string;
  subject: string;
  code: string;
  statement: string;
  explanation: string; // 성취기준 해설
  levels: Record<Level, string>;
  knowledge: string[]; // 지식·이해
  skills: string[]; // 과정·기능
  attitude: string[]; // 가치·태도
  elements: string[]; // 평가요소
  ai_draft: boolean;
  source: string;
  updated_at?: string;
}

// 교육과정 원문 — 영역별 내용 체계
export interface Area {
  no: string;
  name: string;
  core_ideas: string[];
  knowledge: string[];
  skills: string[];
  attitude: string[];
  considerations: string[];
}

// 교육과정 원문 — 과목 정보 (읽기 전용)
export interface Curriculum {
  school_level: string;
  subject: string;
  source: string;
  character: string[];
  goals_intro: string;
  goals: string[];
  teaching_direction: string[];
  teaching_methods: string[];
  assessment_direction: string[];
  assessment_methods: string[];
  areas: Area[];
}

// 성취기준 분석 — 연수 양식 ②④⑤⑥⑦ (③ 관련 요소는 성취기준의 knowledge/skills/attitude 를 그대로 씀)
export interface LevelAnalysis {
  knowledge: string;
  skills: string;
  attitude: string;
  cues: string; // 수준 구분 단서 (수식어·동사)
}

// 평가요소 수준화(연수 양식 2-2) — 평가요소마다 붙어 다닌다
export interface LevelingCell {
  performance: string; // ③ 수준화된 평가요소 (이 수준 학생이 해낼 수 있는 수행)
  criteria: string; // 판단 준거 (어떤 증거를 보이면 이 수준인가)
  idea: string; // 문항·과제 아이디어
}

export interface Leveling {
  recheck: string; // ② 도출 이유 재확인
  levels: Record<Level, LevelingCell>;
}

export interface ElementRow {
  element: string; // 평가요소 (~하기)
  basis: string; // 도출 근거
  reason: string; // 도출 이유
  content: string; // 평가 내용
  method: string; // 평가방법
  leveling?: Leveling;
}

// 성취기준과 핵심 아이디어의 연결 — 세 칸
export interface Connection {
  standard: string; // 성취기준 (무엇을 배우는가)
  idea: string; // 핵심 아이디어 (맞닿은 부분)
  link: string; // 연결점
}

export interface AnalysisData {
  core_idea_links: number[];
  core_idea_connection: Connection;
  statement_analysis: { knowledge: string[]; skills: string[]; attitude: string[] };
  explanation_implications: string[];
  consideration_implications: string[];
  levels: Record<Level, LevelAnalysis>;
  elements: ElementRow[];
}

export interface Analysis {
  standard_id: number;
  data: AnalysisData;
  ai_draft: boolean;
  updated_at: string;
}

// 평가계획서 검토 — 검토 템플릿(xlsx)의 두 시트
export interface ReviewCheck {
  id: string;
  question: string;
  where: string; // 어디를 보나
  how: string; // 어떻게 판단하나
  example: string; // 이런 경우를 찾으세요 / 실제로 나온 오류 예
  grade?: string; // 필수 | 권장 (지침 점검만)
}

export interface ReviewSheet {
  key: 'intent' | 'rules';
  sheet: string;
  title: string;
  intro: string;
  groups: { title: string; desc: string; items: ReviewCheck[] }[];
}

export type Verdict = 'ok' | 'warn' | 'bad' | 'na';

export interface ReviewItemResult {
  verdict: Verdict;
  where: string; // 계획서에서 찾은 위치
  finding: string; // 판단 근거
  fix: string; // 수정 제안
}

export interface PlanReview {
  id: number;
  filename: string;
  status: 'pending' | 'done';
  result: { summary: string; items: Record<string, ReviewItemResult> } | null;
  uploaded_at: string;
  reviewed_at: string | null;
}

// 문항 개발 — 연수 양식 「수행평가 과제 및 채점기준표 개발」 칸 그대로
export interface RubricRow {
  level: string; // 성취수준 (A, B-C, D-E …)
  text: string; // 수행 수준(채점기준)
  score: string; // 배점
}

export interface RubricBlock {
  no: string; // 문항/과제 번호 (1, 1-1 …)
  element: string; // 평가 요소
  criterion: string; // 채점 요소
  rows: RubricRow[];
}

export interface ItemData {
  area: string; // 영역
  title: string; // 평가 과제명
  standard_id: number | null;
  standard: string; // [코드] 진술
  levels: Record<Level, string>; // 성취기준별 성취수준(원문)
  min_traits: Record<Level, string>; // 성취수준별 최소 능력자의 수행 특성
  curriculum_analysis: string;
  content: { knowledge: string; skills: string; attitude: string }; // 범주별 내용 요소
  elements: string; // 평가 요소 (줄마다 하나)
  method: string; // 평가 방법
  lessons: { stage: string; teaching: string; assessment: string }[];
  dev_direction: string;
  item_info: { no: string; standard: string; element: string }[];
  question: string; // 수행평가 문항
  rubric: RubricBlock[];
  basic_score: string;
  answers: { no: string; answer: string }[];
  redraft?: string; // 다시 구성 요청 사유(예: 평가 방법 변경) — Claude Code 가 처리 후 지움
}

export interface ItemSet {
  id: number;
  school_level: string;
  subject: string;
  data: ItemData;
  status: 'draft' | 'requested';
  ai_draft: boolean;
  updated_at: string;
}

// GitHub Pages 배포판 — 서버 없이 빌드 때 만든 snapshot.json(seed 자료)만 읽는다. 저장·업로드는 안 된다.
export const READ_ONLY = import.meta.env.VITE_STATIC === '1';

interface Snapshot {
  standards: Standard[];
  analyses: Record<string, Analysis>;
  curriculum: Curriculum[];
  review_template: ReviewSheet[];
}

let snapshot: Promise<Snapshot> | null = null;

async function fromSnapshot(url: string, method: string): Promise<unknown> {
  if (method !== 'GET') throw new Error('읽기 전용 배포판에서는 저장할 수 없어요');
  snapshot ??= fetch(`${import.meta.env.BASE_URL}snapshot.json`).then((r) => r.json());
  const s = await snapshot;
  const u = new URL(url, location.href);
  const q = Object.fromEntries(u.searchParams);
  const same = (x: { school_level: string; subject: string }) =>
    x.school_level === q.school_level && x.subject === q.subject;
  const path = u.pathname.replace(/^.*\/api\//, '');
  if (path === 'standards') return s.standards.filter(same);
  if (path === 'curriculum') return s.curriculum.find(same) ?? null;
  if (path.startsWith('analyses/')) return s.analyses[path.split('/')[1]] ?? null;
  if (path === 'review-template') return s.review_template;
  if (path === 'plan-reviews' || path === 'item-sets') return [];
  throw new Error('읽기 전용 배포판에서는 쓸 수 없는 기능이에요');
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  if (READ_ONLY) return fromSnapshot(url, init?.method ?? 'GET') as Promise<T>;
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...init });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `서버 오류 (${res.status})`);
  }
  return res.json();
}

export const api = {
  list: (school_level: string, subject: string) =>
    call<Standard[]>(`/api/standards?${new URLSearchParams({ school_level, subject })}`),
  curriculum: (school_level: string, subject: string) =>
    call<Curriculum | null>(`/api/curriculum?${new URLSearchParams({ school_level, subject })}`),
  analysis: (standardId: number) => call<Analysis | null>(`/api/analyses/${standardId}`),
  saveAnalysis: (standardId: number, data: AnalysisData, ai_draft: boolean) =>
    call<Analysis>(`/api/analyses/${standardId}`, { method: 'PUT', body: JSON.stringify({ data, ai_draft }) }),
  reviewTemplate: () => call<ReviewSheet[]>('/api/review-template'),
  planReviews: () => call<PlanReview[]>('/api/plan-reviews'),
  uploadPlan: (file: File) =>
    call<PlanReview>(`/api/plan-reviews?${new URLSearchParams({ filename: file.name })}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file,
    }),
  deletePlan: (id: number) => call<{ ok: boolean }>(`/api/plan-reviews/${id}`, { method: 'DELETE' }),
  itemSets: (school_level: string, subject: string) =>
    call<ItemSet[]>(`/api/item-sets?${new URLSearchParams({ school_level, subject })}`),
  createItemSet: (body: Omit<ItemSet, 'id' | 'updated_at'>) =>
    call<ItemSet>('/api/item-sets', { method: 'POST', body: JSON.stringify(body) }),
  saveItemSet: (id: number, body: Omit<ItemSet, 'id' | 'updated_at'>) =>
    call<ItemSet>(`/api/item-sets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteItemSet: (id: number) => call<{ ok: boolean }>(`/api/item-sets/${id}`, { method: 'DELETE' }),
};
