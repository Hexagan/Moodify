import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Envelope, SendFill, CheckCircleFill } from "react-bootstrap-icons";

import Layout from "../components/layout/Layout";
import GuestPrompt from "../components/auth/GuestPrompt";
import { useAuth } from "../context/AuthContext";
import { sendSuggestion } from "../services/api";
import "./Settings.css";
import "./Contact.css";

const TITLE_MAX = 120;
const MESSAGE_MAX = 4000;

// Reached from Configuración. The backend decides where the message goes; the address
// never reaches the browser.
function Contact() {

    const { user } = useAuth();
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState(null);
    const [sent, setSent] = useState(false);

    if (!user) {
        return (
            <Layout title="Contacto">
                <div className="settings-guest">
                    <GuestPrompt action="enviarnos sugerencias" />
                </div>
            </Layout>
        );
    }

    const canSend = title.trim() && message.trim() && !sending;

    async function handleSubmit(e) {
        e.preventDefault();
        if (!canSend) return;
        setSending(true);
        setError(null);
        try {
            await sendSuggestion({ uid: user.uid, title: title.trim(), message: message.trim() });
            setSent(true);
            setTitle("");
            setMessage("");
        } catch (err) {
            setError(err.message);
        } finally {
            setSending(false);
        }
    }

    return (
        <Layout title="Contacto" subtitle="Sugerencias y comentarios">
            <div className="contact-page">

                <Link to="/configuracion#contacto" className="contact-back">
                    <ArrowLeft aria-hidden="true" /> Volver a Configuración
                </Link>

                <section className="settings-card">
                    <h2><Envelope aria-hidden="true" /> Enviar una sugerencia</h2>
                    <p className="settings-help">
                        Leemos todo lo que llega. Si hace falta, te respondemos a {user.email || "tu correo"}.
                    </p>

                    {sent ? (
                        <div className="contact-sent" role="status">
                            <CheckCircleFill aria-hidden="true" />
                            <span>
                                <strong>¡Gracias! Recibimos tu sugerencia.</strong>
                                <button type="button" onClick={() => setSent(false)}>Enviar otra</button>
                            </span>
                        </div>
                    ) : (
                        <form className="contact-form" onSubmit={handleSubmit}>
                            <label className="contact-field">
                                <span>Título</span>
                                <input
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    maxLength={TITLE_MAX}
                                    placeholder="Ej.: Filtrar el catálogo por año"
                                    required
                                />
                            </label>

                            <label className="contact-field">
                                <span>Mensaje</span>
                                <textarea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    maxLength={MESSAGE_MAX}
                                    rows={8}
                                    placeholder="¿Qué te gustaría que agreguemos? ¿Qué opinás del sitio?"
                                    required
                                />
                                <small className="contact-count">{message.length}/{MESSAGE_MAX}</small>
                            </label>

                            {error && <p className="contact-error" role="alert">{error}</p>}

                            <button type="submit" className="contact-submit" disabled={!canSend}>
                                <SendFill aria-hidden="true" /> {sending ? "Enviando…" : "Enviar"}
                            </button>
                        </form>
                    )}
                </section>

            </div>
        </Layout>
    );

}

export default Contact;
