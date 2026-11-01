import SpotifySnippetDock from "../catalog/SpotifySnippetDock";
import YouTubeDock from "./YouTubeDock";

import "./PlayerDocks.css";

function PlayerDocks() {
    return (
        <div className="player-docks">
            <SpotifySnippetDock />
            <YouTubeDock />
        </div>
    );
}

export default PlayerDocks;
