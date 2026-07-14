// ============================================================
// VENTAS.JS — Ticket de venta, cierre de día y de semana
// ============================================================

// ── Ticket activo ────────────────────────────────────────────

async function guardarVentaTicket() {
    const filas = document.querySelectorAll('#cuerpoVenta tr');
    if (filas.length === 0) {
        playSound('error');
        await mostrarModalAlerta('El ticket está vacío. Agrega productos antes de guardar.', { titulo: 'Ticket vacío', tipo: 'error' });
        return;
    }

    let errores = 0, totalVenta = 0;
    const productosVenta = [], faltantes = [];

    filas.forEach(f => {
        const iCant  = f.querySelector('.litros');
        const iPU    = f.querySelector('.precio-unit');
        const iTotal = f.querySelector('.total-fila');
        const nombre = f.querySelector('.td-producto').innerText;
        const cant   = parseFloat(iCant.value);
        const pu     = parseFloat(iPU.value);
        const sub    = parseFloat(iTotal.value);

        [iCant, iPU, iTotal].forEach(el => el.classList.remove('input-error'));

        let err = false;
        if (isNaN(cant) || cant <= 0) { iCant.classList.add('input-error');  err = true; }
        if (isNaN(pu)   || pu   <= 0) { iPU.classList.add('input-error');    err = true; }
        if (isNaN(sub)  || sub  <= 0) { iTotal.classList.add('input-error'); err = true; }

        if (err) { errores++; }
        else { totalVenta += sub; productosVenta.push({ Producto: nombre, Cantidad: cant, Subtotal: sub }); }
    });

    if (errores > 0) {
        playSound('error');
        await mostrarModalAlerta('Hay casillas vacías o con valor 0 (marcadas en rojo).', { titulo: 'Revisar ticket', tipo: 'error' });
        return;
    }

    // Validar stock
    productosVenta.forEach(p => {
        const disp = stockProductos[p.Producto] || 0;
        if (p.Cantidad > disp) faltantes.push(`• ${p.Producto}: pides ${p.Cantidad}, tienes ${disp}`);
    });

    if (faltantes.length > 0) {
        playSound('error');
        const ok = await mostrarModalConfirmar(
            "⚠️ ALERTA DE STOCK INSUFICIENTE:\n\n" + faltantes.join("\n") + "\n\n¿Deseas proceder de todos modos?",
            { titulo: 'Stock insuficiente', peligroso: true, btnOk: 'Proceder igual', btnCancel: 'Cancelar' }
        );
        if (!ok) return;
    }

    productosVenta.forEach(p => actualizarStock(p.Producto, p.Cantidad, 'descontar'));

    const hora = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    ventasTicket.push({ id: Date.now(), hora, Total: totalVenta, Detalles: productosVenta });
    localStorage.setItem('ventasTicket', JSON.stringify(ventasTicket));

    document.getElementById('cuerpoVenta').innerHTML = '';
    calcularTodo();
    actualizarGraficas();
    renderizarListaVentasTicket();
    playSound('success');
}

