import "./RecentSongsTable.css";
import { ThreeDotsVertical } from "react-bootstrap-icons";

const songs = [
{
title:"Blinding Lights",
artist:"The Weeknd",
genre:"Pop",
valence:"0.83",
energy:"0.80"
},
{
title:"Hound Dog",
artist:"Elvis Presley",
genre:"Rock",
valence:"0.87",
energy:"0.79"
},
{
title:"Hotel California",
artist:"Eagles",
genre:"Rock",
valence:"0.50",
energy:"0.42"
},
{
title:"Enter Sandman",
artist:"Metallica",
genre:"Metal",
valence:"0.19",
energy:"0.97"
},
{
title:"Enter Sandman",
artist:"Metallica",
genre:"Metal",
valence:"0.19",
energy:"0.97"
},
{
title:"Enter Sandman",
artist:"Metallica",
genre:"Metal",
valence:"0.19",
energy:"0.97"
},
{
title:"Enter Sandman",
artist:"Metallica",
genre:"Metal",
valence:"0.19",
energy:"0.97"
},
{
title:"Enter Sandman",
artist:"Metallica",
genre:"Metal",
valence:"0.19",
energy:"0.97"
}
];

function RecentSongs(){

return(

<div className="recent-table">

<table>

<thead>

<tr>

<th>Canción</th>

<th>Género</th>

<th>Valencia</th>

<th>Energía</th>

<th></th>

</tr>

</thead>

<tbody>

{songs.map((song,index)=>(

<tr key={index}>

<td>

<div className="song-title">{song.title}</div>

<div className="song-artist">{song.artist}</div>

</td>

<td>

<span className={`badge ${song.genre.toLowerCase()}`}>

{song.genre}

</span>

</td>

<td>{song.valence}</td>

<td>{song.energy}</td>

<td>

<ThreeDotsVertical/>

</td>

</tr>

))}

</tbody>

</table>

</div>

)

}

export default RecentSongs;