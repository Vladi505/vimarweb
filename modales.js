// ============================================================
// MODALES.JS — Sistema de modales: confirmar, alerta, prompt,
//              formulario multi-campo
// ============================================================

let _vimarModalConfirmarResolver = null;
let _vimarModalAlertaResolver    = null;
let _vimarModalPromptResolver    = null;
let _vimarModalFormularioResolver = null;
let _vimarModalFormularioCampos   = [];
let _vimarModalesTecladoInit      = false;

// --- Capa body (clase vimar-modal-abierto) ---

function vimarActualizarCapaModalBody() {
    const c    = document.getElementById('vimar-modal-confirmar')?.classList.contains('vimar-modal-confirmar--visible');
    const a    = document.getElementById('vimar-modal-alerta')?.classList.contains('vimar-modal-alerta--visible');
    const p    = document.getElementById('vimar-modal-prompt')?.classList.contains('vimar-modal-prompt--visible');
    const f    = document.getElementById('vimar-modal-formulario')?.classList.contains('vimar-modal-confirmar--visible');
    const prod = document.getElementById('vimar-modal-producto')?.classList.contains('vimar-modal-confirmar--visible');
    const info = document.getElementById('vimar-popup-producto-info')?.classList.contains('vimar-modal-confirmar--visible');
    const cat  = document.getElementById('vimar-modal-categoria')?.classList.contains('vimar-modal-confirmar--visible');
    const ecat = document.getElementById('vimar-modal-editar-cat')?.classList.contains('vimar-modal-confirmar--visible');
    document.body.classList.toggle('vimar-modal-abierto', !!(c || a || p || f || prod || info || cat || ecat));
}

// --- Teclado global (ESC cierra el modal superior) ---

function vimarModalGlobalKeydown(e) {
    if (!document.body.classList.contains('vimar-modal-abierto')) return;
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();

    // Orden de prioridad: el modal más "encima" primero
    const checks = [
        { id: 'vimar-popup-producto-info',  fn: () => cerrarInfoProductoAdmin()       },
        { id: 'vimar-modal-confirmar',      fn: () => cerrarModalConfirmarVimar(false) },
        { id: 'vimar-modal-alerta',         fn: () => cerrarModalAlertaVimar()         },
        { id: 'vimar-modal-prompt',         fn: () => cerrarModalPromptVimar(null)     },
        { id: 'vimar-modal-formulario',     fn: () => cerrarModalFormulario(null)      },
        { id: 'vimar-modal-producto',       fn: () => cerrarModalProducto()            },
        { id: 'vimar-modal-categoria',      fn: () => cerrarModalCategoria()           },
        { id: 'vimar-modal-editar-cat',     fn: () => cerrarModalEditarCategoria()     },
    ];

    for (const { id, fn } of checks) {
        const el = document.getElementById(id);
        const visClass = id === 'vimar-modal-alerta'
            ? 'vimar-modal-alerta--visible'
            : id === 'vimar-modal-prompt'
                ? 'vimar-modal-prompt--visible'
                : 'vimar-modal-confirmar--visible';
        if (el?.classList.contains(visClass)) { fn(); return; }
    }
}

function inicializarModalesVimarTeclado() {
    if (_vimarModalesTecladoInit) return;
    _vimarModalesTecladoInit = true;
    document.addEventListener('keydown', vimarModalGlobalKeydown, true);
}

// --- Modal Confirmar ---

function cerrarModalConfirmarVimar(resultado, conSonido = true) {
    if (_vimarModalConfirmarResolver === null) return;
    const resolve = _vimarModalConfirmarResolver;
    _vimarModalConfirmarResolver = null;
    const root = document.getElementById('vimar-modal-confirmar');
    if (root) {
        root.classList.remove('vimar-modal-confirmar--visible');
        root.setAttribute('aria-hidden', 'true');
    }
    document.querySelector('#vimar-modal-confirmar .vimar-modal-confirmar-caja')?.classList.remove('vimar-modal-peligroso');
    vimarActualizarCapaModalBody();
    if (conSonido && typeof playSound === 'function') playSound('click');
    resolve(resultado);
}

