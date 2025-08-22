import React from 'react';
import ReactDOM from 'react-dom/client';
import '/src/index.css';
import ClientNotesApp from './artifacts';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ClientNotesApp />
  </React.StrictMode>
);
