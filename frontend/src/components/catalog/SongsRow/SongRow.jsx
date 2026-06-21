import "./SongRow.css";

import GenreBadge from "./GenreBadge";
import StatusBadge from "./StatusBadge";
import EditButton from "./EditButton";
import { StarFill, Star } from "react-bootstrap-icons";
import { useNavigate } from "react-router-dom";
import StarRating from "../../common/StarRating";

function getValenceClass(value) {
    if (value >= 0.6) return "valence-high";
    if (value >= 0.4) return "valence-mid";
    return "valence-low";
}

function SongRow({ song }) {

    const navigate = useNavigate();
    
    function handleEdit() {
        navigate("/abm", { state: { tab: "modificar", song } });
    }
    
    return (

        <div className="song-row">

            <div className="song-info">

                <h4>{song.title}</h4>

                <span>{song.artist}</span>

            </div>

            <GenreBadge genre={song.genre}/>

            <span className={`valence-badge ${getValenceClass(song.valence)}`}>
                {song.valence}
            </span>

            <span>{song.energy}</span>

            <div className="popularity-cell">
                <span>{song.popularity}</span>
                <StarRating value={song.popularity}/>
            </div>

            <span>{song.duration}</span>

            <StatusBadge status={song.status}/>

            <EditButton onClick={handleEdit}/>

        </div>

    );

}

export default SongRow;