const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });

const UNITS = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60]
];

export function timeAgo(iso) {
    if (!iso) return "";
    const seconds = (new Date(iso).getTime() - Date.now()) / 1000;
    for (const [unit, size] of UNITS) {
        if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    }
    return "hace un momento";
}
