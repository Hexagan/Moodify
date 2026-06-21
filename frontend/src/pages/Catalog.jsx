import Layout from "../components/layout/Layout";

import GenreFilters from "../components/catalog/GenreFilters";
import SortFilters from "../components/catalog/SortFilters";
import SongsTable from "../components/catalog/SongsTable";

import "./Catalog.css";

function Catalog() {

    return (

        <Layout title="Catálogo">

            <div className="catalog-page">

                <div className="catalog-header">

                    <span className="catalog-count">

                        482 canciones

                    </span>

                </div>

                <GenreFilters/>

                <SortFilters/>

                <SongsTable/>

            </div>

        </Layout>

    );

}

export default Catalog;