import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import feedbackMode from './tools/feedback-mode/vite-plugin.js';

// 화면(web/)은 Vite, 데이터는 Python 서버(server/, 8000번)가 맡는다.
export default defineConfig({
  root: 'web',
  // 피드백 모드(개발 서버 전용) — root 가 web/ 이라 기록 파일은 한 단계 위 프로젝트의 .claude/ 에 둔다
  plugins: [react(), feedbackMode({ file: '../.claude/feedback.md' })],
  server: {
    port: 5173,
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  build: { outDir: '../dist', emptyOutDir: true },
});
