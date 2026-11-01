import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ClockHistory, HeartFill, Stars, PersonFill, BoxArrowInRight, ShieldCheck, CollectionPlay } from "react-bootstrap-icons";

import Layout from "../components/layout/Layout";
import ChartCard from "../components/dashboard/ChartCard";
import RecentSongsTable from "../components/dashboard/RecentSongsTable";
import Playlist from "../components/dashboard/Playlist";
import RecommendationCard from "../components/dashboard/RecommendationCard";
import EmotionalMapExplorer from "../components/emotionmap/EmotionalMapExplorer";
import ArtistImage from "../components/artists/ArtistImage";
import ScrollRow from "../components/common/ScrollRow";
import UserPlaylists from "../components/playlists/UserPlaylists";
import { useAuth } from "../context/AuthContext";
import {
    getListeningHistory, getLikedPlaylist, getRecommendations, getRecommendedArtists, clearListeningHistory
} from "../services/api";
import { mapCancion } from "../utils/mapCancion";
import { timeAgo } from "../utils/timeAgo";
import "./Dashboard.css";

function MapIntro({ title, text }) {
    return (
        <section className="dash-section" aria-labelledby="map-intro-title">
            <div className="dash-intro">
                <span className="dash-eyebrow">Mapa emocional</span>
                <h2 id="map-intro-title">{title}</h2>
                <p>{text}</p>
            </div>
            <EmotionalMapExplorer />
        </section>
    );
}

function RandomSongs() {
    return (
        <ChartCard title="Diez canciones al azar">
            <RecentSongsTable />
        </ChartCard>
    );
}

function GuestDashboard() {
    return (
        <div className="dashboard-page">
            <MapIntro
                title="¿Cómo querés sentirte hoy?"
                text="Tocá cualquier punto del mapa o elegí una emoción: cada zona combina valencia (qué tan positiva suena una canción) y energía, y te sugiere canciones que encajan."
            />
            <div className="dash-guest-banner">
                <div>
                    <h3>Tu música, a tu medida</h3>
                    <p>Creá una cuenta para guardar lo que escuchás, armar tu lista de favoritas y recibir recomendaciones pensadas para vos.</p>
                </div>
                <Link to="/login" className="dash-guest-btn"><BoxArrowInRight aria-hidden="true" /> Iniciar sesión o registrarse</Link>
            </div>
            <RandomSongs />
        </div>
    );
}

