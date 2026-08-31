// ============================================================
// EXCEL.JS — Generación de reportes Excel y número a letras
// ============================================================

// ── Número a letras (para ticket imprimible) ─────────────────

function _vimarMenor30(n) {
    const m = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE',
        'DIEZ','ONCE','DOCE','TRECE','CATORCE','QUINCE','DIECISÉIS','DIECISIETE','DIECIOCHO','DIECINUEVE','VEINTE'];
    if (n < 21) return m[n] || '';
    const veintes = ['','VEINTIUNO','VEINTIDÓS','VEINTITRÉS','VEINTICUATRO','VEINTICINCO','VEINTISÉIS','VEINTISIETE','VEINTIOCHO','VEINTINUEVE'];
    return veintes[n % 10] || '';
}

function _vimarMenor100(n) {
    if (n < 30) return _vimarMenor30(n);
    const dec = ['','','VEINTE','TREINTA','CUARENTA','CINCUENTA','SESENTA','SETENTA','OCHENTA','NOVENTA'];
    const un  = ['','UNO','DOS','TRES','CUATRO','CINCO','SEIS','SIETE','OCHO','NUEVE'];
    const u = n % 10;
    return u === 0 ? dec[Math.floor(n/10)] : dec[Math.floor(n/10)] + ' Y ' + un[u];
}

function _vimarMenor1000(n) {
    if (n === 0) return '';
    if (n === 100) return 'CIEN';
    const cent = ['','CIENTO','DOSCIENTOS','TRESCIENTOS','CUATROCIENTOS','QUINIENTOS','SEISCIENTOS','SETECIENTOS','OCHOCIENTOS','NOVECIENTOS'];
    const c = Math.floor(n / 100);
    const r = n % 100;
    return r > 0 ? cent[c] + (c > 0 ? ' ' : '') + _vimarMenor100(r) : cent[c];
}

function vimarNumeroEnteroALetras(n) {
    if (!Number.isFinite(n) || n < 0) return '—';
    n = Math.floor(n);
    if (n === 0) return 'CERO';
    if (n >= 1000000000) return 'CANTIDAD MUY GRANDE';
    let letras = '';
    if (n >= 1000000) {
        const mill = Math.floor(n / 1000000); n %= 1000000;
        letras = mill === 1 ? 'UN MILLÓN' : _vimarMenor1000(mill).trim() + ' MILLONES';
        if (n === 0) return letras;
        letras += ' ';
    }
    if (n >= 1000) {
        const mil = Math.floor(n / 1000); n %= 1000;
        letras += mil === 1 ? 'MIL' : _vimarMenor1000(mil).trim() + ' MIL';
        if (n > 0) letras += ' ';
    }
    if (n > 0) letras += _vimarMenor1000(n).trim();
    return letras.trim();
}

function vimarImporteALetrasMX(monto) {
    const entero   = Math.floor(monto + 1e-9);
    const centavos = Math.min(99, Math.max(0, Math.round((monto - entero) * 100 + 1e-9)));
    return `${vimarNumeroEnteroALetras(entero)} PESOS ${String(centavos).padStart(2,'0')}/100 M.N.`;
}

// ── Excel completo ────────────────────────────────────────────

