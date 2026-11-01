import { Globe2, PeopleFill, LockFill } from "react-bootstrap-icons";

export const VISIBILITY = {
    public: { label: "Pública", hint: "Cualquiera con el enlace, aunque no tenga cuenta", Icon: Globe2 },
    friends: { label: "Solo amigos", hint: "Tus amigos en Moodify", Icon: PeopleFill },
    private: { label: "Privada", hint: "Solo vos", Icon: LockFill },
};

export function playlistUrl(id) {
    return `${window.location.origin}/playlist/${id}`;
}