function UserDashboard({ user, profile }) {

    const [history, setHistory] = useState(null);
    const [liked, setLiked] = useState(null);
    const [recs, setRecs] = useState(null);
    const [artistRecs, setArtistRecs] = useState(null);

    useEffect(() => {
        let cancelled = false;
        const withSongs = (data, extra) => ({ total: data.total, items: data.items.map((s) => ({ ...mapCancion(s), ...extra(s) })) });
        getListeningHistory(user.uid, 30)
            .then((d) => { if (!cancelled) setHistory(withSongs(d, (s) => ({ plays: s.plays, last_played_at: s.last_played_at }))); })
            .catch(() => { if (!cancelled) setHistory({ total: 0, items: [] }); });
        getLikedPlaylist(user.uid, 30)
            .then((d) => { if (!cancelled) setLiked(withSongs(d, (s) => ({ liked_at: s.liked_at }))); })
            .catch(() => { if (!cancelled) setLiked({ total: 0, items: [] }); });
        getRecommendations(user.uid, 12)
            .then((d) => { if (!cancelled) setRecs({ cold_start: d.cold_start, items: d.items.map((s) => ({ ...mapCancion(s), reason: s.reason })) }); })
            .catch(() => { if (!cancelled) setRecs({ cold_start: true, items: [] }); });
        getRecommendedArtists(user.uid, 6)
            .then((d) => { if (!cancelled) setArtistRecs(d.items); })
            .catch(() => { if (!cancelled) setArtistRecs([]); });
        return () => { cancelled = true; };
    }, [user.uid]);

    async function handleClearHistory() {
        if (!window.confirm("¿Borrar todo tu historial? Tus recomendaciones dejarán de tenerlo en cuenta.")) return;
        await clearListeningHistory(user.uid);
        setHistory({ total: 0, items: [] });
        getRecommendations(user.uid, 12)
            .then((d) => setRecs({ cold_start: d.cold_start, items: d.items.map((s) => ({ ...mapCancion(s), reason: s.reason })) }))
            .catch(() => {});
    }

    const name = profile?.display_name || user.displayName || "vos";
    const photo = profile?.photo_url || user.photoURL;
    const isNew = history?.total === 0 && liked?.total === 0;

    return (
        <div className="dashboard-page">

            {isNew && (
                <MapIntro
                    title="Empezá por cómo te sentís"
                    text="Todavía no escuchaste nada en Moodify. Elegí una emoción en el mapa, escuchá vistas previas y marcá lo que te guste: con eso armamos tus recomendaciones."
                />
            )}

            <section className="dash-welcome">
                <Link to={`/perfil/${user.uid}`} className="dash-welcome-avatar" aria-label="Ver tu perfil">
                    {photo ? <img src={photo} alt="" /> : <PersonFill aria-hidden="true" />}
                </Link>
                <div className="dash-welcome-text">
                    <span className="dash-eyebrow">Tu espacio</span>
                    <h2>Hola, {name}</h2>
                    <div className="dash-welcome-stats">
                        <span><ClockHistory aria-hidden="true" /> {history ? history.total : "…"} escuchadas</span>
                        <span><HeartFill aria-hidden="true" /> {liked ? liked.total : "…"} me gusta</span>
                        {profile?.role === "dev" && <span><ShieldCheck aria-hidden="true" /> Administrador</span>}
                    </div>
                </div>
                <Link to={`/perfil/${user.uid}`} className="dash-welcome-link">Ver perfil</Link>
            </section>

            <section className="dash-section" aria-labelledby="recs-title">
                <div className="dash-section-head">
                    <h2 id="recs-title"><Stars aria-hidden="true" /> Recomendadas para vos</h2>
                    <span>Primero lo parecido a tus me gusta, después a lo que escuchaste</span>
                </div>
                {recs === null && <p className="dash-empty">Buscando canciones para vos…</p>}
                {recs?.cold_start && (
                    <p className="dash-empty">
                        Cuando escuches vistas previas o marques canciones con me gusta, acá vas a ver recomendaciones parecidas.
                        {" "}<Link to="/catalogo">Explorá el catálogo</Link> o <Link to="/mapa-emocional">el mapa emocional</Link>.
                    </p>
                )}
                {recs && !recs.cold_start && (
                    <ScrollRow label="Canciones recomendadas" itemWidth={190}>
                        {recs.items.map((song) => <RecommendationCard key={song.id} song={song} />)}
                    </ScrollRow>
                )}
            </section>

            {artistRecs?.length > 0 && (
                <section className="dash-section" aria-labelledby="artist-recs-title">
                    <div className="dash-section-head">
                        <h2 id="artist-recs-title">Artistas para descubrir</h2>
                        <span>Derivados de tus recomendaciones, sin repetir los que ya escuchás</span>
                    </div>
                    <ScrollRow label="Artistas recomendados" itemWidth={160}>
                        {artistRecs.map((artist) => (
                            <Link key={artist.id} to={`/artistas/${artist.id}`} className="dash-artist">
                                <ArtistImage artist={artist} className="dash-artist-image" />
                                <span className="dash-artist-name">{artist.name}</span>
                                <span className="dash-artist-reason">Similar a {artist.reason.song_title}</span>
                            </Link>
                        ))}
                    </ScrollRow>
                </section>
            )}

            <section className="dash-section" aria-labelledby="my-playlists-title">
                <div className="dash-section-head">
                    <h2 id="my-playlists-title"><CollectionPlay aria-hidden="true" /> Tus playlists</h2>
                    <span>Sumá canciones desde la página de cada una</span>
                </div>
                <UserPlaylists ownerUid={user.uid} viewerUid={user.uid} />
            </section>

            <div className="dash-playlists">
                <Playlist
                    title="Tu historial"
                    tone="history"
                    icon={<ClockHistory />}
                    total={history?.total}
                    items={history?.items}
                    emptyText="Las canciones que abras o escuches en vista previa aparecen acá."
                    meta={(s) => `${timeAgo(s.last_played_at)} · ${s.plays} ${s.plays === 1 ? "vez" : "veces"}`}
                    action={history?.total > 0 && (
                        <button type="button" className="playlist-clear" onClick={handleClearHistory}>Borrar</button>
                    )}
                />
                <Playlist
                    title="Tus me gusta"
                    tone="liked"
                    icon={<HeartFill />}
                    total={liked?.total}
                    items={liked?.items}
                    emptyText="Marcá canciones con ♥ en su página para sumarlas acá."
                    meta={(s) => timeAgo(s.liked_at)}
                />
            </div>

            <RandomSongs />

        </div>
    );
}

function Dashboard() {
    const { user, profile } = useAuth();
    return (
        <Layout title="Dashboard">
            {user
                ? <UserDashboard key={user.uid} user={user} profile={profile} />
                : <GuestDashboard />
            }
        </Layout>
    );
}

export default Dashboard;