async function generarExcelCompleto() {
    playSound('excel');
    recalcularTodosSaldosNetoSemanales();

    const semanas        = Object.keys(historialSemanas);
    const semanasGastos  = Object.keys(historialGastosSemanales || {});
    const semanasIngr    = Object.keys(historialIngresosManualesSemanales || {});

    const totalVentasHist   = Object.values(historialSemanas).flat().reduce((a, r) => a + r.Total, 0);
    const totalVentasPend   = registrosPendientes.reduce((a, r) => a + r.Total, 0);
    const totalVentasTicket = ventasTicket.reduce((a, v) => a + v.Total, 0);
    const gastPend          = gastosArray.reduce((a, g) => a + g.monto, 0);
    const ingPend           = ingresosManualesArray.reduce((a, i) => a + i.monto, 0);
    const gastHuerfanos     = sumaGastosHuerfanosHistorial();
    const ingHuerfanos      = sumaIngresosManualesHuerfanosHistorial();
    const saldoTras         = obtenerSaldoNetoTrasSemanasArchivadas();
    const neto              = saldoTras + totalVentasPend + totalVentasTicket - gastPend + ingPend;
    const caja              = getMontoCaja();

    let gastConNom = 0, ingConNom = 0;
    semanas.forEach(nom => {
        gastConNom += sumaGastosPorNombreSemana(nom);
        ingConNom  += sumaIngresosManualesPorNombreSemana(nom);
    });

    const rows = [
        ['--- BALANCE GENERAL DE CAJA ---'],
        ['Concepto', 'Monto ($)'],
        ['Monto en caja', caja],
        ['Total ventas en historial', totalVentasHist],
        ['Gastos archivados con nombre de carpeta de ventas', gastConNom],
        ['Ingresos manuales archivados con nombre de carpeta de ventas', ingConNom],
        ['Gastos archivados sin carpeta homónima', gastHuerfanos],
        ['Ingresos manuales archivados sin carpeta homónima', ingHuerfanos],
        ['Saldo tras semanas archivadas', saldoTras],
        ['Ventas pendientes', totalVentasPend],
        ['Ventas en ticket del día', totalVentasTicket],
        ['Gastos en lista actual', gastPend],
        ['Ingresos manuales en lista actual', ingPend],
        ['SALDO REAL FINAL (NETO)', neto],
        [],
        ['--- EVOLUCIÓN POR SEMANA ---'],
        ['Semana','Saldo inicial','Ventas','Gastos','Ingresos manuales','Saldo final']
    ];

    semanas.forEach(nom => {
        rows.push([nom,
            saldoInicialParaSemana(nom),
            sumaVentasSemanaHistorial(nom),
            sumaGastosPorNombreSemana(nom),
            sumaIngresosManualesPorNombreSemana(nom),
            saldoNetoPorSemana[nom]
        ]);
    });

    rows.push([], ['--- RESUMEN DE VENTAS POR SEMANA (AGRUPADO) ---'], ['Semana','Producto','Cant. Total','Monto Total ($)']);
    semanas.forEach(s => {
        const stats = {};
        historialSemanas[s].forEach(reg =>
            reg.Detalles.forEach(p => {
                if (!stats[p.Producto]) stats[p.Producto] = { c: 0, s: 0 };
                stats[p.Producto].c += p.Cantidad;
                stats[p.Producto].s += p.Subtotal;
            })
        );
        Object.entries(stats).sort((a,b) => b[1].s - a[1].s).forEach(([prod, d]) => rows.push([s, prod, d.c, d.s]));
        rows.push([]);
    });

    rows.push(['--- RESUMEN DE VENTAS POR DÍAS ---'], ['Semana','Día','Total ($)']);
    semanas.forEach(s => historialSemanas[s].forEach(reg => rows.push([s, reg.Día, reg.Total])));
    registrosPendientes.forEach(reg => rows.push(['PENDIENTE', reg.Día, reg.Total]));
    rows.push([]);

    rows.push(['--- DETALLE DE GASTOS (POR SEMANA) ---'], ['Semana','Concepto','Monto ($)']);
    semanasGastos.forEach(s => historialGastosSemanales[s].forEach(g => rows.push([s, g.nombre, g.monto])));
    rows.push([], ['--- GASTOS PENDIENTES ---'], ['Estado','Concepto','Monto ($)']);
    gastosArray.forEach(g => rows.push(['PENDIENTE', g.nombre, g.monto]));
    rows.push([]);

    rows.push(['--- DETALLE DE INGRESOS MANUALES (POR SEMANA) ---'], ['Semana','Concepto','Monto ($)']);
    semanasIngr.forEach(s => (historialIngresosManualesSemanales[s] || []).forEach(i => rows.push([s, i.nombre, i.monto])));
    rows.push([], ['--- INGRESOS MANUALES PENDIENTES ---'], ['Estado','Concepto','Monto ($)']);
    ingresosManualesArray.forEach(i => rows.push(['PENDIENTE', i.nombre, i.monto]));
    rows.push([]);

    rows.push(['--- HISTORIAL DETALLADO DE VENTAS ---'], ['Semana','Día','Producto','Cantidad','Subtotal ($)']);
    semanas.forEach(s =>
        historialSemanas[s].forEach(reg =>
            reg.Detalles.forEach(p => rows.push([s, reg.Día, p.Producto, p.Cantidad, p.Subtotal]))
        )
    );

    _escribirExcel(rows, 'REPORTE VIMAR COMPLETO', `Reporte_VIMAR_${new Date().toLocaleDateString().replace(/\//g,'-')}.xlsx`);
}

