import { createContext, useContext, useMemo, useState } from "react";

const PlayerContext = createContext(null);

// The full-song YouTube player lives above the routes, so what's playing survives navigation.
// track: { songId, trackId, title, artist, videoId, musicUrl } or null when the dock is closed.
export function PlayerProvider({ children }) {

    const [track, setTrack] = useState(null);

    const value = useMemo(() => ({
        track,
        playTrack: setTrack,
        closePlayer: () => setTrack(null),
    }), [track]);

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );

}

export function usePlayer() {
    return useContext(PlayerContext);
}
