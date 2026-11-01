import { useState } from "react";
import { ExclamationTriangleFill } from "react-bootstrap-icons";

import { BASE_PALETTES, TOKEN_GROUPS, contrastRatio } from "../../utils/themePalettes";

const HEX = /^#[0-9a-f]{6}$/i;

// WCAG AA: 4.5:1 for body text, 3:1 for large/secondary text.
const CONTRAST_CHECKS = [
    { fg: "text-primary", bg: "bg-card", min: 4.5, label: "El texto principal sobre las tarjetas" },
    { fg: "text-body", bg: "bg-card", min: 4.5, label: "Los párrafos sobre las tarjetas" },
    { fg: "text-secondary", bg: "bg-card", min: 3, label: "El texto secundario sobre las tarjetas" },
    { fg: "text-primary", bg: "bg-page", min: 4.5, label: "El texto principal sobre el fondo" },
    { fg: "accent-light", bg: "bg-card", min: 3, label: "Los enlaces sobre las tarjetas" },
];

function ColorField({ token, label, value, onChange }) {
    const [text, setText] = useState(value);
    // Keep the text box in step when the picker (or a base reset) changes the value.
    const [shown, setShown] = useState(value);
    if (shown !== value) {
        setShown(value);
        setText(value);
    }
    return (
        <label className="color-field">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(token, e.target.value)}
                aria-label={label}
            />
            <span className="color-field-label">{label}</span>
            <input
                className="color-field-hex"
                value={text}
                maxLength={7}
                spellCheck={false}
                aria-label={`${label} (hex)`}
                onChange={(e) => {
                    const next = e.target.value.trim();
                    setText(next);
                    if (HEX.test(next)) onChange(token, next.toLowerCase());
                }}
            />
        </label>
    );
}

// A miniature of the site drawn with the draft colours, scoped to this box only.
function Preview({ colors }) {
    const style = Object.fromEntries(Object.entries(colors).map(([k, v]) => [`--${k}`, v]));
    return (
        <div className="profile-preview" style={style} aria-label="Vista previa">
            <div className="profile-preview-page">
                <div className="profile-preview-card">
                    <strong>Recomendadas para vos</strong>
                    <p>Canciones parecidas a lo que te gustó.</p>
                    <span className="profile-preview-muted">Hace 2 horas · 3 veces</span>
                    <div className="profile-preview-row">
                        <button type="button" tabIndex={-1}>Reproducir</button>
                        <span className="profile-preview-link">Ver todo</span>
                        <span className="profile-preview-chip">Relajante</span>
                    </div>
                    <div className="profile-preview-scale">
                        <span style={{ background: colors["scale-low"] }} />
                        <span style={{ background: colors["scale-mid"] }} />
                        <span style={{ background: colors["scale-high"] }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ColorProfileEditor({ slot, profile, onSave, onCancel }) {

    const [name, setName] = useState(profile?.name ?? `Perfil ${slot + 1}`);
    const [base, setBase] = useState(profile?.base ?? "dark");
    const [colors, setColors] = useState(profile?.colors ?? { ...BASE_PALETTES.dark });

    function setColor(token, value) {
        setColors((prev) => ({ ...prev, [token]: value }));
    }

    function startFrom(nextBase) {
        if (!window.confirm(`¿Reemplazar todos los colores por los del modo ${nextBase === "dark" ? "oscuro" : "claro"}?`)) return;
        setBase(nextBase);
        setColors({ ...BASE_PALETTES[nextBase] });
    }

    const warnings = CONTRAST_CHECKS
        .map((c) => ({ ...c, ratio: contrastRatio(colors[c.fg], colors[c.bg]) }))
        .filter((c) => c.ratio < c.min);

    function save(use) {
        onSave({ name: name.trim() || `Perfil ${slot + 1}`, base, colors }, use);
    }

    return (

        <div className="profile-editor">

            <div className="profile-editor-head">
                <label className="settings-field">
                    <span>Nombre del perfil</span>
                    <input value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
                </label>
                <div className="profile-editor-base">
                    <span>Partir de</span>
                    <button type="button" className="pl-btn ghost" onClick={() => startFrom("dark")}>Oscuro</button>
                    <button type="button" className="pl-btn ghost" onClick={() => startFrom("light")}>Claro</button>
                </div>
            </div>

            <div className="profile-editor-body">

                <div className="profile-editor-groups">
                    {TOKEN_GROUPS.map((group) => (
                        <fieldset key={group.title} className="color-group">
                            <legend>{group.title}</legend>
                            {group.tokens.map(([token, label]) => (
                                <ColorField key={token} token={token} label={label} value={colors[token]} onChange={setColor} />
                            ))}
                        </fieldset>
                    ))}
                </div>

                <div className="profile-editor-side">
                    <Preview colors={colors} />
                    {warnings.length > 0 && (
                        <ul className="contrast-warnings" aria-label="Avisos de contraste">
                            {warnings.map((w) => (
                                <li key={`${w.fg}-${w.bg}`}>
                                    <ExclamationTriangleFill aria-hidden="true" />
                                    {w.label} tiene poco contraste ({w.ratio.toFixed(1)}:1, se recomienda {w.min}:1).
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

            </div>

            <div className="profile-editor-actions">
                <button type="button" className="pl-btn ghost" onClick={onCancel}>Cancelar</button>
                <button type="button" className="pl-btn" onClick={() => save(false)}>Guardar</button>
                <button type="button" className="pl-btn primary" onClick={() => save(true)}>Guardar y usar</button>
            </div>

        </div>

    );

}

export default ColorProfileEditor;
