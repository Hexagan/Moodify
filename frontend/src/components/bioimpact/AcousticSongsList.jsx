import "./AcousticSongsList.css";

// TODO: replace with FastAPI fetch (GET /bioimpact/top-acoustic-songs)
const songs = [
    { title:"Blackbird", artist:"The Beatles", genre:"Acústico", duration:"2:18", value:0.97 },
    { title:"Claire de Lune", artist:"Claude Debussy", genre:"Clásica", duration:"4:51", value:0.95 },
    { title:"The Sound of Silence", artist:"Simon & Garfunkel", genre:"Folk", duration:"3:05", value:0.91 },
    { title:"Jolene", artist:"Dolly Parton", genre:"Country", duration:"2:41", value:0.88 },
    { title:"La Vie en Rose", artist:"Édith Piaf", genre:"Jazz vocal", duration:"3:08", value:0.83 },
    { title:"Fragile", artist:"Sting", genre:"Pop", duration:"3:54", value:0.76 }
];

function AcousticSongsList() {

    return (

        <div className="acoustic-songs-list">

            {songs.map((song, index) => (

                <div className="acoustic-song-row" key={index}>

                    <div className="acoustic-song-info">
                        <h4>{song.title}</h4>
                        <span>{song.artist} - {song.genre} - {song.duration}</span>
                    </div>

                    <span className="acoustic-song-value">{song.value}</span>

                </div>

            ))}

        </div>

    );

}

export default AcousticSongsList;