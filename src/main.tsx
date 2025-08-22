import React from 'react'
import ReactDOM from 'react-dom/client'
import ClientNotesApp from './artifacts'
import '.src/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ClientNotesApp />
  </React.StrictMode>,
)
