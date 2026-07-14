// ============================================================
// HISTORIAL.JS — Edición y eliminación del historial de ventas
// ============================================================

// ── Utilidades persistencia ──────────────────────────────────

function guardarTodo() {
    localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
    localStorage.setItem('vimarHistorialEntradas', JSON.stringify(historialEntradas));
}

function guardarYRefrescarTodo() {
    localStorage.setItem('historialSemanas', JSON.stringify(historialSemanas));
    localStorage.setItem('registrosPendientes', JSON.stringify(registrosPendientes));
    localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
    renderizarTablasHistorial();
    recalcularTodosSaldosNetoSemanales();
    calcularTodo();
    actualizarGraficas();
    if (document.getElementById('seccionStocks')?.classList.contains('vimar-seccion-activa')) renderizarSeccionStocks();
    renderizarCatalogo();
}

// ── Renombrar ────────────────────────────────────────────────

async function editarNombreSemana(nombreAntiguo) {
    playSound('click');
    const raw = await mostrarModalPrompt('Nuevo nombre para la Semana/Carpeta:', nombreAntiguo, { titulo: 'Renombrar semana' });
    if (raw == null) return;
    const nuevoNombre = String(raw).trim();
    if (!nuevoNombre || nuevoNombre === nombreAntiguo) return;
    if (historialSemanas[nuevoNombre]) {
        await mostrarModalAlerta('Ya existe una semana con ese nombre.', { titulo: 'Nombre duplicado', tipo: 'error' });
        return;
    }
    historialSemanas[nuevoNombre] = historialSemanas[nombreAntiguo];
    delete historialSemanas[nombreAntiguo];
    playSound('success');
    guardarYRefrescarTodo();
}

async function editarNombreRegistro(nomSem, idxReg) {
    playSound('click');
    const raw = await mostrarModalPrompt('Nuevo nombre para el registro:', historialSemanas[nomSem][idxReg].Día, { titulo: 'Renombrar día' });
    if (raw == null) return;
    const nuevoNombre = String(raw).trim();
    if (nuevoNombre) { historialSemanas[nomSem][idxReg].Día = nuevoNombre; playSound('success'); guardarYRefrescarTodo(); }
}

async function editarNombreRegistroPendiente(idxReg) {
    playSound('click');
    if (!registrosPendientes[idxReg]) return;
    const raw = await mostrarModalPrompt('Nuevo nombre para el día:', registrosPendientes[idxReg].Día, { titulo: 'Renombrar día' });
    if (raw == null) return;
    const nuevoNombre = String(raw).trim();
    if (nuevoNombre) { registrosPendientes[idxReg].Día = nuevoNombre; playSound('success'); guardarYRefrescarTodo(); }
}

// ── Editar productos ─────────────────────────────────────────

async function editarDatoProducto(nomSem, idxReg, idxProd) {
    playSound('click');
    const prod = historialSemanas[nomSem][idxReg].Detalles[idxProd];
    const cantAnterior = prod.Cantidad;
    const vals = await mostrarModalFormulario('Editar producto', [
        { id: 'producto', label: 'Producto',    value: prod.Producto, readonly: true },
        { id: 'cantidad', label: 'Cantidad',    value: prod.Cantidad, type: 'number' },
        { id: 'subtotal', label: 'Subtotal ($)', value: prod.Subtotal, type: 'number' }
    ]);
    if (!vals) return;
    const nuevaCant = parseFloat(vals.cantidad);
    const nuevoSub  = parseFloat(vals.subtotal);
    if (!isNaN(nuevaCant) && !isNaN(nuevoSub)) {
        actualizarStock(prod.Producto, cantAnterior, 'devolver');
        actualizarStock(prod.Producto, nuevaCant,   'descontar');
        prod.Cantidad = nuevaCant;
        prod.Subtotal = nuevoSub;
        historialSemanas[nomSem][idxReg].Total = historialSemanas[nomSem][idxReg].Detalles.reduce((a, b) => a + b.Subtotal, 0);
        playSound('success');
        guardarYRefrescarTodo();
    }
}

async function editarDatoProductoPendiente(idxReg, idxProd) {
    playSound('click');
    const reg = registrosPendientes[idxReg];
    if (!reg?.Detalles[idxProd]) return;
    const prod = reg.Detalles[idxProd];
    const cantAnterior = prod.Cantidad;
    const vals = await mostrarModalFormulario('Editar producto', [
        { id: 'producto', label: 'Producto',    value: prod.Producto, readonly: true },
        { id: 'cantidad', label: 'Cantidad',    value: prod.Cantidad, type: 'number' },
        { id: 'subtotal', label: 'Subtotal ($)', value: prod.Subtotal, type: 'number' }
    ]);
    if (!vals) return;
    const nuevaCant = parseFloat(vals.cantidad);
    const nuevoSub  = parseFloat(vals.subtotal);
    if (!isNaN(nuevaCant) && !isNaN(nuevoSub)) {
        actualizarStock(prod.Producto, cantAnterior, 'devolver');
        actualizarStock(prod.Producto, nuevaCant,   'descontar');
        prod.Cantidad = nuevaCant;
        prod.Subtotal = nuevoSub;
        reg.Total = reg.Detalles.reduce((a, b) => a + b.Subtotal, 0);
        playSound('success');
        guardarYRefrescarTodo();
    }
}

