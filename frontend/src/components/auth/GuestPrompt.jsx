import { Link } from "react-router-dom";
import { BoxArrowInRight } from "react-bootstrap-icons";
import "./GuestPrompt.css";

function GuestPrompt({ action }) {
    return (
        <div className="guest-prompt">
            <p>Iniciá sesión o creá una cuenta para {action}.</p>
            <Link to="/login" className="guest-prompt-btn">
                <BoxArrowInRight aria-hidden="true" /> Iniciar sesión
            </Link>
        </div>
    );
}

export default GuestPrompt;
