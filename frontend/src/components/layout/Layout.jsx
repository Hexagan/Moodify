import "./Layout.css";

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function Layout({ title, searchValue, onSearchChange, children }) {

    return (
        <div className="layout">

            <Sidebar />

            <div className="main-content">

                <Topbar
                    title={title}
                    searchValue={searchValue}
                    onSearchChange={onSearchChange}
                />

                <main className="page-content">
                    {children}
                </main>

            </div>

        </div>
    );

}

export default Layout;