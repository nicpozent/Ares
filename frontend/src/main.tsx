import React from 'react'
import ReactDOM from 'react-dom/client'
import './global.css'
import { App } from './App'
import { ensureMsal } from './auth/msal'

ensureMsal().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
})
