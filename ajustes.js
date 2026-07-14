// ============================================================
// AJUSTES VIMAR — ajustes.js
// Panel de configuración: atajos de teclado personalizables
// ============================================================

// ── Definición de atajos ──────────────────────────────────────
// Cada atajo: { id, label, accion, defecto: {key, ctrl, alt, shift, meta} }
const VIMAR_ATAJOS_DEF = [
    { id: 'calc',    label: 'Calculadora',       accion: () => { if (typeof vimarToggleCalc === 'function') vimarToggleCalc(); } },
    { id: 'buscar',  label: 'Buscador',           accion: () => { document.getElementById('inputBusqueda')?.focus(); } },
    { id: 'venta',   label: 'Guardar Venta',      accion: () => { if (typeof guardarVentaTicket === 'function') guardarVentaTicket(); } },
    { id: 'dia',     label: 'Cerrar Día',         accion: () => { if (typeof terminarDia === 'function') terminarDia(); } },
    { id: 'semana',  label: 'Guardar Semana',     accion: () => { if (typeof guardarSemana === 'function') guardarSemana(); } },
    { id: 'excel',   label: 'Excel Completo',     accion: () => { if (typeof generarExcelCompleto === 'function') generarExcelCompleto(); } },
    { id: 'limpiar', label: 'Limpiar Buscador',   accion: () => {
        const b = document.getElementById('inputBusqueda');
        if (b) { b.value = ''; if (typeof filtrarCatalogo === 'function') filtrarCatalogo(); b.blur(); }
    }},
];

const VIMAR_ATAJOS_DEFAULT = {
    calc:    { key: 'F1',  ctrl: false, alt: false, shift: false, meta: false },
    buscar:  { key: 'F2',  ctrl: false, alt: false, shift: false, meta: false },
    venta:   { key: 'F7',  ctrl: false, alt: false, shift: false, meta: false },
    dia:     { key: 'F8',  ctrl: false, alt: false, shift: false, meta: false },
    semana:  { key: 'F9',  ctrl: false, alt: false, shift: false, meta: false },
    excel:   { key: 'F10', ctrl: false, alt: false, shift: false, meta: false },
    limpiar: { key: 'Escape', ctrl: false, alt: false, shift: false, meta: false },
};

// ── Estado ────────────────────────────────────────────────────
let _atajos = {}; // id → {key, ctrl, alt, shift, meta}
let _ajustesVisible = false;
let _escuchando = null; // id del atajo que está esperando tecla

function _cargarAtajos() {
    const saved = localStorage.getItem('vimarAtajos');
    if (saved) {
        try { _atajos = { ...VIMAR_ATAJOS_DEFAULT, ...JSON.parse(saved) }; return; }
        catch(e) {}
    }
    _atajos = { ...VIMAR_ATAJOS_DEFAULT };
}

function _guardarAtajos() {
    localStorage.setItem('vimarAtajos', JSON.stringify(_atajos));
}

// ── Display de combinación ────────────────────────────────────
function _comboStr(combo) {
    const partes = [];
    if (combo.ctrl)  partes.push('Ctrl');
    if (combo.alt)   partes.push('Alt');
    if (combo.shift) partes.push('Shift');
    if (combo.meta)  partes.push('Win');
    if (combo.key)   partes.push(_keyLabel(combo.key));
    return partes.join(' + ') || '—';
}

function _keyLabel(key) {
    const map = { ' ': 'Espacio', 'ArrowUp': '↑', 'ArrowDown': '↓', 'ArrowLeft': '←', 'ArrowRight': '→',
        'Escape': 'ESC', 'Enter': 'Enter', 'Backspace': '←BS', 'Delete': 'Del', 'Tab': 'Tab',
        'F1':'F1','F2':'F2','F3':'F3','F4':'F4','F5':'F5','F6':'F6',
        'F7':'F7','F8':'F8','F9':'F9','F10':'F10','F11':'F11','F12':'F12' };
    return map[key] || key.toUpperCase();
}

