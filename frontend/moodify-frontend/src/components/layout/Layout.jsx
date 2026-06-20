import "./Layout.css";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({ title, children }) {

    return (

        <div className="layout">

            <Sidebar />

            <div className="main-content">

                <Topbar title={title} />

                <main className="page-content">

                    {children}

                </main>

            </div>

        </div>

    );

}

export default Layout;