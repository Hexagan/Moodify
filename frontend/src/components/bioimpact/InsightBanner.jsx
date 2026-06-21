import "./InsightBanner.css";
import { Lightbulb } from "react-bootstrap-icons";

function InsightBanner({ text }) {

    return (

        <div className="insight-banner">

            <div className="insight-icon">
                <Lightbulb />
            </div>

            <p>{text}</p>

        </div>

    );

}

export default InsightBanner;