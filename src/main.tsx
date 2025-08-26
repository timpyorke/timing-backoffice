import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// OneSignal service worker is automatically registered by the SDK

// Lightweight polyfill for older Safari versions
if (!(Object as any).fromEntries) {
  (Object as any).fromEntries = function (iterable: any) {
    const obj: any = {};
    for (const [key, value] of iterable) obj[key] = value;
    return obj;
  };
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
