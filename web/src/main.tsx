import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './design-sticker/tokens.css';
import './design-sticker/components.css';
import './app.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// @ts-expect-error — 타입 없는 JS 도구
if (import.meta.env.DEV) import('../../tools/feedback-mode/overlay.js').then((m) => m.mountFeedbackMode({ app: '성취평가 도우미' }));
