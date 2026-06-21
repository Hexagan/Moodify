import "./TabSelector.css";
import { PlusCircle, PencilSquare, Trash } from "react-bootstrap-icons";

const tabs = [
    { id:"nueva", label:"Nueva canción", icon:<PlusCircle /> },
    { id:"modificar", label:"Modificar", icon:<PencilSquare /> },
    { id:"eliminar", label:"Eliminar", icon:<Trash /> }
];

function TabSelector({ activeTab, onTabChange }) {

    return (
        <div className="tab-selector">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    className={activeTab === tab.id ? "tab-btn active" : "tab-btn"}
                    onClick={() => onTabChange(tab.id)}
                >
                    {tab.icon}
                    {tab.label}
                </button>
            ))}
        </div>
    );

}

export default TabSelector;