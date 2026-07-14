// ============================================================
// FINANZAS.JS — Gastos, ingresos manuales, caja y saldo neto
// ============================================================

// ── Caja ─────────────────────────────────────────────────────

function guardarCaja() {
    localStorage.setItem('vimarCajaMonto', document.getElementById('inputCajaReal').value);
}

function getMontoCaja() {
    const el = document.getElementById('inputCajaReal');
    if (el?.value !== '' && el?.value != null) {
        const v = parseFloat(el.value);
        if (!isNaN(v)) return v;
    }
    const stored = localStorage.getItem('vimarCajaMonto');
    if (stored != null && stored !== '') {
        const v = parseFloat(stored);
        if (!isNaN(v)) return v;
    }
    return 0;
}

// ── Cálculo de saldo ─────────────────────────────────────────

function sumaVentasSemanaHistorial(nombre) {
    return (historialSemanas[nombre] || []).reduce((a, r) => a + r.Total, 0);
}

function sumaGastosPorNombreSemana(nombre) {
    return (historialGastosSemanales[nombre] || []).reduce((a, g) => a + g.monto, 0);
}

function sumaIngresosManualesPorNombreSemana(nombre) {
    return (historialIngresosManualesSemanales[nombre] || []).reduce((a, i) => a + i.monto, 0);
}

function sumaGastosHuerfanosHistorial() {
    return Object.keys(historialGastosSemanales || {})
        .filter(k => !historialSemanas[k])
        .reduce((s, k) => s + historialGastosSemanales[k].reduce((a, g) => a + g.monto, 0), 0);
}

function sumaIngresosManualesHuerfanosHistorial() {
    return Object.keys(historialIngresosManualesSemanales || {})
        .filter(k => !historialSemanas[k])
        .reduce((s, k) => s + historialIngresosManualesSemanales[k].reduce((a, i) => a + i.monto, 0), 0);
}

function obtenerSaldoNetoTrasSemanasArchivadas() {
    let saldo = getMontoCaja();
    Object.keys(historialSemanas).forEach(nom => {
        saldo += sumaVentasSemanaHistorial(nom)
               + sumaIngresosManualesPorNombreSemana(nom)
               - sumaGastosPorNombreSemana(nom);
    });
    saldo -= sumaGastosHuerfanosHistorial();
    saldo += sumaIngresosManualesHuerfanosHistorial();
    return saldo;
}

function recalcularTodosSaldosNetoSemanales() {
    saldoNetoPorSemana = {};
    let saldo = getMontoCaja();
    Object.keys(historialSemanas).forEach(nom => {
        saldo += sumaVentasSemanaHistorial(nom)
               + sumaIngresosManualesPorNombreSemana(nom)
               - sumaGastosPorNombreSemana(nom);
        saldoNetoPorSemana[nom] = saldo;
    });
    localStorage.setItem('vimarSaldoNetoPorSemana', JSON.stringify(saldoNetoPorSemana));
}

function saldoInicialParaSemana(nombreSemana) {
    const orden = Object.keys(historialSemanas);
    const idx   = orden.indexOf(nombreSemana);
    if (idx <= 0) return getMontoCaja();
    const prev = orden[idx - 1];
    return saldoNetoPorSemana[prev] ?? getMontoCaja();
}

function calcularTodo() {
    let subtotalVivo = 0;
    document.querySelectorAll('.total-fila').forEach(i => { subtotalVivo += parseFloat(i.value) || 0; });
    document.getElementById('txtSubtotalVivo').innerText = `$${subtotalVivo.toFixed(2)}`;

    const totalPendientes  = registrosPendientes.reduce((a, r) => a + r.Total, 0);
    const totalTicket      = ventasTicket.reduce((a, v) => a + v.Total, 0);
    const gastosActuales   = gastosArray.reduce((a, b) => a + b.monto, 0);
    const ingresosManuales = ingresosManualesArray.reduce((a, b) => a + b.monto, 0);

    recalcularTodosSaldosNetoSemanales();
    const neto = obtenerSaldoNetoTrasSemanasArchivadas() + totalPendientes + totalTicket - gastosActuales + ingresosManuales;

    const tn = document.getElementById('txtSaldoFinal');
    tn.innerText = `$${neto.toFixed(2)}`;
    tn.classList.toggle('saldo-final--positivo', neto >= 0);
    tn.classList.toggle('saldo-final--negativo',  neto < 0);
}