function inicializarModalConfirmarVimar() {
    const root = document.getElementById('vimar-modal-confirmar');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';
    root.querySelector('.vimar-modal-confirmar-backdrop').addEventListener('click', () => cerrarModalConfirmarVimar(false));
    document.getElementById('vimar-modal-confirmar-no').addEventListener('click',  () => cerrarModalConfirmarVimar(false));
    document.getElementById('vimar-modal-confirmar-si').addEventListener('click',  () => cerrarModalConfirmarVimar(true));
    inicializarModalesVimarTeclado();
}

function mostrarModalConfirmar(mensaje, opciones = {}) {
    return new Promise(resolve => {
        const root = document.getElementById('vimar-modal-confirmar');
        if (!root) { resolve(false); return; }
        inicializarModalConfirmarVimar();
        if (_vimarModalConfirmarResolver !== null) cerrarModalConfirmarVimar(false, false);
        if (_vimarModalAlertaResolver    !== null) cerrarModalAlertaVimar(false);
        if (_vimarModalPromptResolver    !== null) cerrarModalPromptVimar(null, false);
        _vimarModalConfirmarResolver = resolve;

        document.getElementById('vimar-modal-confirmar-titulo').textContent = opciones.titulo   || 'Confirmar';
        document.getElementById('vimar-modal-confirmar-msg').textContent    = mensaje;
        document.getElementById('vimar-modal-confirmar-si').textContent     = opciones.btnOk    || 'Aceptar';
        document.getElementById('vimar-modal-confirmar-no').textContent     = opciones.btnCancel || 'Cancelar';
        root.querySelector('.vimar-modal-confirmar-caja').classList.toggle('vimar-modal-peligroso', opciones.peligroso === true);

        root.setAttribute('aria-hidden', 'false');
        root.classList.add('vimar-modal-confirmar--visible');
        vimarActualizarCapaModalBody();
        if (typeof playSound === 'function') playSound('click');
        requestAnimationFrame(() => document.getElementById('vimar-modal-confirmar-si')?.focus());
    });
}

// --- Modal Alerta ---

function cerrarModalAlertaVimar(conSonido = true) {
    if (_vimarModalAlertaResolver === null) return;
    const resolve = _vimarModalAlertaResolver;
    _vimarModalAlertaResolver = null;
    const root = document.getElementById('vimar-modal-alerta');
    if (root) { root.classList.remove('vimar-modal-alerta--visible'); root.setAttribute('aria-hidden', 'true'); }
    document.getElementById('vimar-modal-alerta-caja')?.classList.remove(
        'vimar-modal-alerta--tipo-error', 'vimar-modal-alerta--tipo-success', 'vimar-modal-alerta--tipo-info');
    vimarActualizarCapaModalBody();
    if (conSonido && typeof playSound === 'function') playSound('click');
    resolve();
}

function inicializarModalAlertaVimar() {
    const root = document.getElementById('vimar-modal-alerta');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';
    root.querySelector('.vimar-modal-alerta-backdrop').addEventListener('click', () => cerrarModalAlertaVimar());
    document.getElementById('vimar-modal-alerta-ok').addEventListener('click', () => cerrarModalAlertaVimar());
    inicializarModalesVimarTeclado();
}

