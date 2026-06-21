import "./SortFilters.css";

import {
    ArrowDownUp
} from "react-bootstrap-icons";

function SortFilters(){

    const filters = [

        "Valencia",
        "Energía",
        "Popularidad",
        "Duración"

    ];

    return(

        <div className="sort-filters">

            {

                filters.map((filter,index)=>(

                    <button
                        key={index}
                        className="sort-button"
                    >

                        <ArrowDownUp/>

                        {filter}

                    </button>

                ))

            }

        </div>

    );

}

export default SortFilters;