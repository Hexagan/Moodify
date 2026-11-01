import "./SongRow.css";

import GenreBadge from "./GenreBadge";
import StatusBadge from "./StatusBadge";
import EditButton from "./EditButton";
import SnippetButton from "./SnippetButton";
import { useNavigate } from "react-router-dom";
import StarRating from "../../common/StarRating";
import ScaleBadge from "../../common/ScaleBadge";
import { useAuth } from "../../../context/AuthContext";

function SongRow({ song, activeGenre }) {

    const navigate = useNavigate();
    const { isAdmin } = useAuth();
    const shownGenre = song.genres.includes(activeGenre) ? activeGenre : song.genres[0];

    function handleEdit() {
        navigate("/abm", { state: { tab: "modificar", song } });
    }
    
    return (

        <div className="song-row">

            <div className="song-info" onClick={() => navigate(`/cancion/${song.id}`)} style={{ cursor: "pointer" }}>
                <h4 className="song-title-link" title={song.title}>{song.title}</h4>
                <span title={song.artist}>{song.artist}</span>
            </div>

            <SnippetButton trackId={song.track_id} songId={song.id} title={song.title}/>

            <GenreBadge genre={shownGenre}/>

            <ScaleBadge value={song.valence} className="col-valencia"/>

            <ScaleBadge value={song.energy} className="col-energia"/>

            <div className="popularity-cell col-popularidad">
                <span>{song.popularity}</span>
                <StarRating value={song.popularity}/>
            </div>

            <span className="col-duracion">{song.duration}</span>

            <StatusBadge status={song.status}/>

            {isAdmin ? <EditButton onClick={handleEdit}/> : <span aria-hidden="true" />}

        </div>

    );

}

export default SongRow;