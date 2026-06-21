import "./SongsTable.css";

import SongRow from "./SongsRow/SongRow";

const songs = [

    {
        id:1,
        title:"Blinding Lights",
        artist:"The Weeknd",
        genre:"Pop",
        valence:0.81,
        energy:0.73,
        popularity:95,
        duration:"3:20",
        status:"Enérgico"
    },

    {
        id:2,
        title:"Bohemian Rhapsody",
        artist:"Queen",
        genre:"Rock",
        valence:0.49,
        energy:0.82,
        popularity:97,
        duration:"5:54",
        status:"Mixto"
    },

    {
        id:3,
        title:"Take Five",
        artist:"Dave Brubeck",
        genre:"Jazz",
        valence:0.63,
        energy:0.42,
        popularity:84,
        duration:"5:24",
        status:"Relajante"
    }

];

function SongsTable(){

    return(

        <div className="songs-table">

            <div className="table-header">

                <span>Canción</span>

                <span>Género</span>

                <span>Valencia</span>

                <span>Energía</span>

                <span>Popularidad</span>

                <span>Duración</span>

                <span>Estado</span>



            </div>

            <div className="table-body">

                {songs.map(song=>(

                    <SongRow

                        key={song.id}

                        song={song}

                    />

                ))}

            </div>

        </div>

    );

}

export default SongsTable;