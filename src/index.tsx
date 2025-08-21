import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
// Fix the import path to point to your artifacts folder:
import ClientNotesApp from './artifacts';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <ClientNotesApp />
  </React.StrictMode>
);
