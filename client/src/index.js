import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import './styles/globals.css';

// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline functionality
serviceWorkerRegistration.register({
  onUpdate: registration => {
    console.log('New content available; please refresh.');
  },
  onSuccess: registration => {
    console.log('Content cached for offline use.');
  },
});

// Log web vitals
const sendToAnalytics = ({ name, delta, id }) => {
  console.log({ name, delta, id });
  // Send to analytics endpoint
  if (window.gtag) {
    window.gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? delta * 1000 : delta),
      non_interaction: true,
    });
  }
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
