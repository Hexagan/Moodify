import "./EditButton.css";
import { PencilSquare } from "react-bootstrap-icons";

function EditButton({ onClick }) {

    return (

        <button
            className="edit-button"
            onClick={onClick}
        >

            <PencilSquare />

        </button>

    );

}

export default EditButton;