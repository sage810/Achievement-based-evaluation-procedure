// UserPromptSubmit hook — 요청 앞에 `?`(또는 전각 `？`)나 `스킬:` 이 붙어 있으면 skill-guide 절차를 켠다.
// hook 은 요청 글을 바꿀 수 없어서, 표시는 그대로 두고 안내만 덧붙인다. 표시가 없으면 아무것도 출력하지 않는다.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  let prompt = '';
  try {
    prompt = JSON.parse(input).prompt || '';
  } catch {
    return;
  }
  if (!/^\s*([?？]|스킬\s*:)/.test(prompt)) return;

  const skill = path.join(here, '..', 'skills', 'skill-guide', 'SKILL.md');
  const additionalContext =
    `이 요청 앞에 스킬 제안 표시가 붙어 있다. 먼저 \`${skill}\` 를 읽고 그 순서대로 한다 — ` +
    '선생님이 계획을 고르기 전에는 아무것도 고치지 않는다.';
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext } })
  );
});
