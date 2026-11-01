import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
import logo from "../assets/logo-noBG.png";

import { auth, googleProvider, facebookProvider } from "../firebase";
import {
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";
import { needsEmailVerification, sendVerificationEmail } from "../utils/emailVerification";

function Login() {

    const [mode, setMode] = useState("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState(null);
    const [notice, setNotice] = useState(null);
    const [canResend, setCanResend] = useState(false);
    const navigate = useNavigate();

    function switchMode(next) {
        setMode(next);
        setError(null);
        setNotice(null);
        setCanResend(false);
    }

    // New email accounts get a confirmation link and stay signed out until they open it; the
    // Moodify profile is created on the first sign-in after that (see AuthContext).
    async function handleEmailSubmit() {
        setError(null);
        setNotice(null);
        setCanResend(false);
        try {
            if (mode === "register") {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await updateProfile(cred.user, { displayName: name });
                await sendVerificationEmail(cred.user);
                await signOut(auth);
                setMode("login");
                setNotice(`Te enviamos un correo a ${email}. Abrí el enlace para activar tu cuenta y después ingresá. Si no lo ves, revisá la carpeta de spam.`);
                return;
            }
            const cred = await signInWithEmailAndPassword(auth, email, password);
            if (needsEmailVerification(cred.user)) {
                await signOut(auth);
                setError("Tu correo todavía no está confirmado. Abrí el enlace que te enviamos al registrarte.");
                setCanResend(true);
                return;
            }
            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleResend() {
        setError(null);
        try {
            const cred = await signInWithEmailAndPassword(auth, email, password);
            await sendVerificationEmail(cred.user);
            await signOut(auth);
            setCanResend(false);
            setNotice(`Te reenviamos el correo de confirmación a ${email}.`);
        } catch (err) {
            setError(err.code === "auth/too-many-requests"
                ? "Pediste varios correos seguidos. Esperá unos minutos y probá de nuevo."
                : err.message);
        }
    }

    async function handleGoogle() {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    }

    async function handleFacebook() {
        setError(null);
        try {
            await signInWithPopup(auth, facebookProvider);
            navigate("/");
        } catch (err) {
            setError(err.message);
        }
    }

    return (

        <div className="login-page">

            <div className="login-card">

                <img src={logo} alt="Moodify" className="login-logo" />
                <h1 className="login-title">Moodify</h1>
                <p className="login-subtitle">
                    {mode === "login" ? "Ingresá a tu cuenta" : "Creá tu cuenta"}
                </p>

                {error && (
                    <div className="login-error" role="alert">
                        {error}
                        {canResend && (
                            <button type="button" className="login-resend" onClick={handleResend}>
                                Reenviar el correo de confirmación
                            </button>
                        )}
                    </div>
                )}
                {notice && <div className="login-notice" role="status">{notice}</div>}

                <div className="login-oauth">
                    <button className="oauth-btn google" onClick={handleGoogle}>
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.3 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.8 6C12.3 13.1 17.7 9.5 24 9.5z"/>
                            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.4 37.5 46.5 31.4 46.5 24.5z"/>
                            <path fill="#FBBC05" d="M10.5 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.8-6z"/>
                            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.3 0-11.7-3.6-13.5-8.8l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
                        </svg>
                        Continuar con Google
                    </button>

                    <button className="oauth-btn facebook" onClick={handleFacebook}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                            <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.04V9.41c0-3.02 1.8-4.7 4.54-4.7 1.31 0 2.68.24 2.68.24v2.97h-1.5c-1.5 0-1.96.93-1.96 1.89v2.26h3.32l-.53 3.5h-2.79V24C19.61 23.1 24 18.1 24 12.07z"/>
                        </svg>
                        Continuar con Facebook
                    </button>
                </div>

                <div className="login-divider"><span>o</span></div>

                <div className="login-form">

                    {mode === "register" && (
                        <input
                            placeholder="Nombre completo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    )}

                    <input
                        type="email"
                        placeholder="Correo electrónico"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
                    />

                    <button className="login-submit" onClick={handleEmailSubmit}>
                        {mode === "login" ? "Ingresar" : "Crear cuenta"}
                    </button>

                </div>

                <p className="login-switch">
                    {mode === "login"
                        ? <>¿No tenés cuenta? <span onClick={() => switchMode("register")}>Registrate</span></>
                        : <>¿Ya tenés cuenta? <span onClick={() => switchMode("login")}>Ingresá</span></>
                    }
                </p>

                <Link to="/" className="login-guest">Seguir como invitado</Link>

                <Link to="/privacidad" className="login-legal">Política de privacidad</Link>

            </div>

        </div>

    );

}

export default Login;