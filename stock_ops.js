// ============================================================
// STOCK_OPS.JS — Operaciones de stock e historial de inventario
// ============================================================

function actualizarStock(nombre, cantidad, operacion) {
    if (stockProductos[nombre] !== undefined) {
        if (operacion === 'descontar') stockProductos[nombre] -= cantidad;
        else if (operacion === 'devolver') stockProductos[nombre] += cantidad;
        localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
        renderizarCatalogo();
    }
}

function inicializarStockSiVacio() {
    if (Object.keys(stockProductos).length === 0) {
        for (const data of Object.values(categorias)) {
            data.prods.forEach(p => { stockProductos[p] = 60; });
        }
        localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
    }
}

async function añadirStockManual(nombreProducto) {
    playSound('click');
    const s = await mostrarModalPrompt(`¿Cuánto stock deseas añadir a "${nombreProducto}"?`, '0',
        { titulo: 'Añadir stock', inputType: 'number' });
    if (s == null) return;
    const cant = parseFloat(s);
    if (!isNaN(cant) && cant > 0) {
        stockProductos[nombreProducto] = (stockProductos[nombreProducto] || 0) + cant;
        historialEntradas.unshift({ id: Date.now(), fecha: new Date().toLocaleString(), producto: nombreProducto, cantidad: cant });
        guardarTodo();
        renderizarSeccionStocks();
        playSound('success');
        await mostrarModalAlerta(`Se añadieron ${cant} unidades/litros a ${nombreProducto}.`, { titulo: 'Stock actualizado', tipo: 'success' });
    }
}

async function editarStockDirecto(nombreProducto) {
    playSound('click');
    const vals = await mostrarModalFormulario('Corregir stock', [
        { id: 'producto', label: 'Producto',     value: nombreProducto, readonly: true },
        { id: 'stock',    label: 'Stock actual', value: stockProductos[nombreProducto] || 0, type: 'number' }
    ]);
    if (!vals) return;
    const nuevoValor = parseFloat(vals.stock);
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
    const vals = await mostrarModalFormulario('Editar entrada de inventario', [
        { id: 'producto', label: 'Producto', value: reg.producto, readonly: true },
        { id: 'cantidad', label: 'Cantidad', value: reg.cantidad, type: 'number' }
    ]);
    if (!vals) return;
    const nuevaCant = parseFloat(vals.cantidad);
    if (!isNaN(nuevaCant) && nuevaCant >= 0) {
        stockProductos[reg.producto] = (stockProductos[reg.producto] - reg.cantidad) + nuevaCant;
        reg.cantidad = nuevaCant;
        localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
        localStorage.setItem('vimarHistorialEntradas', JSON.stringify(historialEntradas));
        renderizarTablaInventario();
        playSound('success');
    }
}

function cambiarAManual(input) {
    const fila = input.parentElement.parentElement;
    const it = fila.querySelector('.total-fila');
    const ip = fila.querySelector('.precio-unit');
    const ic = fila.querySelector('.litros');
    [it, ip, ic].forEach(el => el.classList.remove('input-error'));
    const cant = parseFloat(ic.value) || 0;
    it.classList.replace('total-auto', 'total-manual');
    if (input.classList.contains('total-fila')) {
        if (cant > 0 && input.value !== '') ip.value = (parseFloat(input.value) / cant).toFixed(2);
    } else {
        if (cant > 0 && input.value !== '') it.value = (parseFloat(input.value) * cant).toFixed(2);
    }
    calcularTodo();
}

function actualizarDimensionesGraficas() {
    if (window.topS) { window.topS.resize(); window.topS.update(); }
    if (window.topC) { window.topC.resize(); window.topC.update(); }
}