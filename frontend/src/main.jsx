import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from "@vercel/analytics/react"
import './index.css'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext'
import { SettingsProvider } from './context/SettingsContext'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import './styles/variables.css'
import './styles/global.css'
import './styles/accessibility.css'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <SettingsProvider>
                <App />
            </SettingsProvider>
        </AuthProvider>
        <Analytics />
    </React.StrictMode>,
)
