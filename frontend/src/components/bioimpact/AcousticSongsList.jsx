import { useState, useEffect } from "react";
import "./AcousticSongsList.css";

import { getTopAcousticSongs } from "../../services/api";
import { mapCancion } from "../../utils/mapCancion";

function AcousticSongsList() {

    const [songs, setSongs] = useState([]);

    useEffect(() => {
        getTopAcousticSongs()
            .then((data) => setSongs(data.map(mapCancion)))
            .catch((err) => console.error("Error al cargar canciones acústicas:", err));
    }, []);

    return (

        <div className="acoustic-songs-list">

            {songs.map((song) => (

                <div className="acoustic-song-row" key={song.id}>

                    <div className="acoustic-song-info">
                        <h4>{song.title}</h4>
                        <span>{song.artist} - {song.genre} - {song.duration}</span>
                    </div>

                    <span className="acoustic-song-value">{song.acousticness}</span>

                </div>

            ))}

        </div>

    );

}

export default AcousticSongsList;