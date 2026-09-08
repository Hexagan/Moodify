import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminRoute from "./components/auth/AdminRoute";

import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Analysis from "./pages/Analysis";
import BioImpact from "./pages/BioImpact";
import ABM from "./pages/ABM";
import Profile from "./pages/Profile";
import SongDetail from "./pages/SongDetail";
import Login from "./pages/Login";

function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/login"
                    element={<Login />}
                />

                <Route
                    path="/"
                    element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                    />

                <Route
                    path="/catalogo"
                    element={<ProtectedRoute><Catalog /></ProtectedRoute>}
                />

                <Route
                    path="/analisis"
                    element={<ProtectedRoute><Analysis /></ProtectedRoute>}
                />

                <Route
                    path="/bioimpacto"
                    element={<ProtectedRoute><BioImpact /></ProtectedRoute>}
                />
                
                <Route 
                    path="/perfil/:uid" 
                    element={<ProtectedRoute><Profile /></ProtectedRoute>} 
                />

                <Route 
                    path="/cancion/:id" 
                    element={<ProtectedRoute><SongDetail /></ProtectedRoute>} 
                />
                
                <Route
                    path="/abm"
                    element={<ProtectedRoute><AdminRoute><ABM /></AdminRoute></ProtectedRoute>}
                />

            </Routes>

        </BrowserRouter>
    
    );
}

export default App;