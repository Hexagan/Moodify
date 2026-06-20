import "./GenreDistributionCard.css";

const genres=[
{name:"Pop",value:24},
{name:"Rock",value:19},
{name:"Hip-hop",value:15},
{name:"EDM",value:12},
{name:"Jazz",value:8}
];

function GenreDistribution(){

return(

<div>

{genres.map((genre,index)=>(

<div className="genre-row" key={index}>

<div className="genre-top">

<span>{genre.name}</span>

<span>{genre.value}%</span>

</div>

<div className="genre-bar">

<div
className="genre-fill"
style={{width:`${genre.value}%`}}
></div>

</div>

</div>

))}

</div>

)

}

export default GenreDistribution;