async function generarExcelSemana(nombreSemana) {
    if (!historialSemanas[nombreSemana]) {
        playSound('error');
        await mostrarModalAlerta('No hay datos de ventas para esta semana.', { titulo: 'Excel', tipo: 'error' });
        return;
    }
    playSound('excel');
    recalcularTodosSaldosNetoSemanales();

    const s         = nombreSemana;
    const ventas    = sumaVentasSemanaHistorial(s);
    const gastos    = sumaGastosPorNombreSemana(s);
    const ingresos  = sumaIngresosManualesPorNombreSemana(s);
    const saldoIni  = saldoInicialParaSemana(s);
    const netoSem   = saldoNetoPorSemana[s] ?? (saldoIni + ventas + ingresos - gastos);

    const rows = [
        ['--- BALANCE DE ESTA SEMANA ---'],
        ['Semana', s],
        ['Saldo al inicio', saldoIni],
        ['Ventas', ventas],
        ['Gastos archivados con el mismo nombre', gastos],
        ['Ingresos manuales archivados con el mismo nombre', ingresos],
        ['Saldo neto al cierre', netoSem],
        [],
        ['--- RESUMEN DE VENTAS AGRUPADO ---'], ['Semana','Producto','Cant.','Monto ($)']
    ];

    const stats = {};
    historialSemanas[s].forEach(reg =>
        reg.Detalles.forEach(p => {
            if (!stats[p.Producto]) stats[p.Producto] = { c: 0, s: 0 };
            stats[p.Producto].c += p.Cantidad;
            stats[p.Producto].s += p.Subtotal;
        })
    );
    Object.entries(stats).sort((a,b) => b[1].s - a[1].s).forEach(([prod, d]) => rows.push([s, prod, d.c, d.s]));

    rows.push([], ['--- VENTAS POR DÍAS ---'], ['Semana','Día','Total ($)']);
    historialSemanas[s].forEach(reg => rows.push([s, reg.Día, reg.Total]));

    rows.push([], ['--- DETALLE DE GASTOS ---'], ['Semana','Concepto','Monto ($)']);
    (historialGastosSemanales[s] || []).forEach(g => rows.push([s, g.nombre, g.monto]));

    rows.push([], ['--- DETALLE DE INGRESOS MANUALES ---'], ['Semana','Concepto','Monto ($)']);
    (historialIngresosManualesSemanales[s] || []).forEach(i => rows.push([s, i.nombre, i.monto]));

    rows.push([], ['--- HISTORIAL DETALLADO ---'], ['Semana','Día','Producto','Cantidad','Subtotal ($)']);
    historialSemanas[s].forEach(reg =>
        reg.Detalles.forEach(p => rows.push([s, reg.Día, p.Producto, p.Cantidad, p.Subtotal]))
    );

    const safe = s.replace(/[\\/:*?"<>|]/g,'_').substring(0, 40);
    _escribirExcel(rows, 'REPORTE SEMANA', `Reporte_VIMAR_Semana_${safe}_${new Date().toLocaleDateString().replace(/\//g,'-')}.xlsx`);
}

async function _escribirExcel(rows, sheetName, fileName) {
    try {
        const wb   = XLSX.utils.book_new();
        const ws   = XLSX.utils.aoa_to_sheet(rows);
        ws['!cols'] = [{wch:25},{wch:35},{wch:15},{wch:15},{wch:15},{wch:15}];
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, fileName);
    } catch(err) {
        console.error('Error al generar Excel:', err);
        await mostrarModalAlerta('Hubo un error al generar el archivo.', { titulo: 'Excel', tipo: 'error' });
    }
}