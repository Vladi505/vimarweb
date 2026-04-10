// --- LÓGICA DE DATOS Y PERSISTENCIA ---

function playSound(tipo) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const ahora = audioCtx.currentTime;

    switch (tipo) {
        case 'click': // Sonido suave para botones y productos
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, ahora);
            gainNode.gain.setValueAtTime(0.1, ahora);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.1);
            oscillator.start(ahora);
            oscillator.stop(ahora + 0.1);
            break;
        case 'delete': // Sonido descendente para borrar
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(400, ahora);
            oscillator.frequency.exponentialRampToValueAtTime(100, ahora + 0.2);
            gainNode.gain.setValueAtTime(0.05, ahora);
            gainNode.gain.linearRampToValueAtTime(0, ahora + 0.2);
            oscillator.start(ahora);
            oscillator.stop(ahora + 0.2);
            break;
        case 'success': // Fanfarria corta para guardar (Día/Semana)
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(400, ahora);
            oscillator.frequency.setValueAtTime(600, ahora + 0.1);
            oscillator.frequency.setValueAtTime(800, ahora + 0.2);
            gainNode.gain.setValueAtTime(0.1, ahora);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.3);
            oscillator.start(ahora);
            oscillator.stop(ahora + 0.3);
            break;
        case 'sidebar': // Desplazamiento para el menú
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(200, ahora);
            oscillator.frequency.exponentialRampToValueAtTime(500, ahora + 0.15);
            gainNode.gain.setValueAtTime(0.05, ahora);
            gainNode.gain.linearRampToValueAtTime(0, ahora + 0.15);
            oscillator.start(ahora);
            oscillator.stop(ahora + 0.15);
            break;
        case 'excel': // Sonido metálico para reporte
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(150, ahora);
            gainNode.gain.setValueAtTime(0.05, ahora);
            gainNode.gain.exponentialRampToValueAtTime(0.01, ahora + 0.4);
            oscillator.start(ahora);
            oscillator.stop(ahora + 0.4);
            break;
        case 'error': // Sonido de advertencia o casilla vacía
            oscillator.type = 'square'; // Onda cuadrada para un sonido más agresivo
            oscillator.frequency.setValueAtTime(150, ahora);
            oscillator.frequency.setValueAtTime(120, ahora + 0.1); // Baja el tono
            gainNode.gain.setValueAtTime(0.1, ahora);
            gainNode.gain.linearRampToValueAtTime(0, ahora + 0.2);
            oscillator.start(ahora);
            oscillator.stop(ahora + 0.2);
            break;
        case 'hover': // Sonido muy sutil para pasar el mouse
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(400, ahora); // Tono medio
            oscillator.frequency.exponentialRampToValueAtTime(600, ahora + 0.05); // Breve ascenso
            gainNode.gain.setValueAtTime(0.02, ahora); // Volumen muy bajo (2%)
            gainNode.gain.linearRampToValueAtTime(0, ahora + 0.05);
            oscillator.start(ahora);
            oscillator.stop(ahora + 0.05);
            break;
    }
}

// --- Modales Neon / Glass (confirmar, alerta, prompt) ---
let _vimarModalConfirmarResolver = null;
let _vimarModalAlertaResolver = null;
let _vimarModalPromptResolver = null;
let _vimarModalesTecladoInit = false;

function vimarActualizarCapaModalBody() {
    const c = document.getElementById('vimar-modal-confirmar')?.classList.contains('vimar-modal-confirmar--visible');
    const a = document.getElementById('vimar-modal-alerta')?.classList.contains('vimar-modal-alerta--visible');
    const p = document.getElementById('vimar-modal-prompt')?.classList.contains('vimar-modal-prompt--visible');
    document.body.classList.toggle('vimar-modal-abierto', !!(c || a || p));
}

function vimarModalGlobalKeydown(e) {
    if (!document.body.classList.contains('vimar-modal-abierto')) return;
    if (e.key !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    const pr = document.getElementById('vimar-modal-prompt');
    if (pr?.classList.contains('vimar-modal-prompt--visible')) {
        cerrarModalPromptVimar(null);
        return;
    }
    const al = document.getElementById('vimar-modal-alerta');
    if (al?.classList.contains('vimar-modal-alerta--visible')) {
        cerrarModalAlertaVimar();
        return;
    }
    if (document.getElementById('vimar-modal-confirmar')?.classList.contains('vimar-modal-confirmar--visible')) {
        cerrarModalConfirmarVimar(false);
    }
}

function inicializarModalesVimarTeclado() {
    if (_vimarModalesTecladoInit) return;
    _vimarModalesTecladoInit = true;
    document.addEventListener('keydown', vimarModalGlobalKeydown, true);
}

function cerrarModalConfirmarVimar(resultado) {
    if (_vimarModalConfirmarResolver === null) return;
    const resolve = _vimarModalConfirmarResolver;
    _vimarModalConfirmarResolver = null;
    const root = document.getElementById('vimar-modal-confirmar');
    if (root) {
        root.classList.remove('vimar-modal-confirmar--visible');
        root.setAttribute('aria-hidden', 'true');
    }
    const caja = document.querySelector('#vimar-modal-confirmar .vimar-modal-confirmar-caja');
    if (caja) caja.classList.remove('vimar-modal-peligroso');
    vimarActualizarCapaModalBody();
    resolve(resultado);
}

function inicializarModalConfirmarVimar() {
    const root = document.getElementById('vimar-modal-confirmar');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';
    root.querySelector('.vimar-modal-confirmar-backdrop').addEventListener('click', () => cerrarModalConfirmarVimar(false));
    document.getElementById('vimar-modal-confirmar-no').addEventListener('click', () => cerrarModalConfirmarVimar(false));
    document.getElementById('vimar-modal-confirmar-si').addEventListener('click', () => cerrarModalConfirmarVimar(true));
    inicializarModalesVimarTeclado();
}

function mostrarModalConfirmar(mensaje, opciones) {
    opciones = opciones || {};
    return new Promise((resolve) => {
        const root = document.getElementById('vimar-modal-confirmar');
        if (!root) {
            resolve(false);
            return;
        }
        inicializarModalConfirmarVimar();
        if (_vimarModalConfirmarResolver !== null) cerrarModalConfirmarVimar(false);
        if (_vimarModalAlertaResolver !== null) cerrarModalAlertaVimar();
        if (_vimarModalPromptResolver !== null) cerrarModalPromptVimar(null);
        _vimarModalConfirmarResolver = resolve;

        const titulo = opciones.titulo != null ? opciones.titulo : 'Confirmar';
        const okText = opciones.btnOk || 'Aceptar';
        const cancelText = opciones.btnCancel || 'Cancelar';
        const peligroso = opciones.peligroso === true;

        document.getElementById('vimar-modal-confirmar-titulo').textContent = titulo;
        document.getElementById('vimar-modal-confirmar-msg').textContent = mensaje;
        document.getElementById('vimar-modal-confirmar-si').textContent = okText;
        document.getElementById('vimar-modal-confirmar-no').textContent = cancelText;

        const caja = root.querySelector('.vimar-modal-confirmar-caja');
        caja.classList.toggle('vimar-modal-peligroso', peligroso);

        root.setAttribute('aria-hidden', 'false');
        root.classList.add('vimar-modal-confirmar--visible');
        vimarActualizarCapaModalBody();
        if (typeof playSound === 'function') playSound('click');
        requestAnimationFrame(() => {
            const si = document.getElementById('vimar-modal-confirmar-si');
            if (si) si.focus();
        });
    });
}

function cerrarModalAlertaVimar() {
    if (_vimarModalAlertaResolver === null) return;
    const resolve = _vimarModalAlertaResolver;
    _vimarModalAlertaResolver = null;
    const root = document.getElementById('vimar-modal-alerta');
    if (root) {
        root.classList.remove('vimar-modal-alerta--visible');
        root.setAttribute('aria-hidden', 'true');
    }
    const caja = document.getElementById('vimar-modal-alerta-caja');
    if (caja) {
        caja.classList.remove('vimar-modal-alerta--tipo-error', 'vimar-modal-alerta--tipo-success', 'vimar-modal-alerta--tipo-info');
    }
    vimarActualizarCapaModalBody();
    resolve();
}

function inicializarModalAlertaVimar() {
    const root = document.getElementById('vimar-modal-alerta');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';
    root.querySelector('.vimar-modal-alerta-backdrop').addEventListener('click', cerrarModalAlertaVimar);
    document.getElementById('vimar-modal-alerta-ok').addEventListener('click', cerrarModalAlertaVimar);
    inicializarModalesVimarTeclado();
}

function mostrarModalAlerta(mensaje, opciones) {
    opciones = opciones || {};
    return new Promise((resolve) => {
        const root = document.getElementById('vimar-modal-alerta');
        if (!root) {
            resolve();
            return;
        }
        inicializarModalAlertaVimar();
        if (_vimarModalAlertaResolver !== null) cerrarModalAlertaVimar();
        if (_vimarModalConfirmarResolver !== null) cerrarModalConfirmarVimar(false);
        if (_vimarModalPromptResolver !== null) cerrarModalPromptVimar(null);
        _vimarModalAlertaResolver = resolve;

        const titulo = opciones.titulo != null ? opciones.titulo : 'Aviso';
        const tipo = opciones.tipo || 'info';
        const btnOk = opciones.btnOk || 'Aceptar';

        document.getElementById('vimar-modal-alerta-titulo').textContent = titulo;
        document.getElementById('vimar-modal-alerta-msg').textContent = mensaje;
        document.getElementById('vimar-modal-alerta-ok').textContent = btnOk;

        const caja = document.getElementById('vimar-modal-alerta-caja');
        caja.classList.remove('vimar-modal-alerta--tipo-error', 'vimar-modal-alerta--tipo-success', 'vimar-modal-alerta--tipo-info');
        if (tipo === 'error') caja.classList.add('vimar-modal-alerta--tipo-error');
        else if (tipo === 'success') caja.classList.add('vimar-modal-alerta--tipo-success');
        else caja.classList.add('vimar-modal-alerta--tipo-info');

        root.setAttribute('aria-hidden', 'false');
        root.classList.add('vimar-modal-alerta--visible');
        vimarActualizarCapaModalBody();
        if (typeof playSound === 'function') playSound('click');
        requestAnimationFrame(() => document.getElementById('vimar-modal-alerta-ok').focus());
    });
}

function cerrarModalPromptVimar(resultado) {
    if (_vimarModalPromptResolver === null) return;
    const resolve = _vimarModalPromptResolver;
    _vimarModalPromptResolver = null;
    const root = document.getElementById('vimar-modal-prompt');
    const input = document.getElementById('vimar-modal-prompt-input');
    if (root) {
        root.classList.remove('vimar-modal-prompt--visible');
        root.setAttribute('aria-hidden', 'true');
    }
    if (input) input.value = '';
    vimarActualizarCapaModalBody();
    resolve(resultado);
}

function inicializarModalPromptVimar() {
    const root = document.getElementById('vimar-modal-prompt');
    if (!root || root.dataset.bound === '1') return;
    root.dataset.bound = '1';
    root.querySelector('.vimar-modal-prompt-backdrop').addEventListener('click', () => cerrarModalPromptVimar(null));
    document.getElementById('vimar-modal-prompt-cancel').addEventListener('click', () => cerrarModalPromptVimar(null));
    document.getElementById('vimar-modal-prompt-ok').addEventListener('click', () => {
        const v = document.getElementById('vimar-modal-prompt-input').value;
        cerrarModalPromptVimar(v);
    });
    document.getElementById('vimar-modal-prompt-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            cerrarModalPromptVimar(e.target.value);
        }
    });
    inicializarModalesVimarTeclado();
}

