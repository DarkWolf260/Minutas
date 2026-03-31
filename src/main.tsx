
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Force unregister Service Workers in development to prevent conflicts with Vite
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('[Dev SW] Unregistered Service Worker:', registration.scope);
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
