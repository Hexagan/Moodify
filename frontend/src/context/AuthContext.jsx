import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { upsertUser } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [user, setUser] = useState(undefined);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (firebaseUser) => {
            setUser(firebaseUser);
            setLoading(false);

            if (firebaseUser) {
                upsertUser({
                    uid: firebaseUser.uid,
                    display_name: firebaseUser.displayName || firebaseUser.email,
                    email: firebaseUser.email,
                    photo_url: firebaseUser.photoURL,
                }).then(setProfile).catch((err) => {
                    console.error("Failed to sync user profile:", err);
                });
            } else {
                setProfile(null);
            }
        });
        return unsub;
    }, []);

    async function logout() {
        await signOut(auth);
    }

    const isAdmin = profile?.role === "dev";

    return (
        <AuthContext.Provider value={{ user, profile, setProfile, isAdmin, loading, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );

}

export function useAuth() {
    return useContext(AuthContext);
}