function mostrarModalPrompt(mensaje, valorDefecto, opciones) {
    opciones = opciones || {};
    const defecto = valorDefecto == null ? '' : String(valorDefecto);
    return new Promise((resolve) => {
        const root = document.getElementById('vimar-modal-prompt');
        if (!root) {
            resolve(null);
            return;
        }
        inicializarModalPromptVimar();
        if (_vimarModalPromptResolver !== null) cerrarModalPromptVimar(null);
        if (_vimarModalConfirmarResolver !== null) cerrarModalConfirmarVimar(false);
        if (_vimarModalAlertaResolver !== null) cerrarModalAlertaVimar();
        _vimarModalPromptResolver = resolve;

        document.getElementById('vimar-modal-prompt-titulo').textContent = opciones.titulo != null ? opciones.titulo : 'Entrada';
        document.getElementById('vimar-modal-prompt-msg').textContent = mensaje;
        const input = document.getElementById('vimar-modal-prompt-input');
        input.type = opciones.inputType === 'number' ? 'number' : 'text';
        input.placeholder = opciones.placeholder || '';
        input.value = defecto;
        input.step = opciones.step != null ? opciones.step : 'any';
        document.getElementById('vimar-modal-prompt-ok').textContent = opciones.btnOk || 'Aceptar';
        document.getElementById('vimar-modal-prompt-cancel').textContent = opciones.btnCancel || 'Cancelar';

        root.setAttribute('aria-hidden', 'false');
        root.classList.add('vimar-modal-prompt--visible');
        vimarActualizarCapaModalBody();
        if (typeof playSound === 'function') playSound('click');
        setTimeout(() => {
            input.focus();
            input.select();
        }, 80);
    });
}

function calcularTodo() {
    // 1. Subtotal de la venta que se está escribiendo en el momento
    let subtotalVivo = 0;
    document.querySelectorAll('.total-fila').forEach(i => {
        subtotalVivo += parseFloat(i.value) || 0;
    });
    document.getElementById('txtSubtotalVivo').innerText = `$${subtotalVivo.toFixed(2)}`;

    // 2. Registros pendientes (días sin archivar) y ventas en ticket del día
    let totalVentasPendientes = registrosPendientes.reduce((a, r) => a + r.Total, 0);
    let totalVentasTicket = ventasTicket.reduce((a, v) => a + v.Total, 0);

    // Gastos en la lista actual (aún no archivados en historial de gastos)
    let gastosActuales = gastosArray.reduce((a, b) => a + b.monto, 0);
    // Ingresos manuales en la lista actual (aún no archivados)
    let ingresosManualesActuales = ingresosManualesArray.reduce((a, b) => a + b.monto, 0);

    // 3. Cadena: Monto en caja → 1ª semana → 2ª … (cada una suma ventas y resta gastos con el mismo nombre);
    //    luego gastos archivados sin carpeta de ventas homónima; sobre eso se suman pendientes + ticket y se restan gastos actuales.
    //    Para ingresos manuales: la lógica es la misma pero sumando en vez de restar.
    recalcularTodosSaldosNetoSemanales();
    let saldoTrasArchivadas = obtenerSaldoNetoTrasSemanasArchivadas();
    let neto = saldoTrasArchivadas + totalVentasPendientes + totalVentasTicket - gastosActuales + ingresosManualesActuales;

    const tn = document.getElementById('txtSaldoFinal');
    tn.innerText = `$${neto.toFixed(2)}`;
        
    tn.classList.toggle('saldo-final--positivo', neto >= 0);
    tn.classList.toggle('saldo-final--negativo', neto < 0);
}

function getMontoCaja() {
    const el = document.getElementById('inputCajaReal');
    if (el && el.value !== '' && el.value !== null) {
        const v = parseFloat(el.value);
        if (!isNaN(v)) return v;
    }
    const stored = localStorage.getItem('vimarCajaMonto');
    if (stored !== null && stored !== '') {
        const v = parseFloat(stored);
        if (!isNaN(v)) return v;
    }
    return 0;
}

function sumaVentasSemanaHistorial(nombre) {
    if (!historialSemanas[nombre]) return 0;
    return historialSemanas[nombre].reduce((a, r) => a + r.Total, 0);
}

function sumaGastosPorNombreSemana(nombre) {
    const arr = historialGastosSemanales[nombre];
    if (!arr || !arr.length) return 0;
    return arr.reduce((a, g) => a + g.monto, 0);
}

function sumaIngresosManualesPorNombreSemana(nombre) {
    const arr = historialIngresosManualesSemanales[nombre];
    if (!arr || !arr.length) return 0;
    return arr.reduce((a, i) => a + i.monto, 0);
}

/** Gastos archivados cuyo nombre no coincide con ninguna carpeta de ventas (no entran en la cadena por semana). */
function sumaGastosHuerfanosHistorial() {
    let s = 0;
    Object.keys(historialGastosSemanales || {}).forEach(k => {
        if (!historialSemanas[k]) {
            s += historialGastosSemanales[k].reduce((a, g) => a + g.monto, 0);
        }
    });
    return s;
}

/** Ingresos manuales archivados cuyo nombre no coincide con ninguna carpeta de ventas (no entran en la cadena por semana). */
function sumaIngresosManualesHuerfanosHistorial() {
    let s = 0;
    Object.keys(historialIngresosManualesSemanales || {}).forEach(k => {
        if (!historialSemanas[k]) {
            s += historialIngresosManualesSemanales[k].reduce((a, i) => a + i.monto, 0);
        }
    });
    return s;
}

/** Saldo acumulado tras procesar todas las semanas en orden + restar gastos huérfanos. */
function obtenerSaldoNetoTrasSemanasArchivadas() {
    let saldo = getMontoCaja();
    Object.keys(historialSemanas).forEach(nom => {
        saldo += sumaVentasSemanaHistorial(nom) + sumaIngresosManualesPorNombreSemana(nom) - sumaGastosPorNombreSemana(nom);
    });
    saldo -= sumaGastosHuerfanosHistorial();
    saldo += sumaIngresosManualesHuerfanosHistorial();
    return saldo;
}

/** Saldo al cierre de una semana (cadena: caja → 1ª semana → 2ª …), sin gastos huérfanos. */
function recalcularTodosSaldosNetoSemanales() {
    saldoNetoPorSemana = {};
    let saldo = getMontoCaja();
    Object.keys(historialSemanas).forEach(nom => {
        saldo += sumaVentasSemanaHistorial(nom) + sumaIngresosManualesPorNombreSemana(nom) - sumaGastosPorNombreSemana(nom);
        saldoNetoPorSemana[nom] = saldo;
    });
    localStorage.setItem('vimarSaldoNetoPorSemana', JSON.stringify(saldoNetoPorSemana));
}

function saldoInicialParaSemana(nombreSemana) {
    const orden = Object.keys(historialSemanas);
    const idx = orden.indexOf(nombreSemana);
    if (idx <= 0) return getMontoCaja();
    const prev = orden[idx - 1];
    return saldoNetoPorSemana[prev] !== undefined ? saldoNetoPorSemana[prev] : getMontoCaja();
}

function cambiarAManual(input) {
    const fila = input.parentElement.parentElement;
    const it = fila.querySelector('.total-fila'), ip = fila.querySelector('.precio-unit'), ic = fila.querySelector('.litros');
    [it, ip, ic].forEach(el => el.classList.remove('input-error'));
    const cant = parseFloat(ic.value) || 0;
    it.classList.replace('total-auto', 'total-manual');
    if (input.classList.contains('total-fila')) { if (cant > 0 && input.value !== "") ip.value = (parseFloat(input.value) / cant).toFixed(2); } 
    else { if (cant > 0 && input.value !== "") it.value = (parseFloat(input.value) * cant).toFixed(2); }
    calcularTodo();
}

function actualizarStock(nombre, cantidad, operacion) {
    // operacion: 'descontar' o 'devolver'
    if (stockProductos[nombre] !== undefined) {
        if (operacion === 'descontar') stockProductos[nombre] -= cantidad;
        else if (operacion === 'devolver') stockProductos[nombre] += cantidad;
            
        localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
        renderizarCatalogo(); // Refrescar alertas visuales
    }
}

function actualizarDimensionesGraficas() {
    // Reemplaza 'miGraficaVentas' y 'miGraficaStock' por los nombres de tus variables de Chart.js
    if (window.topS) {
        window.topS.resize();
        window.topS.update();
    }
    if (window.topC) {
        window.topC.resize();
        window.topC.update();
    }
}

