import { Link } from "react-router-dom";
import { ArrowLeft } from "react-bootstrap-icons";
import "./Privacy.css";
import logo from "../assets/logo-noBG.png";

// Public on purpose (Facebook Login requires a reachable privacy policy URL), but only linked
// from the login card, so it's left out of the sidebar.
const UPDATED = "1 de noviembre de 2026";

function Privacy() {

    return (

        <div className="privacy-page">

            <article className="privacy-card">

                <Link to="/login" className="privacy-back">
                    <ArrowLeft aria-hidden="true" /> Volver al inicio de sesión
                </Link>

                <header className="privacy-header">
                    <img src={logo} alt="" className="privacy-logo" />
                    <div>
                        <h1>Política de privacidad</h1>
                        <p>Moodify · Última actualización: {UPDATED}</p>
                    </div>
                </header>

                <p>
                    Moodify es una aplicación web para explorar música según su perfil emocional. Esta política
                    explica qué datos recopilamos, para qué los usamos y cómo podés consultarlos o eliminarlos.
                    Podés usar gran parte del sitio como invitado, sin dar ningún dato.
                </p>

                <h2>1. Datos que recopilamos</h2>
                <h3>Al crear una cuenta o iniciar sesión</h3>
                <p>
                    El inicio de sesión lo gestiona Firebase Authentication (Google). Según el método que elijas,
                    recibimos:
                </p>
                <ul>
                    <li><strong>Correo y contraseña:</strong> tu nombre, tu correo electrónico y la contraseña, que
                        Firebase guarda cifrada; nosotros nunca la vemos.</li>
                    <li><strong>Google o Facebook:</strong> tu nombre, tu correo electrónico y tu foto de perfil
                        públicos. No accedemos a tus contactos, publicaciones, amigos ni a ningún otro dato de esas
                        cuentas, y nunca publicamos nada en tu nombre.</li>
                </ul>

                <h3>Al usar Moodify</h3>
                <ul>
                    <li>Los datos de tu perfil: biografía, foto, géneros favoritos y qué partes son públicas.</li>
                    <li>Tu actividad: canciones escuchadas, me gusta y reacciones, playlists, comentarios,
                        hilos y respuestas en el foro de artistas, y las imágenes o videos que adjuntes.</li>
                    <li>Tus amistades y solicitudes de amistad dentro de Moodify.</li>
                    <li>Tu configuración: perfiles de color, accesibilidad y preferencias.</li>
                    <li>Las sugerencias que nos envíes desde la página de contacto, junto con tu nombre y tu correo
                        para poder responderte.</li>
                </ul>

                <h3>Integraciones opcionales</h3>
                <p>
                    Si conectás Spotify o YouTube desde Configuración, el permiso de acceso que otorgan esos
                    servicios se guarda solo en tu navegador y no llega a nuestros servidores. Podés desconectarlos
                    en cualquier momento desde Configuración o desde la propia cuenta del servicio.
                </p>

                <h2>2. Para qué usamos los datos</h2>
                <ul>
                    <li>Identificarte y mantener tu sesión.</li>
                    <li>Mostrar tu perfil, tus playlists y tu actividad, respetando lo que marcaste como público.</li>
                    <li>Generar recomendaciones a partir de tu historial y tus me gusta.</li>
                    <li>Moderar el foro y los comentarios.</li>
                    <li>Leer y responder tus sugerencias.</li>
                </ul>
                <p>
                    No vendemos tus datos, no los usamos para publicidad personalizada y no los compartimos con
                    terceros salvo los proveedores que hacen funcionar el sitio.
                </p>

                <h2>3. Proveedores</h2>
                <ul>
                    <li><strong>Firebase Authentication</strong> (Google): inicio de sesión.</li>
                    <li><strong>Vercel</strong>: alojamiento del sitio y almacenamiento de las imágenes y videos que subís.</li>
                    <li><strong>Neon</strong>: base de datos donde se guardan tu perfil y tu actividad.</li>
                    <li><strong>YouTube</strong> y <strong>Spotify</strong>: reproducción y búsqueda de canciones.
                        Al reproducir un video, YouTube aplica su propia política de privacidad.</li>
                </ul>

                <h2>4. Qué es público</h2>
                <p>
                    Tu nombre, tu foto, tus comentarios, tus publicaciones en el foro y las playlists que marques
                    como públicas pueden verlos otros usuarios. Tu correo, tu biografía y tus géneros favoritos se
                    muestran solo si lo elegís en tu perfil.
                </p>

                <h2>5. Almacenamiento en tu navegador</h2>
                <p>
                    Usamos el almacenamiento local del navegador para recordar preferencias (tema, barra lateral
                    contraída, modo del catálogo) y la conexión con Spotify o YouTube. No usamos cookies de
                    seguimiento ni de publicidad.
                </p>

                <h2>6. Tus derechos y cómo eliminar tus datos</h2>
                <ul>
                    <li><strong>Consultar y descargar:</strong> en Configuración → Datos y cuenta podés descargar tu
                        historial, tus me gusta, tus playlists y tu configuración.</li>
                    <li><strong>Corregir:</strong> podés editar tu perfil en cualquier momento.</li>
                    <li><strong>Borrar:</strong> podés borrar tu historial de escucha, tus comentarios, tus
                        publicaciones y tus playlists desde el propio sitio.</li>
                    <li><strong>Eliminar la cuenta:</strong> iniciá sesión y escribinos desde Configuración →
                        Contacto pidiendo la eliminación. Borramos tu cuenta y todos los datos asociados dentro de
                        los 30 días.</li>
                </ul>
                <p>
                    Si iniciaste sesión con Facebook, también podés quitar el acceso de Moodify desde la
                    configuración de Facebook (Configuración y privacidad → Integraciones comerciales o Apps y
                    sitios web) y luego pedirnos la eliminación de los datos como se indica arriba.
                </p>

                <h2>7. Conservación y seguridad</h2>
                <p>
                    Conservamos tus datos mientras tengas la cuenta. Las conexiones al sitio están cifradas (HTTPS)
                    y el acceso a la base de datos está restringido.
                </p>

                <h2>8. Menores</h2>
                <p>
                    Moodify no está dirigido a menores de 13 años y no recopilamos sus datos a sabiendas.
                </p>

                <h2>9. Cambios</h2>
                <p>
                    Si cambiamos esta política, actualizaremos la fecha de arriba. Los cambios importantes se
                    avisarán dentro del sitio.
                </p>

            </article>

        </div>

    );

}

export default Privacy;
