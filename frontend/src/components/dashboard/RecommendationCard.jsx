import { Link } from "react-router-dom";
import { HeartFill, ClockHistory } from "react-bootstrap-icons";
import SongCover from "../common/SongCover";
import SnippetButton from "../catalog/SongsRow/SnippetButton";
import StatusBadge from "../catalog/SongsRow/StatusBadge";
import "./RecommendationCard.css";

function RecommendationCard({ song }) {
    const liked = song.reason.type === "like";
    return (
        <article className="rec-card">
            <Link to={`/cancion/${song.id}`} className="rec-card-cover-link" tabIndex={-1} aria-hidden="true">
                <SongCover trackId={song.track_id} genre={song.genres?.[0]} className="rec-card-cover" />
            </Link>
            <div className="rec-card-body">
                <Link to={`/cancion/${song.id}`} className="rec-card-title">{song.title}</Link>
                <span className="rec-card-artist">{song.artist}</span>
                <p className={`rec-card-reason ${liked ? "liked" : "heard"}`} title={`${song.reason.song_title} · ${song.reason.song_artist}`}>
                    {liked ? <HeartFill aria-hidden="true" /> : <ClockHistory aria-hidden="true" />}
                    <span>Porque {liked ? "te gustó" : "escuchaste"} <strong>{song.reason.song_title}</strong></span>
                </p>
                <div className="rec-card-foot">
                    <StatusBadge status={song.status} />
                    <SnippetButton trackId={song.track_id} songId={song.id} title={song.title} />
                </div>
            </div>
        </article>
    );
}

export default RecommendationCard;