async function eliminarVentaTicket(idx) {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        '¿Eliminar esta venta?\n\nSe devolverá el stock de los productos.',
        { titulo: 'Eliminar venta', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;
    playSound('delete');
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
    if (!venta?.Detalles[idxProd]) return;
    const prod = venta.Detalles[idxProd];
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
        venta.Total   = venta.Detalles.reduce((a, b) => a + b.Subtotal, 0);
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
    if (!venta?.Detalles[idxProd]) return;
    const prod = venta.Detalles[idxProd];
    const ok = await mostrarModalConfirmar(
        `¿Eliminar ${prod.Producto} de esta venta?\n\nSe devolverá el stock y se actualizarán los totales.`,
        { titulo: 'Quitar producto', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;
    playSound('delete');
    actualizarStock(prod.Producto, prod.Cantidad, 'devolver');
    venta.Detalles.splice(idxProd, 1);
    if (venta.Detalles.length === 0) ventasTicket.splice(idxVenta, 1);
    else venta.Total = venta.Detalles.reduce((a, b) => a + b.Subtotal, 0);
    localStorage.setItem('ventasTicket', JSON.stringify(ventasTicket));
    calcularTodo();
    actualizarGraficas();
    renderizarListaVentasTicket();
}

// ── Ticket imprimible ────────────────────────────────────────

async function generarTicketVentaTicket(idx) {
    playSound('click');
    const venta = ventasTicket[idx];
    if (!venta?.Detalles?.length) {
        await mostrarModalAlerta('Esta venta no tiene productos para el ticket.', { titulo: 'Ticket', tipo: 'error' });
        return;
    }

    const total  = Number(venta.Total);
    const sPago  = await mostrarModalPrompt('Cantidad que entrega el cliente ($):', total.toFixed(2),
        { titulo: 'Pago del cliente', inputType: 'number', btnOk: 'Generar ticket', btnCancel: 'Cancelar' });
    if (sPago == null) return;

    const pago = parseFloat(String(sPago).replace(/,/g, '').trim());
    if (isNaN(pago) || pago < 0) {
        await mostrarModalAlerta('Introduce un monto válido.', { titulo: 'Ticket', tipo: 'error' });
        return;
    }

    const cambio   = Math.max(0, pago - total);
    const fechaStr = new Date().toLocaleString('es-MX', { dateStyle: 'full', timeStyle: 'short' });
    let logoUrl = 'LVIMAR.png';
    try { logoUrl = new URL('LVIMAR.png', window.location.href).href; } catch(e) {}

    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const filas = venta.Detalles.map(p => {
        const pu = p.Cantidad ? p.Subtotal / p.Cantidad : 0;
        return `<tr><td class="c">${esc(p.Cantidad)}</td><td>${esc(p.Producto)}</td><td class="r">$${pu.toFixed(2)}</td><td class="r">$${p.Subtotal.toFixed(2)}</td></tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">
<meta name="viewport" content="width=320,initial-scale=1"><title>Ticket VIMAR</title>
<style>
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:80mm auto;margin:2mm}
body{margin:0 auto;padding:3mm 2.5mm;width:72mm;max-width:72mm;font-family:'Courier New',Courier,monospace;font-size:9.5pt;font-weight:600;line-height:1.28;color:#000;background:#fff}
.logo{text-align:center;margin:0 0 1.5mm}
.logo img{display:block;margin:0 auto;max-width:30mm;height:auto;object-fit:contain}
.biz{text-align:center;line-height:1.32;margin-bottom:2.5mm;font-size:8.5pt;font-weight:700}
.biz strong{font-size:11pt;font-weight:800;display:block;margin-top:.8mm;letter-spacing:.08em}
.fh{text-align:center;font-size:8.5pt;font-weight:700;margin:2mm 0;padding:2mm 1mm;border-top:1px dashed #000;border-bottom:1px dashed #000;word-break:break-word}
table.p{width:100%;table-layout:fixed;border-collapse:collapse;font-size:8.5pt;font-weight:600}
table.p th{text-align:left;border-bottom:2px solid #000;padding:1.4mm .5mm;font-weight:800;vertical-align:bottom}
table.p th.r,table.p td.r{text-align:right}
table.p th.c,table.p td.c{text-align:center;width:9mm;padding:0 .5mm 0 0}
table.p th:nth-child(2),table.p td:nth-child(2){width:auto;padding:0 1mm;word-wrap:break-word;overflow-wrap:break-word;hyphens:auto}
table.p th:nth-child(3),table.p td:nth-child(3){width:16mm}
table.p th:nth-child(4),table.p td:nth-child(4){width:18mm}
table.p td{padding:1.1mm .5mm;vertical-align:top;border-bottom:1px dotted #888;font-weight:600}
table.p tbody tr:last-child td{border-bottom:none}
.imp{margin-top:2.5mm;font-weight:800;font-size:10pt;display:flex;justify-content:space-between;align-items:baseline;gap:2mm}
.imp span:last-child{white-space:nowrap}
.tot{text-align:center;font-weight:800;margin:2.5mm 0 1.5mm;letter-spacing:.04em;font-size:8.5pt}
.pay{display:flex;justify-content:space-between;margin:1.2mm 0;font-size:9.5pt;font-weight:700;gap:2mm}
.pay span:last-child{white-space:nowrap;font-weight:800}
.letras{margin-top:2.5mm;font-size:7.5pt;font-weight:700;text-align:justify;text-align-last:center;line-height:1.4;border-top:1px dashed #000;padding-top:2mm;text-transform:uppercase;word-break:break-word;hyphens:manual}
@media screen{body{box-shadow:0 0 12px rgba(0,0,0,.12);min-height:40vh}}
@media print{@page{size:80mm auto;margin:0}body{padding:1.5mm 2mm;box-shadow:none}table.p td{border-bottom-color:#bbb}}
</style></head><body>
<div class="logo"><img src="${logoUrl}" alt="VIMAR"></div>
<div class="biz"><div>Productos de Limpieza</div><strong>VIMAR</strong>
<div>Marquesina #4172</div><div>Entre AV. Baluarte y Campanario</div>
<div>Frac. Res. El Campanario</div><div>Veracruz, Ver. — CP: 91808</div>
<div>Cel 1: 2293191788</div><div>Cel 2: 2291725617</div>
<div>limpiezavimar@gmail.com</div></div>
<div class="fh">${esc(fechaStr)}</div>
<table class="p"><thead><tr><th class="c">Cant</th><th>Descripción</th><th class="r">P.U.</th><th class="r">Subtotal</th></tr></thead>
<tbody>${filas}</tbody></table>
<div class="imp"><span>Importe (Total):</span><span>$${total.toFixed(2)}</span></div>
<div class="tot">----- TOTAL A PAGAR -----</div>
<div class="pay"><span>Pago:</span><span>$${pago.toFixed(2)}</span></div>
<div class="pay"><span>Cambio:</span><span>$${cambio.toFixed(2)}</span></div>
<div class="letras">${esc(vimarImporteALetrasMX(total))}</div>
</body></html>`;

    const w = window.open('', '_blank', 'width=340,height=780,scrollbars=yes');
    if (!w) { await mostrarModalAlerta('Permite ventanas emergentes para imprimir el ticket.', { titulo: 'Ticket', tipo: 'error' }); return; }
    w.document.write(html);
    w.document.close();
    const imprimir = () => { try { w.focus(); w.print(); } catch(e) {} };
    if (w.document.readyState === 'complete') setTimeout(imprimir, 300);
    else w.onload = () => setTimeout(imprimir, 300);
    playSound('success');
}

// ── Día y semana ─────────────────────────────────────────────

async function eliminarDiaTemporal(idx) {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        `¿Eliminar el día "${registrosPendientes[idx].Día}"?\n\nSe devolverá el stock de todos sus productos.`,
        { titulo: 'Eliminar día', peligroso: true, btnOk: 'Eliminar' }
    );
    if (!ok) return;
    playSound('delete');
    registrosPendientes[idx].Detalles.forEach(p => actualizarStock(p.Producto, p.Cantidad, 'devolver'));
    registrosPendientes.splice(idx, 1);
    localStorage.setItem('registrosPendientes', JSON.stringify(registrosPendientes));
    calcularTodo();
    actualizarGraficas();
    renderizarTablasHistorial();
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

    const totalDia = ventasTicket.reduce((a, v) => a + v.Total, 0);
    const detallesDelDia = ventasTicket.flatMap(v => v.Detalles.map(p => ({ ...p })));

    registrosPendientes.push({ Día: nombreRegistro, Total: totalDia, Detalles: detallesDelDia, esTemporal: true });
    localStorage.setItem('registrosPendientes', JSON.stringify(registrosPendientes));

    ventasTicket = [];
    localStorage.setItem('ventasTicket', JSON.stringify(ventasTicket));

    calcularTodo();
    actualizarGraficas();
    renderizarListaVentasTicket();
    if (document.getElementById('seccionHistorial')?.classList.contains('vimar-seccion-activa')) renderizarTablasHistorial();

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

    historialSemanas[nombreSemana] = registrosPendientes.map(({ esTemporal, ...reg }) => reg);
    localStorage.setItem('historialSemanas', JSON.stringify(historialSemanas));

    registrosPendientes = [];
    localStorage.setItem('registrosPendientes', JSON.stringify(registrosPendientes));

    recalcularTodosSaldosNetoSemanales();
    playSound('success');
    await mostrarModalAlerta(`Semana "${nombreSemana}" guardada con éxito en el historial.`, { titulo: 'Semana guardada', tipo: 'success' });
    if (document.getElementById('seccionHistorial')?.classList.contains('vimar-seccion-activa')) renderizarTablasHistorial();
    actualizarGraficas();
}