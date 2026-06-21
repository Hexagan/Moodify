import { Star, StarFill } from "react-bootstrap-icons";
import "./StarRating.css";

function StarRating({ value }) {

    const stars = Math.round((value / 100) * 5);

    return (
        <div className="star-rating">
            {Array.from({ length: 5 }, (_, i) => (
                i < stars
                    ? <StarFill key={i} className="star-filled" />
                    : <Star key={i} className="star-empty" />
            ))}
        </div>
    );

}

export default StarRating;