async function eliminarDiaTemporal(idx) {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        `¿Eliminar el día "${registrosPendientes[idx].Día}"?\n\nSe devolverá el stock de todos sus productos.`,
        { titulo: 'Eliminar día', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;
    playSound('delete');

    // Devolver stock
    registrosPendientes[idx].Detalles.forEach(p => actualizarStock(p.Producto, p.Cantidad, 'devolver'));

    registrosPendientes.splice(idx, 1);
    localStorage.setItem('registrosPendientes', JSON.stringify(registrosPendientes));

    calcularTodo();
    actualizarGraficas();
    renderizarTablasHistorial();
}

function _vimarMenor30(n) {
    const m = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE',
        'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE'];
    if (n < 21) return m[n] || '';
    const u = n % 10;
    const veintes = ['', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
    return veintes[u] || '';
}

function _vimarMenor100(n) {
    if (n < 30) return _vimarMenor30(n);
    const d = Math.floor(n / 10);
    const u = n % 10;
    const dec = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    if (u === 0) return dec[d];
    const un = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    return dec[d] + ' Y ' + un[u];
}

function _vimarMenor1000(n) {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    const c = Math.floor(n / 100);
    const resto = n % 100;
    const cent = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
    let s = cent[c];
    if (resto > 0) {
        if (c > 0) s += ' ';
        s += _vimarMenor100(resto);
    }
    return s;
}

function vimarNumeroEnteroALetras(n) {
    if (!Number.isFinite(n) || n < 0) return '—';
    n = Math.floor(n);
    if (n === 0) return 'CERO';
    if (n >= 1000000000) return 'CANTIDAD MUY GRANDE';

    let letras = '';
    if (n >= 1000000) {
        const mill = Math.floor(n / 1000000);
        n %= 1000000;
        if (mill === 1) letras = 'UN MILLÓN';
        else letras = _vimarMenor1000(mill).trim() + ' MILLONES';
        if (n === 0) return letras;
        letras += ' ';
    }
    if (n >= 1000) {
        const mil = Math.floor(n / 1000);
        n %= 1000;
        if (mil === 1) letras += 'MIL';
        else letras += _vimarMenor1000(mil).trim() + ' MIL';
        if (n > 0) letras += ' ';
    }
    if (n > 0) letras += _vimarMenor1000(n).trim();
    return letras.trim();
}

function vimarImporteALetrasMX(monto) {
    const entero = Math.floor(monto + 1e-9);
    const centavos = Math.min(99, Math.max(0, Math.round((monto - entero) * 100 + 1e-9)));
    return `${vimarNumeroEnteroALetras(entero)} PESOS ${String(centavos).padStart(2, '0')}/100 M.N.`;
}

async function generarTicketVentaTicket(idx) {
    playSound('click');
    const venta = ventasTicket[idx];
    if (!venta || !venta.Detalles || venta.Detalles.length === 0) {
        await mostrarModalAlerta('Esta venta no tiene productos para el ticket.', { titulo: 'Ticket', tipo: 'error' });
        return;
    }

    const total = Number(venta.Total);
    const sPago = await mostrarModalPrompt(
        'Cantidad que entrega el cliente ($):',
        total.toFixed(2),
        { titulo: 'Pago del cliente', inputType: 'number', btnOk: 'Generar ticket', btnCancel: 'Cancelar' }
    );
    if (sPago == null) return;

    const pago = parseFloat(String(sPago).replace(/,/g, '').trim());
    if (isNaN(pago) || pago < 0) {
        await mostrarModalAlerta('Introduce un monto válido.', { titulo: 'Ticket', tipo: 'error' });
        return;
    }

    const cambio = Math.max(0, pago - total);
    const fecha = new Date();
    const fechaStr = fecha.toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' });
    let logoUrl = 'LVIMAR.png';
    try {
        logoUrl = new URL('LVIMAR.png', window.location.href).href;
    } catch (e) { /* file local */ }

    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const filas = venta.Detalles.map(p => {
        const pu = p.Cantidad ? p.Subtotal / p.Cantidad : 0;
        return `<tr><td class="c">${esc(p.Cantidad)}</td><td>${esc(p.Producto)}</td><td class="r">$${pu.toFixed(2)}</td><td class="r">$${p.Subtotal.toFixed(2)}</td></tr>`;
    }).join('');

    const totalLetras = vimarImporteALetrasMX(total);

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=320, initial-scale=1">
<title>Ticket VIMAR</title>
<style>
  /* Ticket térmico estándar 80 mm (área útil ~72 mm) */
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  @page {
    size: 80mm auto;
    margin: 2mm;
  }
  html {
    width: 100%;
  }
  body {
    margin: 0 auto;
    padding: 3mm 2.5mm;
    width: 72mm;
    max-width: 72mm;
    min-height: 0;
    font-family: 'Courier New', Courier, 'Lucida Console', monospace;
    font-size: 9.5pt;
    font-weight: 600;
    line-height: 1.28;
    color: #000;
    background: #fff;
    -webkit-font-smoothing: antialiased;
  }
  .logo {
    text-align: center;
    margin: 0 0 1.5mm 0;
  }
  .logo img {
    display: block;
    margin: 0 auto;
    max-width: 30mm;
    width: auto;
    height: auto;
    object-fit: contain;
  }
  .biz {
    text-align: center;
    line-height: 1.32;
    margin-bottom: 2.5mm;
    font-size: 8.5pt;
    font-weight: 700;
  }
  .biz strong {
    font-size: 11pt;
    font-weight: 800;
    display: block;
    margin-top: 0.8mm;
    letter-spacing: 0.08em;
  }
  .fh {
    text-align: center;
    font-size: 8.5pt;
    font-weight: 700;
    margin: 2mm 0;
    padding: 2mm 1mm;
    border-top: 1px dashed #000;
    border-bottom: 1px dashed #000;
    word-break: break-word;
  }
  table.p {
    width: 100%;
    table-layout: fixed;
    border-collapse: collapse;
    font-size: 8.5pt;
    font-weight: 600;
  }
  table.p th {
    text-align: left;
    border-bottom: 2px solid #000;
    padding: 1.4mm 0.5mm;
    font-weight: 800;
    vertical-align: bottom;
  }
  table.p th.r, table.p td.r {
    text-align: right;
  }
  table.p th.c, table.p td.c {
    text-align: center;
    width: 9mm;
    padding-left: 0;
    padding-right: 0.5mm;
  }
  table.p th:nth-child(2), table.p td:nth-child(2) {
    width: auto;
    padding-left: 1mm;
    padding-right: 1mm;
    word-wrap: break-word;
    overflow-wrap: break-word;
    hyphens: auto;
  }
  table.p th:nth-child(3), table.p td:nth-child(3) {
    width: 16mm;
  }
  table.p th:nth-child(4), table.p td:nth-child(4) {
    width: 18mm;
  }
  table.p td {
    padding: 1.1mm 0.5mm;
    vertical-align: top;
    border-bottom: 1px dotted #888;
    font-weight: 600;
  }
  table.p tbody tr:last-child td {
    border-bottom: none;
  }
  .imp {
    margin-top: 2.5mm;
    font-weight: 800;
    font-size: 10pt;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 2mm;
  }
  .imp span:last-child {
    white-space: nowrap;
  }
  .tot {
    text-align: center;
    font-weight: 800;
    margin: 2.5mm 0 1.5mm;
    letter-spacing: 0.04em;
    font-size: 8.5pt;
  }
  .pay {
    display: flex;
    justify-content: space-between;
    margin: 1.2mm 0;
    font-size: 9.5pt;
    font-weight: 700;
    gap: 2mm;
  }
  .pay span:last-child {
    white-space: nowrap;
    font-weight: 800;
  }
  .letras {
    margin-top: 2.5mm;
    font-size: 7.5pt;
    font-weight: 700;
    text-align: justify;
    text-align-last: center;
    line-height: 1.4;
    border-top: 1px dashed #000;
    padding-top: 2mm;
    text-transform: uppercase;
    word-break: break-word;
    hyphens: manual;
  }
  /* Vista previa en pantalla: ancho similar al rollo */
  @media screen {
    body {
      box-shadow: 0 0 12px rgba(0,0,0,0.12);
      min-height: 40vh;
    }
  }
  @media print {
    @page {
      size: 80mm auto;
      margin: 0;
    }
    body {
      padding: 1.5mm 2mm;
      width: 72mm;
      max-width: 72mm;
      box-shadow: none;
    }
    table.p td {
      border-bottom-color: #bbb;
    }
  }
</style>
</head>
<body>
<div class="logo"><img src="${logoUrl}" alt="VIMAR"></div>
<div class="biz">
  <div>Productos de Limpieza</div>
  <strong>VIMAR</strong>
  <div>Marquesina #4172</div>
  <div>Entre AV. Baluarte y Campanario</div>
  <div>Fraccionamiento Residencial El Campanario</div>
  <div>Veracruz, Ver.</div>
  <div>CP: 91808</div>
  <div>Cel 1: 2293191788</div>
  <div>Cel 2: 2291725617</div>
  <div>Correo: limpiezavimar@gmail.com</div>
</div>
<div class="fh">${esc(fechaStr)}</div>
<table class="p">
<thead><tr><th class="c">Cant</th><th>Descripción</th><th class="r">P.U.</th><th class="r">Subtotal</th></tr></thead>
<tbody>${filas}</tbody>
</table>
<div class="imp"><span>Importe (Total):</span><span>$${total.toFixed(2)}</span></div>
<div class="tot">----- TOTAL A PAGAR -----</div>
<div class="pay"><span>Pago:</span><span>$${pago.toFixed(2)}</span></div>
<div class="pay"><span>Cambio:</span><span>$${cambio.toFixed(2)}</span></div>
<div class="letras">${esc(totalLetras)}</div>
</body>
</html>`;

    const w = window.open('', '_blank', 'width=340,height=780,scrollbars=yes');
    if (!w) {
        await mostrarModalAlerta('Permite ventanas emergentes del navegador para imprimir el ticket.', { titulo: 'Ticket', tipo: 'error' });
        return;
    }
    w.document.write(html);
    w.document.close();
    const imprimir = () => {
        try {
            w.focus();
            w.print();
        } catch (e) { /* ignorar */ }
    };
    if (w.document.readyState === 'complete') setTimeout(imprimir, 300);
    else w.onload = () => setTimeout(imprimir, 300);
    playSound('success');
}

async function eliminarVentaTicket(idx) {
    const ok = await mostrarModalConfirmar(
        '¿Eliminar esta venta?\n\nSe devolverá el stock de los productos.',
        { titulo: 'Eliminar venta', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;
    playSound('delete');

    // Devolver stock
    ventasTicket[idx].Detalles.forEach(p => actualizarStock(p.Producto, p.Cantidad, 'devolver'));

    ventasTicket.splice(idx, 1);
    localStorage.setItem('ventasTicket', JSON.stringify(ventasTicket));

    calcularTodo();
    actualizarGraficas();
    renderizarListaVentasTicket();
}

async function editarDatoProductoVentaTicket(idxVenta, idxProd) {
    playSound('click');
    const venta = ventasTicket[idxVenta];
    if (!venta || !venta.Detalles[idxProd]) return;

    const prod = venta.Detalles[idxProd];
    const cantAnterior = prod.Cantidad;

    const sCant = await mostrarModalPrompt(`Nueva cantidad para ${prod.Producto}:`, prod.Cantidad, {
        titulo: 'Editar cantidad',
        inputType: 'number'
    });
    if (sCant == null) return;
    const sSub = await mostrarModalPrompt(`Nuevo subtotal para ${prod.Producto}:`, prod.Subtotal, {
        titulo: 'Editar subtotal',
        inputType: 'number'
    });
    if (sSub == null) return;
    const nuevaCant = parseFloat(sCant);
    const nuevoSub = parseFloat(sSub);

    if (!isNaN(nuevaCant) && !isNaN(nuevoSub)) {
        actualizarStock(prod.Producto, cantAnterior, 'devolver');
        actualizarStock(prod.Producto, nuevaCant, 'descontar');

        prod.Cantidad = nuevaCant;
        prod.Subtotal = nuevoSub;

        venta.Total = venta.Detalles.reduce((a, b) => a + b.Subtotal, 0);
        localStorage.setItem('ventasTicket', JSON.stringify(ventasTicket));

        playSound('success');
        calcularTodo();
        actualizarGraficas();
        renderizarListaVentasTicket();
    }
}

async function eliminarProductoVentaTicket(idxVenta, idxProd) {
    playSound('click');
    const venta = ventasTicket[idxVenta];
    if (!venta || !venta.Detalles[idxProd]) return;

    const prod = venta.Detalles[idxProd];
    const ok = await mostrarModalConfirmar(
        `¿Eliminar ${prod.Producto} de esta venta?\n\nSe devolverá el stock y se actualizarán los totales.`,
        { titulo: 'Quitar producto', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;

    playSound('delete');
    actualizarStock(prod.Producto, prod.Cantidad, 'devolver');
    venta.Detalles.splice(idxProd, 1);

    if (venta.Detalles.length === 0) {
        ventasTicket.splice(idxVenta, 1);
    } else {
        venta.Total = venta.Detalles.reduce((a, b) => a + b.Subtotal, 0);
    }

    localStorage.setItem('ventasTicket', JSON.stringify(ventasTicket));
    calcularTodo();
    actualizarGraficas();
    renderizarListaVentasTicket();
}

async function guardarVentaTicket() {
    const filas = document.querySelectorAll('#cuerpoVenta tr');

    if (filas.length === 0) {
        playSound('error');
        await mostrarModalAlerta('El ticket está vacío. Agrega productos antes de guardar.', { titulo: 'Ticket vacío', tipo: 'error' });
        return;
    }

    let errores = 0;
    let totalVenta = 0;
    let productosVenta = [];
    let productosFaltantes = [];

    filas.forEach(f => {
        const inputCant  = f.querySelector('.litros');
        const inputPU    = f.querySelector('.precio-unit');
        const inputTotal = f.querySelector('.total-fila');
        const nombreProd = f.querySelector('.td-producto').innerText;

        const cant     = parseFloat(inputCant.value);
        const pu       = parseFloat(inputPU.value);
        const subtotal = parseFloat(inputTotal.value);

        [inputCant, inputPU, inputTotal].forEach(el => el.classList.remove('input-error'));

        let filaConError = false;
        if (isNaN(cant)     || cant     <= 0) { inputCant.classList.add('input-error');  filaConError = true; }
        if (isNaN(pu)       || pu       <= 0) { inputPU.classList.add('input-error');    filaConError = true; }
        if (isNaN(subtotal) || subtotal <= 0) { inputTotal.classList.add('input-error'); filaConError = true; }

        if (filaConError) { errores++; }
        else {
            totalVenta += subtotal;
            productosVenta.push({ Producto: nombreProd, Cantidad: cant, Subtotal: subtotal });
        }
    });

    if (errores > 0) {
        playSound('error');
        await mostrarModalAlerta('Hay casillas vacías o con valor 0 (marcadas en rojo).', { titulo: 'Revisar ticket', tipo: 'error' });
        return;
    }

    // Validar stock
    productosVenta.forEach(p => {
        const stockDisponible = stockProductos[p.Producto] || 0;
        if (p.Cantidad > stockDisponible) {
            productosFaltantes.push(`• ${p.Producto}: pides ${p.Cantidad}, tienes ${stockDisponible}`);
        }
    });

    if (productosFaltantes.length > 0) {
        playSound('error');
        const msg = "⚠️ ALERTA DE STOCK INSUFICIENTE:\n\n" + productosFaltantes.join("\n") + "\n\n¿Deseas proceder de todos modos?";
        const ok = await mostrarModalConfirmar(msg, {
            titulo: 'Stock insuficiente',
            peligroso: true,
            btnOk: 'Proceder igual',
            btnCancel: 'Cancelar'
        });
        if (!ok) return;
    }

    // Descontar stock
    productosVenta.forEach(p => actualizarStock(p.Producto, p.Cantidad, 'descontar'));

    // Guardar en ventasTicket
    const horaActual = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    ventasTicket.push({
        id: Date.now(),
        hora: horaActual,
        Total: totalVenta,
        Detalles: productosVenta
    });
    localStorage.setItem('ventasTicket', JSON.stringify(ventasTicket));

    // Limpiar ticket
    document.getElementById('cuerpoVenta').innerHTML = "";
    calcularTodo();
    actualizarGraficas();
    renderizarListaVentasTicket();
    playSound('success');
}

async function terminarDia() {
    if (ventasTicket.length === 0) {
        playSound('error');
        await mostrarModalAlerta('No hay ventas guardadas. Guarda al menos una venta antes de cerrar el día.', { titulo: 'Sin ventas', tipo: 'error' });
        return;
    }

    const rawNombre = await mostrarModalPrompt('Nombre del día (ej: Lunes tarde):', '', { titulo: 'Cerrar día' });
    if (rawNombre == null || !String(rawNombre).trim()) return;
    const nombreRegistro = String(rawNombre).trim();

    // Cada venta guardada (ticket) conserva sus líneas tal cual: no fusionar por producto
    const totalDia = ventasTicket.reduce((a, v) => a + v.Total, 0);
    const detallesDelDia = [];
    ventasTicket.forEach(v => {
        v.Detalles.forEach(p => detallesDelDia.push({ ...p }));
    });

    registrosPendientes.push({
        Día: nombreRegistro,
        Total: totalDia,
        Detalles: detallesDelDia,
        esTemporal: true
    });

    localStorage.setItem('registrosPendientes', JSON.stringify(registrosPendientes));

    // Limpiar ventasTicket
    ventasTicket = [];
    localStorage.setItem('ventasTicket', JSON.stringify(ventasTicket));

    calcularTodo();
    actualizarGraficas();
    renderizarListaVentasTicket();

    // Refrescar historial si está visible para mostrar el día temporal
    if (document.getElementById('seccionHistorial')?.classList.contains('vimar-seccion-activa')) {
        renderizarTablasHistorial();
    }

    playSound('success');
    await mostrarModalAlerta(`Día "${nombreRegistro}" guardado. Visible en el Historial de Ventas.`, { titulo: 'Día guardado', tipo: 'success' });
}

async function guardarSemana() {
    if (registrosPendientes.length === 0) {
        playSound('error');
        await mostrarModalAlerta('No hay registros pendientes para guardar una semana.', { titulo: 'Sin datos', tipo: 'error' });
        return;
    }

    const rawSem = await mostrarModalPrompt('Nombre para esta Semana/Carpeta (ej: Semana 10 Marzo):', '', { titulo: 'Guardar semana' });
    if (rawSem == null || !String(rawSem).trim()) return;
    const nombreSemana = String(rawSem).trim();

    // Guardamos la carpeta en el historial (sin el flag esTemporal)
    historialSemanas[nombreSemana] = registrosPendientes.map(r => {
        const { esTemporal, ...reg } = r;
        return reg;
    });
    localStorage.setItem('historialSemanas', JSON.stringify(historialSemanas));

    // Limpiamos los pendientes
    registrosPendientes = [];
    localStorage.setItem('registrosPendientes', JSON.stringify(registrosPendientes));

    recalcularTodosSaldosNetoSemanales();

    playSound('success');
    await mostrarModalAlerta(`Semana "${nombreSemana}" guardada con éxito en el historial.`, { titulo: 'Semana guardada', tipo: 'success' });
    if (document.getElementById('seccionHistorial')?.classList.contains('vimar-seccion-activa')) {
        renderizarTablasHistorial();
    }

    actualizarGraficas();
}

function guardarTodo() {
    localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
    localStorage.setItem('vimarHistorialEntradas', JSON.stringify(historialEntradas));
}

function guardarYRefrescarTodo() {
    localStorage.setItem('historialSemanas', JSON.stringify(historialSemanas));
    localStorage.setItem('registrosPendientes', JSON.stringify(registrosPendientes));
    localStorage.setItem('vimarStock', JSON.stringify(stockProductos)); // Aseguramos persistencia de stock
        
    renderizarTablasHistorial();
    recalcularTodosSaldosNetoSemanales();
    calcularTodo();
    actualizarGraficas();
        
    // Si el usuario está viendo la sección de stocks, la refrescamos visualmente
    if (document.getElementById('seccionStocks')?.classList.contains('vimar-seccion-activa')) {
        renderizarSeccionStocks();
    }
    
    // También refrescamos el catálogo por si hubo cambios en las alertas "Bajo en Stock"
    renderizarCatalogo(); 
}

async function eliminarFilaHistorial(index) {
    const ok = await mostrarModalConfirmar('¿Eliminar producto?', { titulo: 'Eliminar', peligroso: true, btnOk: 'Eliminar' });
    if (!ok) return;
    detalleVentas.splice(index, 1);
    recalcularResumenDias();
    renderizarTablasHistorial();
    calcularTodo();
}

async function eliminarDiaHistorial(index) {
    const ok = await mostrarModalConfirmar('¿Eliminar registro?', { titulo: 'Eliminar', peligroso: true, btnOk: 'Eliminar' });
    if (!ok) return;
    const d = resumenDias[index].Día;
    resumenDias.splice(index, 1);
    detalleVentas = detalleVentas.filter(v => v.Registro !== d);
    recalcularResumenDias();
    renderizarTablasHistorial();
    calcularTodo();
}

function recalcularResumenDias() {
    resumenDias.forEach(dia => { dia["Total ($)"] = detalleVentas.filter(v => v.Registro === dia.Día).reduce((acc, v) => acc + v.Subtotal, 0);});
    localStorage.setItem('resumenDias', JSON.stringify(resumenDias));
    localStorage.setItem('detalleVentas', JSON.stringify(detalleVentas));
}


async function editarNombreSemana(nombreAntiguo) {
    playSound('click');
    const raw = await mostrarModalPrompt('Nuevo nombre para la Semana/Carpeta:', nombreAntiguo, { titulo: 'Renombrar semana' });
    if (raw == null) return;
    const nuevoNombre = String(raw).trim();
    if (nuevoNombre && nuevoNombre !== nombreAntiguo) {
        if (historialSemanas[nuevoNombre]) {
            await mostrarModalAlerta('Ya existe una semana con ese nombre.', { titulo: 'Nombre duplicado', tipo: 'error' });
            return;
        }

        // Crear un nuevo objeto para mantener el orden de las llaves si es necesario
        // Pero en JS las llaves no tienen un orden garantizado, así que simplemente renombramos
        historialSemanas[nuevoNombre] = historialSemanas[nombreAntiguo];
        delete historialSemanas[nombreAntiguo];
        playSound('success');
        guardarYRefrescarTodo();
    }
}

async function editarNombreRegistro(nomSem, idxReg) {
    playSound('click');
    const raw = await mostrarModalPrompt('Nuevo nombre para el registro:', historialSemanas[nomSem][idxReg].Día, { titulo: 'Renombrar día' });
    if (raw == null) return;
    const nuevoNombre = String(raw).trim();
    if (nuevoNombre) {
        historialSemanas[nomSem][idxReg].Día = nuevoNombre;
        playSound('success');
        guardarYRefrescarTodo();
    }
}

async function editarNombreRegistroPendiente(idxReg) {
    playSound('click');
    if (!registrosPendientes[idxReg]) return;
    const raw = await mostrarModalPrompt('Nuevo nombre para el día:', registrosPendientes[idxReg].Día, { titulo: 'Renombrar día' });
    if (raw == null) return;
    const nuevoNombre = String(raw).trim();
    if (nuevoNombre) {
        registrosPendientes[idxReg].Día = nuevoNombre;
        playSound('success');
        guardarYRefrescarTodo();
    }
}

async function editarDatoProductoPendiente(idxReg, idxProd) {
    playSound('click');
    const reg = registrosPendientes[idxReg];
    if (!reg || !reg.Detalles[idxProd]) return;

    const prod = reg.Detalles[idxProd];
    const cantAnterior = prod.Cantidad;

    const sCant = await mostrarModalPrompt(`Nueva cantidad para ${prod.Producto}:`, prod.Cantidad, { titulo: 'Editar cantidad', inputType: 'number' });
    if (sCant == null) return;
    const sSub = await mostrarModalPrompt(`Nuevo subtotal para ${prod.Producto}:`, prod.Subtotal, { titulo: 'Editar subtotal', inputType: 'number' });
    if (sSub == null) return;
    const nuevaCant = parseFloat(sCant);
    const nuevoSub = parseFloat(sSub);

    if (!isNaN(nuevaCant) && !isNaN(nuevoSub)) {
        actualizarStock(prod.Producto, cantAnterior, 'devolver');
        actualizarStock(prod.Producto, nuevaCant, 'descontar');

        prod.Cantidad = nuevaCant;
        prod.Subtotal = nuevoSub;

        reg.Total = reg.Detalles.reduce((a, b) => a + b.Subtotal, 0);
        playSound('success');
        guardarYRefrescarTodo();
    }
}

async function eliminarProductoPendiente(idxReg, idxProd) {
    const reg = registrosPendientes[idxReg];
    if (!reg || !reg.Detalles[idxProd]) return;

    const productoAEliminar = reg.Detalles[idxProd];
    const ok = await mostrarModalConfirmar(
        `¿Eliminar ${productoAEliminar.Producto} de este día?\n\nSe devolverá el stock y se actualizarán los totales.`,
        { titulo: 'Quitar producto', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;

    playSound('delete');
    actualizarStock(productoAEliminar.Producto, productoAEliminar.Cantidad, 'devolver');
    reg.Detalles.splice(idxProd, 1);

    if (reg.Detalles.length === 0) {
        registrosPendientes.splice(idxReg, 1);
    } else {
        reg.Total = reg.Detalles.reduce((a, b) => a + b.Subtotal, 0);
    }

    guardarYRefrescarTodo();
}

async function editarDatoProducto(nomSem, idxReg, idxProd) {
    playSound('click');
    const prod = historialSemanas[nomSem][idxReg].Detalles[idxProd];
    const cantAnterior = prod.Cantidad;

    const sCant = await mostrarModalPrompt(`Nueva cantidad para ${prod.Producto}:`, prod.Cantidad, { titulo: 'Editar cantidad', inputType: 'number' });
    if (sCant == null) return;
    const sSub = await mostrarModalPrompt(`Nuevo subtotal para ${prod.Producto}:`, prod.Subtotal, { titulo: 'Editar subtotal', inputType: 'number' });
    if (sSub == null) return;
    const nuevaCant = parseFloat(sCant);
    const nuevoSub = parseFloat(sSub);

    if (!isNaN(nuevaCant) && !isNaN(nuevoSub)) {
        // Ajuste de stock: Devolvemos lo anterior y descontamos lo nuevo
        actualizarStock(prod.Producto, cantAnterior, 'devolver');
        actualizarStock(prod.Producto, nuevaCant, 'descontar');

        prod.Cantidad = nuevaCant;
        prod.Subtotal = nuevoSub;
            
        const nuevoTotalDia = historialSemanas[nomSem][idxReg].Detalles.reduce((a, b) => a + b.Subtotal, 0);
        historialSemanas[nomSem][idxReg].Total = nuevoTotalDia;
        
        playSound('success');
        guardarYRefrescarTodo();
    }
}

async function eliminarRegistroDia(nomSem, idxReg) {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        `¿Eliminar registro "${historialSemanas[nomSem][idxReg].Día}"?`,
        { titulo: 'Eliminar día', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;
    playSound('delete');
    historialSemanas[nomSem][idxReg].Detalles.forEach(prod => {
        actualizarStock(prod.Producto, prod.Cantidad, 'devolver');
    });

    historialSemanas[nomSem].splice(idxReg, 1);
    if (historialSemanas[nomSem].length === 0) delete historialSemanas[nomSem];
    guardarYRefrescarTodo();
}

async function eliminarSemanaCompleta(nomSem) {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        `¿Eliminar TODA la semana "${nomSem}"?\n\nSe devolverá el stock de todos los días.`,
        { titulo: 'Eliminar semana', peligroso: true, btnOk: 'Eliminar todo' }
    );
    if (!ok) return;
    playSound('delete');
    historialSemanas[nomSem].forEach(reg => {
        reg.Detalles.forEach(prod => {
            actualizarStock(prod.Producto, prod.Cantidad, 'devolver');
        });
    });
    delete historialSemanas[nomSem];
    guardarYRefrescarTodo();
}

async function añadirStockManual(nombreProducto) {
    playSound('click');
    const s = await mostrarModalPrompt(`¿Cuánto stock deseas añadir a "${nombreProducto}"?`, '0', {
        titulo: 'Añadir stock',
        inputType: 'number'
    });
    if (s == null) return;
    const cantidadASumar = parseFloat(s);

    if (!isNaN(cantidadASumar) && cantidadASumar > 0) {
        stockProductos[nombreProducto] = (stockProductos[nombreProducto] || 0) + cantidadASumar;
            
        // Registrar en historial de entradas
        const nuevaEntrada = {
            id: Date.now(),
            fecha: new Date().toLocaleString(),
            producto: nombreProducto,
            cantidad: cantidadASumar
        };
        historialEntradas.unshift(nuevaEntrada);

        guardarTodo();
        renderizarSeccionStocks();
        playSound('success');
        await mostrarModalAlerta(`Se añadieron ${cantidadASumar} unidades/litros a ${nombreProducto}.`, { titulo: 'Stock actualizado', tipo: 'success' });
    }
}

async function editarStockDirecto(nombreProducto) {
    playSound('click');
    const valorActual = stockProductos[nombreProducto] || 0;
    const s = await mostrarModalPrompt(`Corregir stock de "${nombreProducto}": introduce el valor real actual.`, String(valorActual), {
        titulo: 'Corregir stock',
        inputType: 'number'
    });
    if (s == null) return;
    const nuevoValor = parseFloat(s);

    if (!isNaN(nuevoValor) && nuevoValor >= 0) {
        stockProductos[nombreProducto] = nuevoValor;
        guardarTodo();
        renderizarSeccionStocks();
        playSound('success');
    } else if (!isNaN(nuevoValor) && nuevoValor < 0) {
        await mostrarModalAlerta('El stock no puede ser negativo.', { titulo: 'Valor no válido', tipo: 'error' });
    }
}

async function eliminarEntradaStock(index) {
    playSound('click');
    const reg = historialEntradas[index];
    const ok = await mostrarModalConfirmar(
        `¿Eliminar este registro?\n\nSe descontarán ${reg.cantidad} de "${reg.producto}" del stock actual.`,
        { titulo: 'Eliminar entrada', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;
    playSound('delete');
    stockProductos[reg.producto] -= reg.cantidad;
    historialEntradas.splice(index, 1);

    localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
    localStorage.setItem('vimarHistorialEntradas', JSON.stringify(historialEntradas));
    renderizarTablaInventario();
}

async function editarEntradaStock(index) {
    playSound('click');
    const reg = historialEntradas[index];
    const s = await mostrarModalPrompt(`Editar cantidad para "${reg.producto}":`, String(reg.cantidad), {
        titulo: 'Editar entrada',
        inputType: 'number'
    });
    if (s == null) return;
    const nuevaCant = parseFloat(s);

    if (!isNaN(nuevaCant) && nuevaCant >= 0) {
        // Ajustar el stock real: restamos la vieja entrada y sumamos la nueva
        stockProductos[reg.producto] = (stockProductos[reg.producto] - reg.cantidad) + nuevaCant;
        reg.cantidad = nuevaCant;
        
        localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
        localStorage.setItem('vimarHistorialEntradas', JSON.stringify(historialEntradas));
        renderizarTablaInventario();
        playSound('success');
    }
}

function guardarCaja() {
    localStorage.setItem('vimarCajaMonto', document.getElementById('inputCajaReal').value);
}

async function limpiarTodoElHistorial() {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        '¿Borrar TODO el historial y datos del sistema?\n\nEsta acción no se puede deshacer.',
        { titulo: 'Reiniciar sistema', peligroso: true, btnOk: 'Borrar todo' }
    );
    if (!ok) return;
    localStorage.clear();
    location.reload();
}

async function generarExcelCompleto() {
    if (typeof playSound === 'function') playSound('excel');
    
    const semanas = Object.keys(historialSemanas);
    const semanasGastos = Object.keys(historialGastosSemanales || {});
    const semanasIngresos = Object.keys(historialIngresosManualesSemanales || {});

    recalcularTodosSaldosNetoSemanales();

    let totalVentasHistorial = 0;
    Object.values(historialSemanas).forEach(sem => {
        sem.forEach(reg => totalVentasHistorial += reg.Total);
    });
    let totalVentasPendientes = (typeof registrosPendientes !== 'undefined' ? registrosPendientes : []).reduce((a, r) => a + r.Total, 0);
    let totalVentasTicket = (typeof ventasTicket !== 'undefined' ? ventasTicket : []).reduce((a, v) => a + v.Total, 0);
    let gastPendientes = gastosArray.reduce((a, g) => a + g.monto, 0);
    let ingPendientes = ingresosManualesArray.reduce((a, i) => a + i.monto, 0);
    let gastHuerfanos = sumaGastosHuerfanosHistorial();
    let ingHuerfanos = sumaIngresosManualesHuerfanosHistorial();

    let saldoTrasArchivadas = obtenerSaldoNetoTrasSemanasArchivadas();
    let neto = saldoTrasArchivadas + totalVentasPendientes + totalVentasTicket - gastPendientes + ingPendientes;
    let caja = getMontoCaja();

    let gastosConNombreDeSemanaVentas = 0;
    let ingresosConNombreDeSemanaVentas = 0;
    Object.keys(historialSemanas).forEach(nom => {
        gastosConNombreDeSemanaVentas += sumaGastosPorNombreSemana(nom);
        ingresosConNombreDeSemanaVentas += sumaIngresosManualesPorNombreSemana(nom);
    });

    let reporteFinal = [
        ["--- BALANCE GENERAL DE CAJA ---"],
        ["Concepto", "Monto ($)"],
        ["Monto en caja", caja],
        ["Total ventas en historial (todas las semanas)", totalVentasHistorial],
        ["Gastos archivados con el mismo nombre que la carpeta de ventas", gastosConNombreDeSemanaVentas],
        ["Ingresos manuales archivados con el mismo nombre que la carpeta de ventas", ingresosConNombreDeSemanaVentas],
        ["Gastos archivados sin carpeta de ventas homónima", gastHuerfanos],
        ["Ingresos manuales archivados sin carpeta de ventas homónima", ingHuerfanos],
        ["Saldo tras semanas archivadas", saldoTrasArchivadas],
        ["Ventas pendientes", totalVentasPendientes],
        ["Ventas en ticket del día", totalVentasTicket],
        ["Gastos en lista actual", gastPendientes],
        ["Ingresos manuales en lista actual", ingPendientes],
        ["SALDO REAL FINAL (NETO)", neto],
        [],
        ["--- EVOLUCIÓN POR SEMANA (orden de registro) ---"],
        ["Semana", "Saldo inicial", "Ventas", "Gastos (mismo nombre)", "Ingresos manuales (mismo nombre)", "Saldo final acumulado"]
    ];

    Object.keys(historialSemanas).forEach(nom => {
        const ventas = sumaVentasSemanaHistorial(nom);
        const gastos = sumaGastosPorNombreSemana(nom);
        const ingresos = sumaIngresosManualesPorNombreSemana(nom);
        const saldoIni = saldoInicialParaSemana(nom);
        const saldoFin = saldoNetoPorSemana[nom];
        reporteFinal.push([nom, saldoIni, ventas, gastos, ingresos, saldoFin]);
    });
    reporteFinal.push(
        [],
        ["--- RESUMEN DE VENTAS POR SEMANA (AGRUPADO) ---"],
        ["Semana", "Producto", "Cant. Total", "Monto Total ($)"]
    );

    // Tabla: Resumen de Ventas por Semana
    semanas.forEach(s => {
        const statsSemana = {};
        historialSemanas[s].forEach(reg => {
            reg.Detalles.forEach(p => {
                if (!statsSemana[p.Producto]) statsSemana[p.Producto] = { c: 0, s: 0 };
                statsSemana[p.Producto].c += p.Cantidad;
                statsSemana[p.Producto].s += p.Subtotal;
            });
        });
        Object.entries(statsSemana).sort((a,b) => b[1].s - a[1].s).forEach(([prod, data]) => {
            reporteFinal.push([s, prod, data.c, data.s]);
        });
        reporteFinal.push([]); 
    });

    // --- RESUMEN DE VENTAS POR DÍAS ---
    reporteFinal.push(["--- RESUMEN DE VENTAS POR DÍAS ---"], ["Semana", "Nombre del Registro (Día)", "Total Vendido ($)"]);
    semanas.forEach(s => {
        historialSemanas[s].forEach(reg => {
            reporteFinal.push([s, reg.Día, reg.Total]);
        });
    });
    (typeof registrosPendientes !== 'undefined' ? registrosPendientes : []).forEach(reg => {
        reporteFinal.push(["PENDIENTE", reg.Día, reg.Total]);
    });
    reporteFinal.push([]);

    // --- NUEVO: DETALLE DE GASTOS (HISTORIAL + PENDIENTES) ---
    reporteFinal.push(["--- DETALLE DE GASTOS REGISTRADOS (POR SEMANA) ---"], ["Semana / Registro", "Motivo / Concepto", "Monto ($)"]);
    
    semanasGastos.forEach(s => {
        historialGastosSemanales[s].forEach(g => {
            reporteFinal.push([s, g.nombre, g.monto]);
        });
    });

    reporteFinal.push([], ["--- GASTOS ACTUALES (PENDIENTES DE GUARDAR) ---"], ["Estado", "Motivo / Concepto", "Monto ($)"]);
    gastosArray.forEach(g => reporteFinal.push(["PENDIENTE", g.nombre, g.monto]));
    reporteFinal.push([]);

    // --- NUEVO: DETALLE DE INGRESOS MANUALES (HISTORIAL + PENDIENTES) ---
    reporteFinal.push(["--- DETALLE DE INGRESOS MANUALES REGISTRADOS (POR SEMANA) ---"], ["Semana / Registro", "Motivo / Concepto", "Monto ($)"]);
    semanasIngresos.forEach(s => {
        (historialIngresosManualesSemanales[s] || []).forEach(i => {
            reporteFinal.push([s, i.nombre, i.monto]);
        });
    });
    reporteFinal.push([]);

    reporteFinal.push([], ["--- INGRESOS MANUALES ACTUALES (PENDIENTES DE GUARDAR) ---"], ["Estado", "Motivo / Concepto", "Monto ($)"]);
    ingresosManualesArray.forEach(i => reporteFinal.push(["PENDIENTE", i.nombre, i.monto]));
    reporteFinal.push([]);

    // Historial Detallado (Operación por operación)
    reporteFinal.push(["--- HISTORIAL DETALLADO DE VENTAS ---"], ["Semana", "Registro", "Producto", "Cantidad", "Subtotal ($)"]);
    semanas.forEach(s => {
        historialSemanas[s].forEach(reg => {
            reg.Detalles.forEach(p => {
                reporteFinal.push([s, reg.Día, p.Producto, p.Cantidad, p.Subtotal]);
            });
        });
    });

    // 3. Generación del Archivo
    try {
        const lib = XLSX.utils.book_new();
        const hoja = XLSX.utils.aoa_to_sheet(reporteFinal);
            
        hoja['!cols'] = [{wch:25}, {wch:35}, {wch:15}, {wch:15}, {wch:15}, {wch:15}];

        XLSX.utils.book_append_sheet(lib, hoja, "REPORTE VIMAR COMPLETO");
        XLSX.writeFile(lib, `Reporte_VIMAR_${new Date().toLocaleDateString().replace(/\//g,'-')}.xlsx`);
    } catch (error) {
        console.error("Error al generar Excel:", error);
        await mostrarModalAlerta('Hubo un error al generar el archivo.', { titulo: 'Excel', tipo: 'error' });
    }
}

async function generarExcelSemana(nombreSemana) {
    if (!historialSemanas[nombreSemana]) {
        if (typeof playSound === 'function') playSound('error');
        await mostrarModalAlerta('No hay datos de ventas para esta semana.', { titulo: 'Excel', tipo: 'error' });
        return;
    }
    if (typeof playSound === 'function') playSound('excel');

    recalcularTodosSaldosNetoSemanales();

    const s = nombreSemana;
    const totalVentasSem = sumaVentasSemanaHistorial(s);
    const totalGastosSem = sumaGastosPorNombreSemana(s);
    const totalIngresosSem = sumaIngresosManualesPorNombreSemana(s);
    const saldoIniSem = saldoInicialParaSemana(s);
    const netoSem = saldoNetoPorSemana[s] !== undefined ? saldoNetoPorSemana[s] : (saldoIniSem + totalVentasSem + totalIngresosSem - totalGastosSem);

    let reporteFinal = [
        ["--- BALANCE DE ESTA SEMANA ---"],
        ["Semana / carpeta", s],
        ["Concepto", "Monto ($)"],
        ["Saldo al inicio", saldoIniSem],
        ["Ventas", totalVentasSem],
        ["Gastos archivados con el mismo nombre", totalGastosSem],
        ["Ingresos manuales archivados con el mismo nombre", totalIngresosSem],
        ["Saldo neto acumulado al cierre de esta semana", netoSem],
        [],
        ["--- RESUMEN DE VENTAS POR SEMANA (AGRUPADO) ---"],
        ["Semana", "Producto", "Cant. Total", "Monto Total ($)"]
    ];

    const statsSemana = {};
    historialSemanas[s].forEach(reg => {
        reg.Detalles.forEach(p => {
            if (!statsSemana[p.Producto]) statsSemana[p.Producto] = { c: 0, s: 0 };
            statsSemana[p.Producto].c += p.Cantidad;
            statsSemana[p.Producto].s += p.Subtotal;
        });
    });
    Object.entries(statsSemana).sort((a, b) => b[1].s - a[1].s).forEach(([prod, data]) => {
        reporteFinal.push([s, prod, data.c, data.s]);
    });
    reporteFinal.push([]);

    reporteFinal.push(["--- RESUMEN DE VENTAS POR DÍAS ---"], ["Semana", "Nombre del Registro (Día)", "Total Vendido ($)"]);
    historialSemanas[s].forEach(reg => {
        reporteFinal.push([s, reg.Día, reg.Total]);
    });
    reporteFinal.push([]);

    reporteFinal.push(["--- DETALLE DE GASTOS REGISTRADOS (POR SEMANA) ---"], ["Semana / Registro", "Motivo / Concepto", "Monto ($)"]);
    if (historialGastosSemanales[s]) {
        historialGastosSemanales[s].forEach(g => {
            reporteFinal.push([s, g.nombre, g.monto]);
        });
    }

    reporteFinal.push([], ["--- DETALLE DE INGRESOS MANUALES REGISTRADOS (POR SEMANA) ---"], ["Semana / Registro", "Motivo / Concepto", "Monto ($)"]);
    if (historialIngresosManualesSemanales[s]) {
        historialIngresosManualesSemanales[s].forEach(i => {
            reporteFinal.push([s, i.nombre, i.monto]);
        });
    }

    reporteFinal.push([], ["--- GASTOS ACTUALES (PENDIENTES DE GUARDAR) ---"], ["Estado", "Motivo / Concepto", "Monto ($)"]);
    reporteFinal.push(["(No aplican al corte de una sola semana)", "—", "—"]);
    reporteFinal.push([], ["--- INGRESOS MANUALES ACTUALES (PENDIENTES DE GUARDAR) ---"], ["Estado", "Motivo / Concepto", "Monto ($)"]);
    reporteFinal.push(["(No aplican al corte de una sola semana)", "—", "—"]);
    reporteFinal.push([]);

    reporteFinal.push(["--- HISTORIAL DETALLADO DE VENTAS ---"], ["Semana", "Registro", "Producto", "Cantidad", "Subtotal ($)"]);
    historialSemanas[s].forEach(reg => {
        reg.Detalles.forEach(p => {
            reporteFinal.push([s, reg.Día, p.Producto, p.Cantidad, p.Subtotal]);
        });
    });

    try {
        const lib = XLSX.utils.book_new();
        const hoja = XLSX.utils.aoa_to_sheet(reporteFinal);
        hoja['!cols'] = [{ wch: 25 }, { wch: 35 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(lib, hoja, "REPORTE SEMANA");
        const safe = s.replace(/[\\/:*?"<>|]/g, "_").substring(0, 40);
        XLSX.writeFile(lib, `Reporte_VIMAR_Semana_${safe}_${new Date().toLocaleDateString().replace(/\//g, "-")}.xlsx`);
    } catch (error) {
        console.error("Error al generar Excel:", error);
        await mostrarModalAlerta('Hubo un error al generar el archivo.', { titulo: 'Excel', tipo: 'error' });
    }
}

function inicializarStockSiVacio() {
    if (Object.keys(stockProductos).length === 0) {
        for (const [cat, data] of Object.entries(categorias)) {
            data.prods.forEach(p => {
                // 40 para todos (Litros o Unidades según categoría)
                stockProductos[p] = 60;
            });
        }
        localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
    }
}

function exportarBackup() {
    playSound('click');
    const data = {
        // Inventario y Configuración
        vimarStock: JSON.parse(localStorage.getItem('vimarStock')) || {},
        vimarCajaMonto: localStorage.getItem('vimarCajaMonto') || "0",

        // Ventas (Actuales y Archivadas)
        vimarHistorial: JSON.parse(localStorage.getItem('vimarHistorial')) || [], // Ticket actual
        historialSemanas: JSON.parse(localStorage.getItem('historialSemanas')) || {}, // Semanas de ventas
        
        // Gastos (Actuales y Archivados)
        vimarGastos: JSON.parse(localStorage.getItem('vimarGastos')) || [], // Gastos lista actual
        vimarHistorialGastos: JSON.parse(localStorage.getItem('vimarHistorialGastos')) || {}, // Semanas de gastos

        // Ingresos manuales (Actuales y Archivados)
        vimarIngresosManuales: JSON.parse(localStorage.getItem('vimarIngresosManuales')) || [], // Ingresos lista actual
        vimarHistorialIngresosManuales: JSON.parse(localStorage.getItem('vimarHistorialIngresosManuales')) || {}, // Semanas de ingresos manuales
        
        // Entradas de Stock y Otros
        vimarHistorialEntradas: JSON.parse(localStorage.getItem('vimarHistorialEntradas')) || [],
        registrosPendientes: JSON.parse(localStorage.getItem('registrosPendientes')) || [],
        ventasTicket: JSON.parse(localStorage.getItem('ventasTicket')) || [],
        vimarSaldoNetoPorSemana: JSON.parse(localStorage.getItem('vimarSaldoNetoPorSemana')) || {}
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    const fecha = new Date().toLocaleDateString().replace(/\//g,'-');
    
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `VIMAR_FULL_BACKUP_${fecha}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importarBackup(event) {
    playSound('click');
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);

            const mensaje = "¿Estás seguro de importar este backup?\n\nEsto borrará todas las ventas, gastos, ingresos manuales e inventario actuales y los reemplazará por los del archivo.";
            const ok = await mostrarModalConfirmar(mensaje, {
                titulo: 'Importar backup',
                peligroso: true,
                btnOk: 'Importar',
                btnCancel: 'Cancelar'
            });
            if (!ok) return;

            const keys = {
                'vimarStock': data.vimarStock,
                'vimarCajaMonto': data.vimarCajaMonto,
                'vimarHistorial': data.vimarHistorial,
                'historialSemanas': data.historialSemanas,
                'vimarGastos': data.vimarGastos,
                'vimarHistorialGastos': data.vimarHistorialGastos,
                'vimarIngresosManuales': data.vimarIngresosManuales,
                'vimarHistorialIngresosManuales': data.vimarHistorialIngresosManuales,
                'vimarHistorialEntradas': data.vimarHistorialEntradas,
                'registrosPendientes': data.registrosPendientes,
                'ventasTicket': data.ventasTicket,
                'vimarSaldoNetoPorSemana': data.vimarSaldoNetoPorSemana
            };

            Object.keys(keys).forEach(key => {
                if (keys[key] !== undefined) {
                    const valor = typeof keys[key] === 'string' ? keys[key] : JSON.stringify(keys[key]);
                    localStorage.setItem(key, valor);
                }
            });
            playSound('success');
            await mostrarModalAlerta('Backup restaurado con éxito. El sistema se reiniciará para aplicar los cambios.', { titulo: 'Importación', tipo: 'success' });
            location.reload();
        } catch (err) {
            await mostrarModalAlerta('El archivo no es un backup válido de VIMAR.', { titulo: 'Error', tipo: 'error' });
            console.error(err);
        }
    };
    reader.readAsText(file);
    // Limpiar el input para permitir cargar el mismo archivo dos veces si fuera necesario
    event.target.value = '';
}

async function agregarIngresoManual() {
    const nInput = document.getElementById('ingresoManualNombre'),
        mInput = document.getElementById('ingresoManualMonto');
    if (!nInput || !mInput) return;

    const n = nInput.value;
    const m = parseFloat(mInput.value) || 0;

    if (!n || isNaN(m) || m <= 0) {
        playSound('error');
        await mostrarModalAlerta('Completa nombre y monto del ingreso manual.', { titulo: 'Ingreso manual', tipo: 'error' });
        return;
    } else {
        playSound('click');
    }

    ingresosManualesArray.unshift({ nombre: n, monto: m });
    localStorage.setItem('vimarIngresosManuales', JSON.stringify(ingresosManualesArray));

    nInput.value = "";
    mInput.value = "";
    actualizarIngresosManualesUI();
    calcularTodo();
    nInput.focus();
}

async function borrarIngresoManual(i) {
    const ok = await mostrarModalConfirmar(
        `¿Borrar ingreso manual "${ingresosManualesArray[i].nombre}"?`,
        { titulo: 'Quitar ingreso manual', peligroso: true, btnOk: 'Borrar' }
    );
    if (!ok) return;

    playSound('delete');
    ingresosManualesArray.splice(i, 1);
    localStorage.setItem('vimarIngresosManuales', JSON.stringify(ingresosManualesArray));
    actualizarIngresosManualesUI();
    calcularTodo();
}

async function guardarIngresosManualesSemana() {
    if (!ingresosManualesArray || ingresosManualesArray.length === 0) {
        if (typeof playSound === 'function') playSound('error');
        await mostrarModalAlerta('No hay ingresos manuales para guardar.', { titulo: 'Ingresos manuales', tipo: 'error' });
        return;
    }

    const rawI = await mostrarModalPrompt('Nombre del registro (ej: Lunes tarde):', '', { titulo: 'Archivar ingresos manuales' });
    if (rawI == null || !String(rawI).trim()) return;

    const nombreSemanaI = String(rawI).trim();

    if (!historialIngresosManualesSemanales) historialIngresosManualesSemanales = {};

    historialIngresosManualesSemanales[nombreSemanaI] = [...ingresosManualesArray];
    localStorage.setItem('vimarHistorialIngresosManuales', JSON.stringify(historialIngresosManualesSemanales));

    recalcularTodosSaldosNetoSemanales();

    ingresosManualesArray = [];
    localStorage.setItem('vimarIngresosManuales', JSON.stringify([]));

    playSound('success');
    calcularTodo();
    actualizarIngresosManualesUI();
    await mostrarModalAlerta('Ingresos manuales archivados correctamente. La lista principal se ha limpiado.', { titulo: 'Listo', tipo: 'success' });
}

async function eliminarSemanaIngresosManuales(nombreSemanaI) {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        `¿Eliminar todo el registro de "${nombreSemanaI}"?`,
        { titulo: 'Eliminar ingresos manuales', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;

    delete historialIngresosManualesSemanales[nombreSemanaI];
    localStorage.setItem('vimarHistorialIngresosManuales', JSON.stringify(historialIngresosManualesSemanales));

    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialIngresosManuales();
    calcularTodo();
    playSound('delete');
}

async function editarNombreSemanaIngresoManual(antiguoNombre) {
    playSound('click');
    const raw = await mostrarModalPrompt('Nuevo nombre para este registro de ingresos manuales:', antiguoNombre, { titulo: 'Renombrar registro' });
    if (raw == null) return;

    const nuevoNombre = String(raw).trim();
    if (!nuevoNombre || nuevoNombre === antiguoNombre) return;

    if (historialIngresosManualesSemanales[nuevoNombre]) {
        await mostrarModalAlerta('Ya existe un registro con ese nombre.', { titulo: 'Nombre duplicado', tipo: 'error' });
        return;
    }

    historialIngresosManualesSemanales[nuevoNombre] = historialIngresosManualesSemanales[antiguoNombre];
    delete historialIngresosManualesSemanales[antiguoNombre];

    localStorage.setItem('vimarHistorialIngresosManuales', JSON.stringify(historialIngresosManualesSemanales));
    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialIngresosManuales();
    calcularTodo();
    playSound('success');
}

async function eliminarIngresoManualHistorial(nomSem, index) {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        '¿Eliminar este ingreso manual de forma permanente?\n\nEl saldo neto se actualizará.',
        { titulo: 'Eliminar ingreso manual', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;

    historialIngresosManualesSemanales[nomSem].splice(index, 1);

    if (historialIngresosManualesSemanales[nomSem].length === 0) {
        delete historialIngresosManualesSemanales[nomSem];
    }

    localStorage.setItem('vimarHistorialIngresosManuales', JSON.stringify(historialIngresosManualesSemanales));

    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialIngresosManuales();
    calcularTodo();
    if (typeof playSound === 'function') playSound('delete');
}

async function editarIngresoManualIndividual(nomSem, index) {
    playSound('click');
    const ingreso = historialIngresosManualesSemanales[nomSem][index];
    if (!ingreso) return;

    const nuevoConcepto = await mostrarModalPrompt('Editar concepto del ingreso manual:', ingreso.nombre, { titulo: 'Editar ingreso manual' });
    if (nuevoConcepto === null) return;

    const sMonto = await mostrarModalPrompt('Editar monto del ingreso manual:', String(ingreso.monto), { titulo: 'Monto', inputType: 'number' });
    if (sMonto == null) return;

    const nuevoMonto = parseFloat(sMonto);
    if (isNaN(nuevoMonto) || nuevoMonto <= 0) return;

    historialIngresosManualesSemanales[nomSem][index] = {
        nombre: nuevoConcepto,
        monto: nuevoMonto
    };

    localStorage.setItem('vimarHistorialIngresosManuales', JSON.stringify(historialIngresosManualesSemanales));
    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialIngresosManuales();
    calcularTodo();
    playSound('success');
}

async function agregarGasto() {
    const nInput = document.getElementById('gastoNombre'), mInput = document.getElementById('gastoMonto');
    const n = nInput.value, m = parseFloat(mInput.value) || 0;
    if(!n || isNaN(m) || m <= 0) {
        playSound('error');
        await mostrarModalAlerta('Completa nombre y monto del gasto.', { titulo: 'Gasto', tipo: 'error' });
        return;
    } else {
        playSound('click');
    }
    gastosArray.unshift({nombre: n, monto: m}); localStorage.setItem('vimarGastos', JSON.stringify(gastosArray));
    nInput.value = ""; mInput.value = ""; actualizarGastosUI(); calcularTodo(); nInput.focus();
}

async function borrarGasto(i) {
    const ok = await mostrarModalConfirmar(
        `¿Borrar gasto "${gastosArray[i].nombre}"?`,
        { titulo: 'Quitar gasto', peligroso: true, btnOk: 'Borrar' }
    );
    if (!ok) return;
    playSound('delete');
    gastosArray.splice(i, 1);
    localStorage.setItem('vimarGastos', JSON.stringify(gastosArray));
    actualizarGastosUI();
    calcularTodo();
}

async function guardarGastosSemana() {
    if (!gastosArray || gastosArray.length === 0) {
        if(typeof playSound === 'function') playSound('error');
        await mostrarModalAlerta('No hay gastos para guardar.', { titulo: 'Gastos', tipo: 'error' });
        return;
    }

    const rawG = await mostrarModalPrompt('Nombre del registro (ej: Lunes tarde):', '', { titulo: 'Archivar gastos' });
    if (rawG == null || !String(rawG).trim()) return;
    const nombreSemanaG = String(rawG).trim();

    // Inicializar historial si está vacío
    if (!historialGastosSemanales) historialGastosSemanales = {};

    // Guardar
    historialGastosSemanales[nombreSemanaG] = [...gastosArray];
    localStorage.setItem('vimarHistorialGastos', JSON.stringify(historialGastosSemanales));

    recalcularTodosSaldosNetoSemanales();
    
    // Limpiar lista actual
    gastosArray = [];
    localStorage.setItem('vimarGastos', JSON.stringify([]));
    
    if(typeof playSound === 'function') playSound('success');
    
    playSound('success');
    calcularTodo();
    actualizarGastosUI();
    await mostrarModalAlerta('Gastos archivados correctamente. La lista principal se ha limpiado.', { titulo: 'Listo', tipo: 'success' });
}

async function eliminarSemanaGastos(nombreSemanaG) {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        `¿Eliminar todo el registro de "${nombreSemanaG}"?`,
        { titulo: 'Eliminar gastos', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;
    delete historialGastosSemanales[nombreSemanaG];
    localStorage.setItem('vimarHistorialGastos', JSON.stringify(historialGastosSemanales));
    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialGastos();
    calcularTodo();
    playSound('delete');
}

async function editarNombreSemanaGasto(antiguoNombre) {
    playSound('click');
    const raw = await mostrarModalPrompt('Nuevo nombre para este registro de gastos:', antiguoNombre, { titulo: 'Renombrar registro' });
    if (raw == null) return;
    const nuevoNombre = String(raw).trim();
    if (!nuevoNombre || nuevoNombre === antiguoNombre) return;

    if (historialGastosSemanales[nuevoNombre]) {
        await mostrarModalAlerta('Ya existe un registro con ese nombre.', { titulo: 'Nombre duplicado', tipo: 'error' });
        return;
    }

    // Transferir datos a la nueva clave y borrar la antigua
    historialGastosSemanales[nuevoNombre] = historialGastosSemanales[antiguoNombre];
    delete historialGastosSemanales[antiguoNombre];

    localStorage.setItem('vimarHistorialGastos', JSON.stringify(historialGastosSemanales));
    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialGastos();
    calcularTodo();
    playSound('success');
}

async function eliminarGastoHistorial(nomSem, index) {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        '¿Eliminar este gasto de forma permanente?\n\nEl saldo neto se actualizará.',
        { titulo: 'Eliminar gasto', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;

    // 1. Eliminar del array interno de esa semana
    historialGastosSemanales[nomSem].splice(index, 1);

    // 2. Si la semana quedó vacía, eliminar la carpeta completa automáticamente
    if (historialGastosSemanales[nomSem].length === 0) {
        delete historialGastosSemanales[nomSem];
    }

    // 3. Persistencia
    localStorage.setItem('vimarHistorialGastos', JSON.stringify(historialGastosSemanales));

    recalcularTodosSaldosNetoSemanales();
    // 4. Actualizar visual y cálculos
    renderizarHistorialGastos();
    calcularTodo(); 
    if(typeof playSound === 'function') playSound('delete');
}

async function editarGastoIndividual(nomSem, index) {
    playSound('click');
    const gasto = historialGastosSemanales[nomSem][index];

    const nuevoConcepto = await mostrarModalPrompt('Editar concepto del gasto:', gasto.nombre, { titulo: 'Editar gasto' });
    if (nuevoConcepto === null) return;

    const sMonto = await mostrarModalPrompt('Editar monto del gasto:', String(gasto.monto), { titulo: 'Monto', inputType: 'number' });
    if (sMonto == null) return;
    const nuevoMonto = parseFloat(sMonto);
    if (isNaN(nuevoMonto)) return;

    // Aplicar cambios
    historialGastosSemanales[nomSem][index] = {
        nombre: nuevoConcepto,
        monto: nuevoMonto
    };

    localStorage.setItem('vimarHistorialGastos', JSON.stringify(historialGastosSemanales));
    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialGastos();
    calcularTodo(); // Para que el saldo neto se actualice con el nuevo monto
    playSound('success');
}

async function eliminarProductoUnico(nomSem, idxReg, idxProd) {
    // 1. Verificación de seguridad: ¿Existen los datos?
    if (!historialSemanas[nomSem] || !historialSemanas[nomSem][idxReg]) {
        console.error("No se encontró la semana o el registro solicitado.");
        return;
    }

    const registroDia = historialSemanas[nomSem][idxReg];
    const detalles = registroDia.Detalles;
    const productoAEliminar = detalles[idxProd];

    if (!productoAEliminar) {
        console.error("No se encontró el producto en el índice:", idxProd);
        return;
    }

    const ok = await mostrarModalConfirmar(
        `¿Eliminar ${productoAEliminar.Producto} del historial?\n\nEsto devolverá el stock y ajustará los balances.`,
        { titulo: 'Quitar producto', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;

    // 3. REVERTIR VALORES (Lógica de Negocio)
    const nombreP = productoAEliminar.Producto;
    const cant = productoAEliminar.Cantidad;
    const subtotalRemover = productoAEliminar.Subtotal;

    actualizarStock(nombreP, cant, 'devolver');

    registroDia.Total -= subtotalRemover;

    if (typeof saldoNeto !== 'undefined') {
        saldoNeto -= subtotalRemover;
    }

    detalles.splice(idxProd, 1);

    localStorage.setItem('historialSemanas', JSON.stringify(historialSemanas));
    localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
    recalcularTodosSaldosNetoSemanales();
    
    if (typeof saldoNeto !== 'undefined') {
        localStorage.setItem('vimarSaldoNeto', saldoNeto);
    }

    // 6. RE-RENDERIZADO DE LA INTERFAZ (Vital para ver el cambio)
    playSound('delete');
    
    // Forzamos a la UI a dibujar de nuevo con los datos actualizados
    renderizarTablasHistorial(); 
    if (typeof renderizarSeccionStocks === 'function') renderizarSeccionStocks();
    if (typeof actualizarGraficas === 'function') actualizarGraficas();
    if (typeof calcularTodo === 'function') calcularTodo(); // Recalcula totales generales

    console.log(`✅ Éxito: ${nombreP} eliminado. Datos sincronizados.`);
}