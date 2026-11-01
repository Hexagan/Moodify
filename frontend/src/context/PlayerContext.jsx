import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { getSongYouTube } from "../services/api";

const PlayerContext = createContext(null);

// The full-song YouTube player lives above the routes, so what's playing survives navigation.
// track: { songId, trackId, title, artist, videoId, musicUrl, playId } or null when the dock is closed.
// queue: { id, name, items, index } while a playlist is playing, so the dock can move on by itself.
// Videos are looked up one song at a time, just before each plays, to spend as little YouTube
// quota as possible; songs without an embeddable video are skipped.
export function PlayerProvider({ children }) {

    const [track, setTrack] = useState(null);
    const [queue, setQueue] = useState(null);
    const [queueStatus, setQueueStatus] = useState(null); // { id, state: "loading" | "empty" }
    const requestRef = useRef(0);
    const playIdRef = useRef(0);

    const show = useCallback((song, data) => {
        playIdRef.current += 1;
        setTrack({
            songId: song.songId,
            trackId: song.trackId,
            title: song.title,
            artist: song.artist,
            videoId: data.video_id,
            musicUrl: data.music_url,
            playId: playIdRef.current,
        });
    }, []);

    // Plays the first song from `index` onward (or backward, with step -1) that has a video.
    const playFrom = useCallback(async (list, index, step = 1, fresh = false) => {
        const request = ++requestRef.current;
        setQueueStatus({ id: list.id, state: "loading" });
        for (let i = index; i >= 0 && i < list.items.length; i += step) {
            let data;
            try {
                data = await getSongYouTube(list.items[i].trackId);
            } catch {
                data = null;
            }
            if (request !== requestRef.current) return; // something else started playing meanwhile
            if (data?.video_id) {
                setQueue({ ...list, index: i });
                setQueueStatus(null);
                show(list.items[i], data);
                return;
            }
        }
        if (request !== requestRef.current) return;
        // Moving on from a song that was playing (end of the playlist, or nothing playable before
        // it) leaves that song in the dock. Only a fresh start with no playable song is reported.
        setQueueStatus(fresh ? { id: list.id, state: "empty" } : null);
    }, [show]);

    const value = useMemo(() => ({
        track,
        queue,
        queueStatus,
        // A single song, from its own page: it replaces any playlist that was playing.
        playTrack: (next) => {
            requestRef.current += 1;
            playIdRef.current += 1;
            setQueue(null);
            setQueueStatus(null);
            setTrack({ ...next, playId: playIdRef.current });
        },
        // items: [{ songId, trackId, title, artist }]
        playQueue: ({ id, name, items }, startIndex = 0) => playFrom({ id, name, items }, startIndex, 1, true),
        playNext: () => {
            if (queue) playFrom(queue, queue.index + 1);
        },
        playPrevious: () => {
            if (queue && queue.index > 0) playFrom(queue, queue.index - 1, -1);
        },
        closePlayer: () => {
            requestRef.current += 1;
            setTrack(null);
            setQueue(null);
            setQueueStatus(null);
        },
    }), [track, queue, queueStatus, playFrom]);

    return (
        <PlayerContext.Provider value={value}>
            {children}
        </PlayerContext.Provider>
    );

}

export function usePlayer() {
    return useContext(PlayerContext);
}
