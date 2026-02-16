import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { AuthProvider } from './auth/AuthProvider';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import { ToastProvider } from './components/toast';
import './styles.css';

const faviconUrl = import.meta.env.FAV_ICON ?? import.meta.env.VITE_FAV_ICON;

if (faviconUrl) {
  let faviconLink = document.querySelector("link[rel='icon']") as HTMLLinkElement | null;

  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    document.head.appendChild(faviconLink);
  }

  faviconLink.href = faviconUrl;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