// ── Gastos actuales ──────────────────────────────────────────

async function agregarGasto() {
    const nInput = document.getElementById('gastoNombre');
    const mInput = document.getElementById('gastoMonto');
    const n = nInput.value;
    const m = parseFloat(mInput.value) || 0;
    if (!n || isNaN(m) || m <= 0) {
        playSound('error');
        await mostrarModalAlerta('Completa nombre y monto del gasto.', { titulo: 'Gasto', tipo: 'error' });
        return;
    }
    playSound('click');
    gastosArray.unshift({ nombre: n, monto: m });
    localStorage.setItem('vimarGastos', JSON.stringify(gastosArray));
    nInput.value = ''; mInput.value = '';
    actualizarGastosUI();
    calcularTodo();
    nInput.focus();
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

async function editarGastoActual(index) {
    playSound('click');
    const gasto = gastosArray[index];
    if (!gasto) return;
    const vals = await mostrarModalFormulario('Editar gasto', [
        { id: 'concepto', label: 'Concepto / Motivo', value: gasto.nombre },
        { id: 'monto',    label: 'Monto ($)',          value: gasto.monto, type: 'number' }
    ]);
    if (!vals) return;
    const nuevoMonto = parseFloat(vals.monto);
    if (isNaN(nuevoMonto) || nuevoMonto <= 0) return;
    gastosArray[index] = { nombre: vals.concepto.trim(), monto: nuevoMonto };
    localStorage.setItem('vimarGastos', JSON.stringify(gastosArray));
    actualizarGastosUI();
    calcularTodo();
    playSound('success');
}

async function guardarGastosSemana() {
    if (!gastosArray?.length) {
        playSound('error');
        await mostrarModalAlerta('No hay gastos para guardar.', { titulo: 'Gastos', tipo: 'error' });
        return;
    }
    const rawG = await mostrarModalPrompt('Nombre del registro (ej: Lunes tarde):', '', { titulo: 'Archivar gastos' });
    if (rawG == null || !String(rawG).trim()) return;
    const nombreSemanaG = String(rawG).trim();

    historialGastosSemanales[nombreSemanaG] = [...gastosArray];
    localStorage.setItem('vimarHistorialGastos', JSON.stringify(historialGastosSemanales));
    recalcularTodosSaldosNetoSemanales();

    gastosArray = [];
    localStorage.setItem('vimarGastos', JSON.stringify([]));
    playSound('success');
    calcularTodo();
    actualizarGastosUI();
    await mostrarModalAlerta('Gastos archivados correctamente. La lista principal se ha limpiado.', { titulo: 'Listo', tipo: 'success' });
}

// ── Historial de gastos ──────────────────────────────────────

async function eliminarSemanaGastos(nombreSemanaG) {
    playSound('click');
    const ok = await mostrarModalConfirmar(`¿Eliminar todo el registro de "${nombreSemanaG}"?`,
        { titulo: 'Eliminar gastos', peligroso: true, btnOk: 'Eliminar' });
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
    historialGastosSemanales[nomSem].splice(index, 1);
    if (historialGastosSemanales[nomSem].length === 0) delete historialGastosSemanales[nomSem];
    localStorage.setItem('vimarHistorialGastos', JSON.stringify(historialGastosSemanales));
    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialGastos();
    calcularTodo();
    playSound('delete');
}

async function editarGastoIndividual(nomSem, index) {
    playSound('click');
    const gasto = historialGastosSemanales[nomSem][index];
    const vals = await mostrarModalFormulario('Editar gasto', [
        { id: 'concepto', label: 'Concepto / Motivo', value: gasto.nombre },
        { id: 'monto',    label: 'Monto ($)',          value: gasto.monto, type: 'number' }
    ]);
    if (!vals) return;
    const nuevoMonto = parseFloat(vals.monto);
    if (isNaN(nuevoMonto)) return;
    historialGastosSemanales[nomSem][index] = { nombre: vals.concepto.trim(), monto: nuevoMonto };
    localStorage.setItem('vimarHistorialGastos', JSON.stringify(historialGastosSemanales));
    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialGastos();
    calcularTodo();
    playSound('success');
}

// ── Ingresos manuales actuales ────────────────────────────────

async function agregarIngresoManual() {
    const nInput = document.getElementById('ingresoManualNombre');
    const mInput = document.getElementById('ingresoManualMonto');
    if (!nInput || !mInput) return;
    const n = nInput.value;
    const m = parseFloat(mInput.value) || 0;
    if (!n || isNaN(m) || m <= 0) {
        playSound('error');
        await mostrarModalAlerta('Completa nombre y monto del ingreso manual.', { titulo: 'Ingreso manual', tipo: 'error' });
        return;
    }
    playSound('click');
    ingresosManualesArray.unshift({ nombre: n, monto: m });
    localStorage.setItem('vimarIngresosManuales', JSON.stringify(ingresosManualesArray));
    nInput.value = ''; mInput.value = '';
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

async function editarIngresoManualActual(index) {
    playSound('click');
    const ingreso = ingresosManualesArray[index];
    if (!ingreso) return;
    const vals = await mostrarModalFormulario('Editar ingreso manual', [
        { id: 'concepto', label: 'Concepto / Motivo', value: ingreso.nombre },
        { id: 'monto',    label: 'Monto ($)',          value: ingreso.monto, type: 'number' }
    ]);
    if (!vals) return;
    const nuevoMonto = parseFloat(vals.monto);
    if (isNaN(nuevoMonto) || nuevoMonto <= 0) return;
    ingresosManualesArray[index] = { nombre: vals.concepto.trim(), monto: nuevoMonto };
    localStorage.setItem('vimarIngresosManuales', JSON.stringify(ingresosManualesArray));
    actualizarIngresosManualesUI();
    calcularTodo();
    playSound('success');
}

async function guardarIngresosManualesSemana() {
    if (!ingresosManualesArray?.length) {
        playSound('error');
        await mostrarModalAlerta('No hay ingresos manuales para guardar.', { titulo: 'Ingresos manuales', tipo: 'error' });
        return;
    }
    const rawI = await mostrarModalPrompt('Nombre del registro (ej: Lunes tarde):', '', { titulo: 'Archivar ingresos manuales' });
    if (rawI == null || !String(rawI).trim()) return;
    const nombreSemanaI = String(rawI).trim();

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

// ── Historial de ingresos manuales ────────────────────────────

async function eliminarSemanaIngresosManuales(nombreSemanaI) {
    playSound('click');
    const ok = await mostrarModalConfirmar(`¿Eliminar todo el registro de "${nombreSemanaI}"?`,
        { titulo: 'Eliminar ingresos manuales', peligroso: true, btnOk: 'Eliminar' });
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
    if (historialIngresosManualesSemanales[nomSem].length === 0) delete historialIngresosManualesSemanales[nomSem];
    localStorage.setItem('vimarHistorialIngresosManuales', JSON.stringify(historialIngresosManualesSemanales));
    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialIngresosManuales();
    calcularTodo();
    playSound('delete');
}

async function editarIngresoManualIndividual(nomSem, index) {
    playSound('click');
    const ingreso = historialIngresosManualesSemanales[nomSem][index];
    if (!ingreso) return;
    const vals = await mostrarModalFormulario('Editar ingreso manual', [
        { id: 'concepto', label: 'Concepto / Motivo', value: ingreso.nombre },
        { id: 'monto',    label: 'Monto ($)',          value: ingreso.monto, type: 'number' }
    ]);
    if (!vals) return;
    const nuevoMonto = parseFloat(vals.monto);
    if (isNaN(nuevoMonto) || nuevoMonto <= 0) return;
    historialIngresosManualesSemanales[nomSem][index] = { nombre: vals.concepto.trim(), monto: nuevoMonto };
    localStorage.setItem('vimarHistorialIngresosManuales', JSON.stringify(historialIngresosManualesSemanales));
    recalcularTodosSaldosNetoSemanales();
    renderizarHistorialIngresosManuales();
    calcularTodo();
    playSound('success');
}