function mostrarModalAlerta(mensaje, opciones = {}) {
    return new Promise(resolve => {
        const root = document.getElementById('vimar-modal-alerta');
        if (!root) { resolve(); return; }
        inicializarModalAlertaVimar();
        if (_vimarModalAlertaResolver    !== null) cerrarModalAlertaVimar(false);
        if (_vimarModalConfirmarResolver !== null) cerrarModalConfirmarVimar(false, false);
        if (_vimarModalPromptResolver    !== null) cerrarModalPromptVimar(null, false);
        _vimarModalAlertaResolver = resolve;

        const tipo = opciones.tipo || 'info';
        document.getElementById('vimar-modal-alerta-titulo').textContent = opciones.titulo || 'Aviso';
        document.getElementById('vimar-modal-alerta-msg').textContent    = mensaje;
        document.getElementById('vimar-modal-alerta-ok').textContent     = opciones.btnOk || 'Aceptar';

        const caja = document.getElementById('vimar-modal-alerta-caja');
        caja.classList.remove('vimar-modal-alerta--tipo-error', 'vimar-modal-alerta--tipo-success', 'vimar-modal-alerta--tipo-info');
        caja.classList.add(`vimar-modal-alerta--tipo-${tipo}`);

        root.setAttribute('aria-hidden', 'false');
        root.classList.add('vimar-modal-alerta--visible');
        vimarActualizarCapaModalBody();
        if (typeof playSound === 'function') playSound('click');
        requestAnimationFrame(() => document.getElementById('vimar-modal-alerta-ok')?.focus());
    });
}

// --- Modal Prompt ---

function cerrarModalPromptVimar(resultado, conSonido = true) {
    if (_vimarModalPromptResolver === null) return;
    const resolve = _vimarModalPromptResolver;
    _vimarModalPromptResolver = null;
    const root  = document.getElementById('vimar-modal-prompt');
    const input = document.getElementById('vimar-modal-prompt-input');
    if (root)  { root.classList.remove('vimar-modal-prompt--visible'); root.setAttribute('aria-hidden', 'true'); }
    if (input) input.value = '';
    vimarActualizarCapaModalBody();
    if (conSonido && typeof playSound === 'function') playSound('click');
    resolve(resultado);
}

function inicializarModalPromptVimar() {
    const root = document.getElementById('vimar-modal-prompt');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';
    root.querySelector('.vimar-modal-prompt-backdrop').addEventListener('click', () => cerrarModalPromptVimar(null));
    document.getElementById('vimar-modal-prompt-cancel').addEventListener('click', () => cerrarModalPromptVimar(null));
    document.getElementById('vimar-modal-prompt-ok').addEventListener('click', () => {
        cerrarModalPromptVimar(document.getElementById('vimar-modal-prompt-input').value);
    });
    document.getElementById('vimar-modal-prompt-input').addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); cerrarModalPromptVimar(e.target.value); }
    });
    inicializarModalesVimarTeclado();
}

function mostrarModalPrompt(mensaje, valorDefecto, opciones = {}) {
    const defecto = valorDefecto == null ? '' : String(valorDefecto);
    return new Promise(resolve => {
        const root = document.getElementById('vimar-modal-prompt');
        if (!root) { resolve(null); return; }
        inicializarModalPromptVimar();
        if (_vimarModalPromptResolver    !== null) cerrarModalPromptVimar(null, false);
        if (_vimarModalConfirmarResolver !== null) cerrarModalConfirmarVimar(false, false);
        if (_vimarModalAlertaResolver    !== null) cerrarModalAlertaVimar(false);
        _vimarModalPromptResolver = resolve;

        document.getElementById('vimar-modal-prompt-titulo').textContent  = opciones.titulo   || 'Entrada';
        document.getElementById('vimar-modal-prompt-msg').textContent     = mensaje;
        document.getElementById('vimar-modal-prompt-ok').textContent      = opciones.btnOk    || 'Aceptar';
        document.getElementById('vimar-modal-prompt-cancel').textContent  = opciones.btnCancel || 'Cancelar';
        const input = document.getElementById('vimar-modal-prompt-input');
        input.type        = opciones.inputType === 'number' ? 'number' : 'text';
        input.placeholder = opciones.placeholder || '';
        input.value       = defecto;
        input.step        = opciones.step != null ? opciones.step : 'any';

        root.setAttribute('aria-hidden', 'false');
        root.classList.add('vimar-modal-prompt--visible');
        vimarActualizarCapaModalBody();
        if (typeof playSound === 'function') playSound('click');
        setTimeout(() => { input.focus(); input.select(); }, 80);
    });
}

