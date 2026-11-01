import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminRoute from "./components/auth/AdminRoute";
import PlayerDocks from "./components/player/PlayerDocks";
import { PlayerProvider } from "./context/PlayerContext";

import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import Catalog from "./pages/Catalog";
import Analysis from "./pages/Analysis";
import BioImpact from "./pages/BioImpact";
import MapaEmocional from "./pages/MapaEmocional";
import Artists from "./pages/Artists";
import ArtistDetail from "./pages/ArtistDetail";
import ArtistThread from "./pages/ArtistThread";
import ABM from "./pages/ABM";
import Profile from "./pages/Profile";
import SongDetail from "./pages/SongDetail";
import Login from "./pages/Login";
import PlaylistPage from "./pages/PlaylistPage";
import Settings from "./pages/Settings";

// Every page is browsable as a guest; actions that need an account (commenting, reacting,
// posting) show a sign-in prompt in place. Only the ABM requires a role, via AdminRoute.
// The player docks sit outside <Routes>, so music keeps playing while moving between pages.
function App() {
    return (
        <BrowserRouter>
            <PlayerProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/reportes" element={<Reports />} />
                    <Route path="/catalogo" element={<Catalog />} />
                    <Route path="/artistas" element={<Artists />} />
                    <Route path="/artistas/:id" element={<ArtistDetail />} />
                    <Route path="/artistas/:id/hilo/:threadId" element={<ArtistThread />} />
                    <Route path="/analisis" element={<Analysis />} />
                    <Route path="/bioimpacto" element={<BioImpact />} />
                    <Route path="/mapa-emocional" element={<MapaEmocional />} />
                    <Route path="/perfil/:uid" element={<Profile />} />
                    <Route path="/cancion/:id" element={<SongDetail />} />
                    <Route path="/playlist/:id" element={<PlaylistPage />} />
                    <Route path="/configuracion" element={<Settings />} />
                    <Route path="/abm" element={<AdminRoute><ABM /></AdminRoute>} />
                </Routes>
                <PlayerDocks />
            </PlayerProvider>
        </BrowserRouter>
    );
}

export default App;
