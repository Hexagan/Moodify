import { useAuth } from "../../context/AuthContext";
import Layout from "../layout/Layout";
import { ShieldLock } from "react-bootstrap-icons";
import "./AdminRoute.css";

function AdminRoute({ children }) {
    const { isAdmin } = useAuth();

    if (!isAdmin) {
        return (
            <Layout title="Acceso restringido">
                <div className="admin-restricted">
                    <ShieldLock />
                    <h2>Acceso restringido</h2>
                    <p>Esta funcionalidad solo está disponible para administradores.</p>
                </div>
            </Layout>
        );
    }

    return children;
}

export default AdminRoute;
