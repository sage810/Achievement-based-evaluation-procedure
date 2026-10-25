/**
 * 피드백 모드 — Vite 개발 서버 플러그인.
 * 화면 위 오버레이(overlay.js)가 보내는 피드백을 로컬 파일(기본 .claude/feedback.md)에 덧붙인다.
 * 보낸 항목을 화면에서 다시 보고 고치거나 지울 수도 있다(처리 전 `[ ]` 인 항목만).
 * `apply: 'serve'` 라 빌드/배포본에는 아예 들어가지 않는다. 다른 프로젝트에선 이 폴더를 통째로 복사해 쓴다.
 *
 *   // vite.config.js
 *   import feedbackMode from './tools/feedback-mode/vite-plugin.js';
 *   export default defineConfig({ plugins: [react(), feedbackMode()] });
 *
 * 옵션: { file: '.claude/feedback.md', endpoint: '/__feedback' }
 *
 * 엔드포인트:
 *   GET    /__feedback            → { file, open }                 (처리 전 개수)
 *   GET    /__feedback?list=1     → { file, open, entries: [...] } (최신이 앞)
 *   POST   /__feedback            → 항목 추가, { ok, file, key }
 *   PUT    /__feedback            → { key, note?, newText?, design? } 로 처리 전 항목 고치기
 *   DELETE /__feedback            → { key } 로 처리 전 항목 지우기
 * 항목의 key 는 제목줄("시각 · 경로")이다.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const HEADER = `# 화면 피드백

앱의 "피드백" 모드에서 보낸 요청이 아래에 쌓인다. 처리하면 \`[ ]\` 를 \`[x]\` 로 바꾸고 한 줄로 무엇을 했는지 적는다.
(Claude: 세션 시작 때 이 파일에 \`[ ]\` 가 있으면 먼저 읽고 처리할 것.)

`;

export default function feedbackMode({ file = '.claude/feedback.md', endpoint = '/__feedback' } = {}) {
  return {
    name: 'feedback-mode',
    apply: 'serve',
    configureServer(server) {
      const path = resolve(server.config.root, file);
      const json = (res, code, obj) => {
        res.statusCode = code;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(obj));
      };
      server.middlewares.use(endpoint, (req, res) => {
        if (req.method === 'GET') {
          const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
          const open = (text.match(/^- 상태: \[ \]/gm) ?? []).length;
          const out = { file, open };
          if ((req.url ?? '').includes('list=1')) out.entries = listEntries(text);
          json(res, 200, out);
          return;
        }
        if (!['POST', 'PUT', 'DELETE'].includes(req.method)) { res.statusCode = 405; res.end(); return; }
        let body = '';
        req.on('data', (c) => { body += c; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (req.method === 'POST') {
              const entry = format(data);
              mkdirSync(dirname(path), { recursive: true });
              if (!existsSync(path)) appendFileSync(path, HEADER, 'utf8');
              appendFileSync(path, entry, 'utf8');
              json(res, 200, { ok: true, file, key: entry.split('\n')[0].slice(3) });
              return;
            }
            // 고치기(PUT) / 지우기(DELETE): 처리 전 항목만. 항목은 제목줄로 찾는다.
            const text = existsSync(path) ? readFileSync(path, 'utf8') : '';
            const parts = text.split(/\n(?=## )/);
            const i = parts.findIndex((x) => x.startsWith('## ') && x.split('\n')[0].slice(3) === data.key);
            if (i < 0) return json(res, 404, { ok: false, error: '항목을 찾을 수 없습니다(이미 지워졌거나 파일이 바뀜).' });
            if (!/^- 상태: \[ \]/m.test(parts[i])) return json(res, 409, { ok: false, error: '이미 처리된 항목은 고칠 수 없습니다.' });
            if (req.method === 'DELETE') parts.splice(i, 1);
            else parts[i] = editEntry(parts[i], data);
            writeFileSync(path, parts.join('\n'), 'utf8');
            json(res, 200, { ok: true, file });
          } catch (e) {
            json(res, 400, { ok: false, error: String(e.message ?? e) });
          }
        });
      });
      server.config.logger.info(`  ➜  피드백 모드: 화면 우하단 버튼 → ${file}`);
    },
  };
}

function format(f) {
  const when = new Date().toLocaleString('ko-KR', { hour12: false });
  const lines = [
    `## ${when} · ${f.route || '/'}`,
    `- 종류: ${f.newText != null ? '글자 수정' : '메모'}`,
    `- 요소: ${f.element || '?'}${f.text ? `  (글자: "${oneLine(f.text)}")` : ''}`,
    `- 위치: ${f.path || '?'}`,
  ];
  if (f.newText != null) lines.push(`- 수정: "${oneLine(f.text)}" → "${oneLine(f.newText)}"`);
  if (f.note) lines.push(`- 메모: ${oneLine(f.note)}`);
  if (f.design) lines.push('- 디자인 추천: 요청'); // → Claude 는 ui-ux-pro-max 스킬로 후보를 먼저 제안 (feedback_mode 스킬 참고)
  lines.push(`- 화면: ${f.app || ''} · ${f.viewport || ''}`, '- 상태: [ ] 처리 전', '');
  return lines.join('\n') + '\n';
}
const oneLine = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();

/** 파일 내용 → 항목 목록(최신이 앞). 화면의 "보낸 목록"이 쓴다. */
function listEntries(text) {
  const get = (lines, label) => lines.find((l) => l.startsWith(`- ${label}: `))?.slice(label.length + 4) ?? null;
  return text.split(/\n(?=## )/).filter((x) => x.startsWith('## ')).map((sec) => {
    const lines = sec.split('\n');
    const key = lines[0].slice(3);
    const [when, ...rest] = key.split(' · ');
    const fix = get(lines, '수정')?.match(/^"(.*)" → "(.*)"$/);
    const status = get(lines, '상태') ?? '';
    return {
      key, when, route: rest.join(' · '),
      kind: get(lines, '종류'), element: get(lines, '요소'), path: get(lines, '위치'),
      text: fix ? fix[1] : null, newText: fix ? fix[2] : null,
      note: get(lines, '메모'), design: lines.some((l) => l.startsWith('- 디자인 추천:')),
      screen: get(lines, '화면'),
      done: !status.startsWith('[ ]'), result: status.replace(/^\[.\]\s*/, ''),
    };
  }).reverse();
}