// ── Barra de atajos en pantalla principal ─────────────────────
function vimarActualizarBarraAtajos() {
    const barra = document.getElementById('shortcuts-bar-content');
    if (!barra) return;
    const items = [
        { id: 'calc',    short: 'Calculadora' },
        { id: 'limpiar', short: 'Limpiar' },
        { id: 'buscar',  short: 'Buscador' },
        { id: 'venta',   short: 'Guardar Venta' },
        { id: 'dia',     short: 'Cerrar Día' },
        { id: 'semana',  short: 'Guardar Sem.' },
        { id: 'excel',   short: 'Excel' },
    ];
    barra.innerHTML = items.map(item =>
        `<span><b>${_comboStr(_atajos[item.id])}</b> ${item.short}</span>`
    ).join('') + '<span><b>↑ ↓ ← →</b> Navegar</span><span><b>Enter</b> Agregar</span>';
}

// ── Interceptor global de teclado ─────────────────────────────
function vimarAtajosKeydown(e) {
    if (!vimarRolActual) return;

    // Si el panel de ajustes está escuchando una tecla nueva
    if (_escuchando) {
        // Ignorar solo modificadores solos
        if (['Control','Alt','Shift','Meta'].includes(e.key)) return;
        e.preventDefault(); e.stopPropagation();
        _atajos[_escuchando] = {
            key: e.key,
            ctrl:  e.ctrlKey,
            alt:   e.altKey,
            shift: e.shiftKey,
            meta:  e.metaKey
        };
        _guardarAtajos();
        _detenerEscucha();
        _renderFilasAtajos();
        vimarActualizarBarraAtajos();
        return;
    }

    // Evaluar atajos
    for (const def of VIMAR_ATAJOS_DEF) {
        const combo = _atajos[def.id];
        if (!combo) continue;
        if (
            e.key === combo.key &&
            e.ctrlKey  === combo.ctrl &&
            e.altKey   === combo.alt &&
            e.shiftKey === combo.shift &&
            e.metaKey  === combo.meta
        ) {
            // No disparar si hay un input activo (excepto ESC y calc)
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
                if (def.id !== 'limpiar' && def.id !== 'calc') continue;
            }
            // No disparar si hay modal abierto (excepto calc)
            if (document.body.classList.contains('vimar-modal-abierto') && def.id !== 'calc') continue;
            e.preventDefault();
            if (typeof playSound === 'function') playSound('click');
            def.accion();
            return;
        }
    }
}

