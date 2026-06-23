import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import './index.css';

// Capture and display global errors
window.addEventListener('error', (event) => {
  if (event.message === 'Script error.') return;
  const errDiv = document.createElement('div');
  errDiv.style.position = 'fixed';
  errDiv.style.top = '0';
  errDiv.style.left = '0';
  errDiv.style.right = '0';
  errDiv.style.background = 'rgba(255,0,0,0.8)';
  errDiv.style.color = 'white';
  errDiv.style.padding = '10px';
  errDiv.style.zIndex = '999999';
  errDiv.innerText = `Global Error: ${event.message} at ${event.filename}:${event.lineno}`;
  document.body.appendChild(errDiv);
});
window.addEventListener('unhandledrejection', (event) => {
  const errDiv = document.createElement('div');
  errDiv.style.position = 'fixed';
  errDiv.style.top = '40px';
  errDiv.style.left = '0';
  errDiv.style.right = '0';
  errDiv.style.background = 'rgba(255,100,0,0.8)';
  errDiv.style.color = 'white';
  errDiv.style.padding = '10px';
  errDiv.style.zIndex = '999999';
  errDiv.innerText = `Unhandled Promise Rejection: ${event.reason}`;
  document.body.appendChild(errDiv);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