/** 항목 하나의 수정문·메모·디자인 추천 표시를 고친다. 나머지 줄(요소·위치·화면·상태·제안 등)은 그대로 둔다. */
function editEntry(section, { newText, note, design }) {
  const tail = section.match(/\s*$/)[0];
  const lines = section.slice(0, section.length - tail.length).split('\n');
  const at = (re) => lines.findIndex((l) => re.test(l));
  if (newText !== undefined) {
    const i = at(/^- 수정: /);
    const old = i >= 0 ? lines[i].match(/^- 수정: "(.*)" → "(.*)"$/) : null;
    if (!old) throw new Error('글자 수정 항목이 아니라 수정문을 바꿀 수 없습니다.');
    if (!oneLine(newText)) throw new Error('수정문은 비울 수 없습니다.');
    lines[i] = `- 수정: "${old[1]}" → "${oneLine(newText)}"`;
  }
  if (note !== undefined) {
    const i = at(/^- 메모: /);
    const n = oneLine(note);
    if (!n && i >= 0) lines.splice(i, 1);
    else if (n && i >= 0) lines[i] = `- 메모: ${n}`;
    else if (n) lines.splice(Math.max(at(/^- 수정: /), at(/^- 위치: /)) + 1, 0, `- 메모: ${n}`);
  }
  if (design !== undefined) {
    const i = at(/^- 디자인 추천:/);
    if (!design && i >= 0) lines.splice(i, 1);
    else if (design && i < 0) lines.splice(at(/^- 화면: /), 0, '- 디자인 추천: 요청');
  }
  if (at(/^- 수정: /) < 0 && at(/^- 메모: /) < 0 && at(/^- 디자인 추천:/) < 0) throw new Error('메모·수정문·디자인 추천 중 하나는 있어야 합니다.');
  return lines.join('\n') + tail;
}