// --- Modal Formulario multi-campo ---

function cerrarModalFormulario(resultado, conSonido = true) {
    const resolve = _vimarModalFormularioResolver;
    _vimarModalFormularioResolver = null;
    _vimarModalFormularioCampos   = [];
    const root = document.getElementById('vimar-modal-formulario');
    if (root) { root.classList.remove('vimar-modal-confirmar--visible'); root.setAttribute('aria-hidden', 'true'); }
    const cont = document.getElementById('vimar-modal-formulario-campos');
    if (cont) cont.innerHTML = '';
    vimarActualizarCapaModalBody();
    if (conSonido && resolve && resultado === null && typeof playSound === 'function') playSound('click');
    if (resolve) resolve(resultado);
}

function confirmarModalFormulario() {
    if (typeof playSound === 'function') playSound('click');
    const valores = {};
    _vimarModalFormularioCampos.forEach(campo => {
        const el = document.getElementById('vimar-form-' + campo.id);
        if (el) valores[campo.id] = el.value;
    });
    cerrarModalFormulario(valores, false);
}

function inicializarModalFormularioVimar() {
    const root = document.getElementById('vimar-modal-formulario');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';
    root.querySelector('.vimar-modal-confirmar-backdrop').addEventListener('click', () => cerrarModalFormulario(null));
    inicializarModalesVimarTeclado();
}

function mostrarModalFormulario(titulo, campos, opciones = {}) {
    return new Promise(resolve => {
        const root = document.getElementById('vimar-modal-formulario');
        if (!root) { resolve(null); return; }
        inicializarModalFormularioVimar();
        if (_vimarModalFormularioResolver !== null) cerrarModalFormulario(null, false);
        if (_vimarModalPromptResolver     !== null) cerrarModalPromptVimar(null, false);
        if (_vimarModalConfirmarResolver  !== null) cerrarModalConfirmarVimar(false, false);
        if (_vimarModalAlertaResolver     !== null) cerrarModalAlertaVimar(false);
        _vimarModalFormularioResolver = resolve;
        _vimarModalFormularioCampos   = campos;

        document.getElementById('vimar-modal-formulario-titulo').textContent = titulo || 'Editar';
        const cont = document.getElementById('vimar-modal-formulario-campos');
        cont.innerHTML = '';

        campos.forEach((campo, idx) => {
            const wrap  = document.createElement('div');
            const lbl   = document.createElement('label');
            lbl.style.cssText = 'font-size:0.8em;color:#aaa;letter-spacing:1px;text-transform:uppercase;display:block;';
            lbl.textContent   = campo.label || campo.id;
            wrap.appendChild(lbl);

            const input       = document.createElement('input');
            input.id          = 'vimar-form-' + campo.id;
            input.className   = 'vimar-modal-prompt-input';
            input.style.margin = '4px 0 0 0';
            input.type        = campo.type === 'number' ? 'number' : 'text';
            input.value       = campo.value != null ? String(campo.value) : '';
            input.placeholder = campo.placeholder || '';
            input.step        = campo.step != null ? campo.step : 'any';
            if (campo.readonly) { input.readOnly = true; input.style.opacity = '0.7'; input.style.cursor = 'default'; }
            wrap.appendChild(input);
            cont.appendChild(wrap);
            if (idx === 0 && !campo.readonly) setTimeout(() => { input.focus(); input.select(); }, 80);
        });

        const btnGuardar = root.querySelector('.vimar-modal-confirmar-btn--primary');
        if (btnGuardar) btnGuardar.textContent = opciones.btnOk || 'Guardar';

        root.setAttribute('aria-hidden', 'false');
        root.classList.add('vimar-modal-confirmar--visible');
        vimarActualizarCapaModalBody();
        if (typeof playSound === 'function') playSound('click');
    });
}