const palette = [
    "#d7a400", // mostarda
    "#d44747", // rojo
    "#6d6d73", // gris
    "#3ba9ff", // celeste
    "#3d5bff", // azul
    "#ff7a3d", // naranja
    "#a93dff", // violeta
    "#ff3da0", // rosa
    "#33d17a", // verde
    "#33d1c0", // turquesa
];

export function getGenreColor(genre) {

    if (!genre) return palette[0];

    let hash = 0;

    for (let i = 0; i < genre.length; i++) {
        hash = genre.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % palette.length;

    return palette[index];

}