// ── Eliminar productos ────────────────────────────────────────

async function eliminarProductoUnico(nomSem, idxReg, idxProd) {
    playSound('click');
    if (!historialSemanas[nomSem]?.[idxReg]) { console.error('Registro no encontrado'); return; }
    const reg  = historialSemanas[nomSem][idxReg];
    const prod = reg.Detalles[idxProd];
    if (!prod) { console.error('Producto no encontrado en índice:', idxProd); return; }

    const ok = await mostrarModalConfirmar(
        `¿Eliminar ${prod.Producto} del historial?\n\nEsto devolverá el stock y ajustará los balances.`,
        { titulo: 'Quitar producto', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;

    actualizarStock(prod.Producto, prod.Cantidad, 'devolver');
    reg.Total -= prod.Subtotal;
    reg.Detalles.splice(idxProd, 1);

    localStorage.setItem('historialSemanas', JSON.stringify(historialSemanas));
    localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
    recalcularTodosSaldosNetoSemanales();
    playSound('delete');
    renderizarTablasHistorial();
    if (typeof renderizarSeccionStocks === 'function') renderizarSeccionStocks();
    actualizarGraficas();
    calcularTodo();
}

async function eliminarProductoPendiente(idxReg, idxProd) {
    const reg = registrosPendientes[idxReg];
    if (!reg?.Detalles[idxProd]) return;
    const prod = reg.Detalles[idxProd];
    const ok = await mostrarModalConfirmar(
        `¿Eliminar ${prod.Producto} de este día?\n\nSe devolverá el stock y se actualizarán los totales.`,
        { titulo: 'Quitar producto', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;
    playSound('delete');
    actualizarStock(prod.Producto, prod.Cantidad, 'devolver');
    reg.Detalles.splice(idxProd, 1);
    if (reg.Detalles.length === 0) registrosPendientes.splice(idxReg, 1);
    else reg.Total = reg.Detalles.reduce((a, b) => a + b.Subtotal, 0);
    guardarYRefrescarTodo();
}

// ── Eliminar días/semanas ────────────────────────────────────

async function eliminarRegistroDia(nomSem, idxReg) {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        `¿Eliminar registro "${historialSemanas[nomSem][idxReg].Día}"?`,
        { titulo: 'Eliminar día', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;
    playSound('delete');
    historialSemanas[nomSem][idxReg].Detalles.forEach(p => actualizarStock(p.Producto, p.Cantidad, 'devolver'));
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
    historialSemanas[nomSem].forEach(reg =>
        reg.Detalles.forEach(p => actualizarStock(p.Producto, p.Cantidad, 'devolver'))
    );
    delete historialSemanas[nomSem];
    guardarYRefrescarTodo();
}

// ── Legado (datos en formato antiguo) ────────────────────────

function recalcularResumenDias() {
    resumenDias.forEach(dia => {
        dia["Total ($)"] = detalleVentas.filter(v => v.Registro === dia.Día).reduce((acc, v) => acc + v.Subtotal, 0);
    });
    localStorage.setItem('resumenDias', JSON.stringify(resumenDias));
    localStorage.setItem('detalleVentas', JSON.stringify(detalleVentas));
}

async function eliminarFilaHistorial(index) {
    playSound('click');
    const ok = await mostrarModalConfirmar('¿Eliminar producto?', { titulo: 'Eliminar', peligroso: true, btnOk: 'Eliminar' });
    if (!ok) return;
    detalleVentas.splice(index, 1);
    recalcularResumenDias();
    renderizarTablasHistorial();
    calcularTodo();
    playSound('delete');
}

async function eliminarDiaHistorial(index) {
    playSound('click');
    const ok = await mostrarModalConfirmar('¿Eliminar registro?', { titulo: 'Eliminar', peligroso: true, btnOk: 'Eliminar' });
    if (!ok) return;
    const d = resumenDias[index].Día;
    resumenDias.splice(index, 1);
    detalleVentas = detalleVentas.filter(v => v.Registro !== d);
    recalcularResumenDias();
    renderizarTablasHistorial();
    calcularTodo();
    playSound('delete');
}