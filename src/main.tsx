import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx';
import './index.css'
import { BrowserRouter } from 'react-router-dom'

// Add dark theme class to root element
const rootElement = document.getElementById('root')!;
rootElement.className = 'bg-gray-900';

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
