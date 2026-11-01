import { ShieldCheck } from "react-bootstrap-icons";
import { Link } from "react-router-dom";
import { timeAgo } from "../../utils/timeAgo";
import "./Forum.css";

export function ForumMedia({ url, type }) {
    if (!url) return null;
    return (
        <div className="forum-media">
            {type === "video"
                ? <video src={url} controls preload="metadata" />
                : (
                    <a href={url} target="_blank" rel="noreferrer" title="Ver imagen completa">
                        <img src={url} alt="Imagen adjunta" loading="lazy" />
                    </a>
                )
            }
        </div>
    );
}

export function AuthorLine({ author, date, label, editedAt }) {
    const avatar = author.photo_url
        ? <img src={author.photo_url} alt="" />
        : <span>{author.name?.[0]?.toUpperCase() ?? "?"}</span>;
    return (
        <div className="author-line">
            {author.uid ? (
                <>
                    <Link to={`/perfil/${author.uid}`} className="author-avatar" aria-hidden="true" tabIndex={-1}>{avatar}</Link>
                    <Link to={`/perfil/${author.uid}`} className="author-name">{author.name}</Link>
                </>
            ) : (
                <>
                    <span className="author-avatar" aria-hidden="true">{avatar}</span>
                    <span className="author-name">{author.name}</span>
                </>
            )}
            {author.is_admin && <span className="author-admin"><ShieldCheck /> Admin</span>}
            <span className="author-time" title={date ? new Date(date).toLocaleString("es-AR") : ""}>
                {label ? `${label} ` : ""}{timeAgo(date)}
            </span>
            {editedAt && (
                <span className="author-time" title={`Editado ${new Date(editedAt).toLocaleString("es-AR")}`}>· editado</span>
            )}
        </div>
    );
}