// ── Panel de ajustes DOM ──────────────────────────────────────
function _crearPanelAjustes() {
    if (document.getElementById('vimar-ajustes-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'vimar-ajustes-panel';
    panel.innerHTML = `
        <div id="vimar-ajustes-backdrop"></div>
        <div id="vimar-ajustes-caja">
            <div id="vimar-ajustes-header">
                <div style="display:flex;align-items:center;gap:10px;">
                    <i class="fas fa-cog" style="font-size:1.1em;"></i>
                    <span>AJUSTES</span>
                </div>
                <button id="vimar-ajustes-close" title="Cerrar">✕</button>
            </div>
            <div id="vimar-ajustes-body">
                <div class="vimar-ajustes-seccion-titulo">Atajos de Teclado</div>
                <p class="vimar-ajustes-hint">Haz clic en <b>Cambiar</b> y luego presiona la tecla o combinación deseada.<br>Se admite cualquier combinación con Ctrl, Alt, Shift o Win.</p>
                <div id="vimar-ajustes-tabla"></div>
                <div id="vimar-ajustes-escuchando-msg" style="display:none;"></div>
                <div class="vimar-ajustes-footer-btns">
                    <button id="vimar-ajustes-reset" class="vimar-aj-btn vimar-aj-btn-danger">
                        <i class="fas fa-undo"></i> Restablecer predeterminados
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    document.getElementById('vimar-ajustes-backdrop').addEventListener('click', cerrarAjustes);
    document.getElementById('vimar-ajustes-close').addEventListener('click', cerrarAjustes);
    document.getElementById('vimar-ajustes-reset').addEventListener('click', _resetAtajos);

    _renderFilasAtajos();
}

function _renderFilasAtajos() {
    const tabla = document.getElementById('vimar-ajustes-tabla');
    if (!tabla) return;
    tabla.innerHTML = '';

    VIMAR_ATAJOS_DEF.forEach(def => {
        const combo = _atajos[def.id] || VIMAR_ATAJOS_DEFAULT[def.id];
        const fila = document.createElement('div');
        fila.className = 'vimar-aj-fila';
        fila.id = `vimar-aj-fila-${def.id}`;
        fila.innerHTML = `
            <span class="vimar-aj-label">${def.label}</span>
            <span class="vimar-aj-combo" id="vimar-aj-combo-${def.id}">${_comboStr(combo)}</span>
            <button class="vimar-aj-btn vimar-aj-btn-cambiar" id="vimar-aj-btn-${def.id}" data-id="${def.id}">
                Cambiar
            </button>
            <button class="vimar-aj-btn vimar-aj-btn-reset-uno" data-id="${def.id}" title="Restablecer este atajo">
                <i class="fas fa-undo"></i>
            </button>
        `;
        fila.querySelector('.vimar-aj-btn-cambiar').addEventListener('click', (e) => {
            _iniciarEscucha(e.currentTarget.dataset.id);
        });
        fila.querySelector('.vimar-aj-btn-reset-uno').addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            _atajos[id] = { ...VIMAR_ATAJOS_DEFAULT[id] };
            _guardarAtajos();
            _renderFilasAtajos();
            vimarActualizarBarraAtajos();
        });
        tabla.appendChild(fila);
    });
}

function _iniciarEscucha(id) {
    if (_escuchando) _detenerEscucha(); // cancelar anterior
    _escuchando = id;

    // Resaltar fila activa
    document.querySelectorAll('.vimar-aj-fila').forEach(f => f.classList.remove('vimar-aj-fila--escuchando'));
    document.getElementById(`vimar-aj-fila-${id}`)?.classList.add('vimar-aj-fila--escuchando');
    document.getElementById(`vimar-aj-combo-${id}`).textContent = '⌨ Presiona la tecla...';

    const msg = document.getElementById('vimar-ajustes-escuchando-msg');
    if (msg) { msg.style.display = 'block'; msg.textContent = `Presiona la combinación para "${VIMAR_ATAJOS_DEF.find(d=>d.id===id)?.label}"... (ESC para cancelar)`; }

    if (typeof playSound === 'function') playSound('click');
}

function _detenerEscucha() {
    if (!_escuchando) return;
    const id = _escuchando;
    _escuchando = null;
    document.querySelectorAll('.vimar-aj-fila').forEach(f => f.classList.remove('vimar-aj-fila--escuchando'));
    // Restaurar display con combo actual
    const combo = _atajos[id] || VIMAR_ATAJOS_DEFAULT[id];
    const el = document.getElementById(`vimar-aj-combo-${id}`);
    if (el) el.textContent = _comboStr(combo);
    const msg = document.getElementById('vimar-ajustes-escuchando-msg');
    if (msg) msg.style.display = 'none';
}

function _resetAtajos() {
    if (_escuchando) _detenerEscucha();
    _atajos = { ...VIMAR_ATAJOS_DEFAULT };
    _guardarAtajos();
    _renderFilasAtajos();
    vimarActualizarBarraAtajos();
    if (typeof playSound === 'function') playSound('success');
}

// ── Abrir / cerrar ────────────────────────────────────────────
function abrirAjustes() {
    _crearPanelAjustes();
    if (typeof playSound === 'function') playSound('click');
    const panel = document.getElementById('vimar-ajustes-panel');
    panel.classList.add('vimar-ajustes-visible');
    _ajustesVisible = true;
}

function cerrarAjustes() {
    if (_escuchando) _detenerEscucha();
    const panel = document.getElementById('vimar-ajustes-panel');
    if (panel) panel.classList.remove('vimar-ajustes-visible');
    _ajustesVisible = false;
    if (typeof playSound === 'function') playSound('click');
}

// ── ESC también cierra ajustes ────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _ajustesVisible) {
        if (_escuchando) { _detenerEscucha(); return; }
        cerrarAjustes();
    }
}, true);

// ── Init ──────────────────────────────────────────────────────
_cargarAtajos();
document.addEventListener('keydown', vimarAtajosKeydown);

// Exponer para que ui.js pueda actualizar la barra al iniciar
window.vimarActualizarBarraAtajos = vimarActualizarBarraAtajos;