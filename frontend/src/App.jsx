import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Catalog from "./pages/Catalog";
import Analysis from "./pages/Analysis";
import BioImpact from "./pages/BioImpact";


function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={<Dashboard />}
                    />

                <Route
                    path="/catalogo"
                    element={<Catalog />}
                />

                <Route
                    path="/analisis"
                    element={<Analysis />}
                />

                <Route
                    path="/bioimpacto"
                    element={<BioImpact />}
                />

            </Routes>

        </BrowserRouter>
    
    );
}

export default App;