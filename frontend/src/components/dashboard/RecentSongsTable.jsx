import { useState, useEffect } from "react";
import "./RecentSongsTable.css";
import { ThreeDotsVertical } from "react-bootstrap-icons";

import { getRandomCanciones } from "../../services/api";
import { mapCancion } from "../../utils/mapCancion";
import { getGenreColor } from "../../utils/genreColors";

function RecentSongs() {

    const [songs, setSongs] = useState([]);

    useEffect(() => {
        getRandomCanciones()
            .then((data) => setSongs(data.map(mapCancion)))
            .catch((err) => console.error("Error al cargar canciones recientes:", err));
    }, []);

    return (

        <div className="recent-table">

            <table>

                <thead>
                    <tr>
                        <th>Canción / Artista</th>
                        <th>Género</th>
                        <th>Valencia</th>
                        <th>Energía</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    {songs.map((song) => (
                        <tr key={song.id}>

                            <td>
                                <div className="song-title">{song.title}</div>
                                <div className="song-artist">{song.artist}</div>
                            </td>

                            <td>
                                <span
                                    className="badge"
                                    style={{ background: getGenreColor(song.genre) }}
                                >
                                    {song.genre}
                                </span>
                            </td>

                            <td>{song.valence}</td>
                            <td>{song.energy}</td>

                            <td>
                                <ThreeDotsVertical />
                            </td>

                        </tr>
                    ))}
                </tbody>

            </table>

        </div>

    );

}

export default RecentSongs;