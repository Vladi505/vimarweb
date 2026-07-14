// ============================================================
// SECCIÓN: GRÁFICAS Y MÉTRICAS — graficas.js
// ============================================================

let _gBar1 = null, _gBar2 = null, _gLine = null, _gDoughnut = null, _gArea = null;

const _gFiltros = {
    bar1:     { modo: 'general', semana: null, dia: null, metrica: 'ingresos' },
    bar2:     { modo: 'general', semana: null, dia: null, metrica: 'cantidad' },
    line:     { modo: 'general', semana: null, dia: null, metrica: 'ingresos' },
    doughnut: { modo: 'general', semana: null, dia: null, metrica: 'ingresos' },
    area:     { modo: 'general', semana: null, dia: null, metrica: 'ingresos' },
};

function verGraficasMetricas() {
    if (typeof playSound === 'function') playSound('click');
    vimarActivarSeccion('seccionGraficasMetricas');
    localStorage.setItem('vimarSeccionActual', 'graficasMetricas');
    if (document.getElementById('sidebar').classList.contains('active')) toggleSidebar();
    setTimeout(() => renderizarGraficasMetricas(), 80);
}

// ─── Helpers de datos ────────────────────────────────────────

function _gObtenerSemanas() { return Object.keys(historialSemanas); }

function _gObtenerDias(nomSem) {
    if (!historialSemanas[nomSem]) return [];
    return historialSemanas[nomSem].map(r => r.Día);
}

function _gExtraerDetalles(filtro) {
    const { modo, semana, dia } = filtro;
    let detalles = [];
    if (modo === 'especifico-dia' && semana && dia) {
        const reg = (historialSemanas[semana] || []).find(r => r.Día === dia);
        if (reg) detalles = [...reg.Detalles];
    } else if (modo === 'especifico-semana' && semana) {
        (historialSemanas[semana] || []).forEach(r => detalles.push(...r.Detalles));
    } else if (modo === 'dia') {
        if (registrosPendientes.length > 0) {
            detalles = [...registrosPendientes[registrosPendientes.length - 1].Detalles];
        } else {
            const sems = Object.values(historialSemanas);
            if (sems.length > 0) { const u = sems[sems.length-1]; if (u.length > 0) detalles = [...u[u.length-1].Detalles]; }
        }
    } else if (modo === 'semana') {
        if (registrosPendientes.length > 0) {
            registrosPendientes.forEach(r => detalles.push(...r.Detalles));
        } else {
            const sems = Object.values(historialSemanas);
            if (sems.length > 0) sems[sems.length-1].forEach(r => detalles.push(...r.Detalles));
        }
    } else {
        Object.values(historialSemanas).forEach(sem => sem.forEach(r => detalles.push(...r.Detalles)));
        registrosPendientes.forEach(r => detalles.push(...r.Detalles));
    }
    return detalles;
}

function _gAgruparPorProducto(detalles) {
    return detalles.reduce((acc, p) => {
        if (!acc[p.Producto]) acc[p.Producto] = { s: 0, c: 0 };
        acc[p.Producto].s += p.Subtotal;
        acc[p.Producto].c += p.Cantidad;
        return acc;
    }, {});
}

function _gAgruparPorCategoria(detalles) {
    const acc = {};
    detalles.forEach(p => {
        let cat = null;
        for (const [c, data] of Object.entries(categorias)) { if (data.prods.includes(p.Producto)) { cat = c; break; } }
        if (!cat) return; // ignorar productos sin categoría válida
        if (!acc[cat]) acc[cat] = { s: 0, c: 0, color: getComputedStyle(document.documentElement).getPropertyValue(categorias[cat].color.replace('var(','').replace(')','').trim()).trim() || categorias[cat].color };
        acc[cat].s += p.Subtotal;
        acc[cat].c += p.Cantidad;
    });
    return acc;
}

function _gEvolucionDias(filtro) {
    const { modo, semana } = filtro;
    const puntos = [];
    const toItem = r => ({ label: r.Día, s: r.Total, c: r.Detalles.reduce((a,b) => a + b.Cantidad, 0) });
    if (modo === 'especifico-semana' && semana && historialSemanas[semana]) {
        historialSemanas[semana].forEach(r => puntos.push(toItem(r)));
    } else if (modo === 'semana') {
        const fuente = registrosPendientes.length > 0 ? registrosPendientes : (Object.values(historialSemanas).slice(-1)[0] || []);
        fuente.forEach(r => puntos.push(toItem(r)));
    } else {
        Object.entries(historialSemanas).forEach(([nom, dias]) => dias.forEach(r => puntos.push({ label: `${nom}·${r.Día}`, s: r.Total, c: r.Detalles.reduce((a,b)=>a+b.Cantidad,0) })));
        registrosPendientes.forEach(r => puntos.push({ label: `Pend·${r.Día}`, s: r.Total, c: r.Detalles.reduce((a,b)=>a+b.Cantidad,0) }));
    }
    return puntos;
}

// ─── CSS vars ─────────────────────────────────────────────────
function _gCssVar(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }
const _G_PALETTE = ['#00f2ff','#39ff14','#ff3131','#fbff00','#ff9800','#9d50bb','#F09CFF','#795548','#109c82','#3a7bd5'];

// ─── Toggle métrica ───────────────────────────────────────────
function gToggleMetrica(chartId) {
    if (typeof playSound === 'function') playSound('click');
    const f = _gFiltros[chartId];
    f.metrica = f.metrica === 'ingresos' ? 'cantidad' : 'ingresos';
    _gActualizarBtnMetrica(chartId);
    _gRenderChart(chartId);
}

function _gActualizarBtnMetrica(chartId) {
    const btn = document.getElementById(`gBtnMetrica-${chartId}`);
    if (!btn) return;
    const esIngresos = _gFiltros[chartId].metrica === 'ingresos';
    btn.textContent = esIngresos ? '💰 Ventas ($)' : '📦 Cantidad';
    btn.classList.toggle('gm-metrica-ingresos', esIngresos);
    btn.classList.toggle('gm-metrica-cantidad', !esIngresos);
}

// ─── Render ───────────────────────────────────────────────────
function renderizarGraficasMetricas() {
    _rellenarSelectoresSemanas();
    ['bar1','bar2','line','doughnut','area'].forEach(id => _gActualizarBtnMetrica(id));
    _renderBar1(); _renderBar2(); _renderLine(); _renderDoughnut(); _renderArea();
}

function _destroyChart(inst) { try { if (inst) inst.destroy(); } catch(e) {} return null; }

function _gTick() { return _gCssVar('--vimar-chart-tick') || '#fbff00'; }
function _gGrid() { return _gCssVar('--vimar-chart-grid') || 'rgba(255,255,255,0.05)'; }

function _baseOpts(titulo) {
    const tick = _gTick(), grid = _gGrid();
    return {
        maintainAspectRatio: false, responsive: true,
        scales: {
            y: { beginAtZero: true, ticks: { color: tick, font: { size: 11 } }, grid: { color: grid } },
            x: { ticks: { color: tick, font: { size: 10 }, maxRotation: 35 }, grid: { display: false } }
        },
        plugins: {
            legend: { display: false },
            title: { display: true, text: titulo, color: tick, font: { size: 13, weight: 'bold' } }
        }
    };
}

function _baseOptsH(titulo) {
    const tick = _gTick(), grid = _gGrid();
    return {
        indexAxis: 'y', maintainAspectRatio: false, responsive: true,
        scales: {
            x: { beginAtZero: true, ticks: { color: tick, font: { size: 10 } }, grid: { color: grid } },
            y: { ticks: { color: tick, font: { size: 10 } }, grid: { display: false } }
        },
        plugins: { legend: { display: false }, title: { display: true, text: titulo, color: tick, font: { size: 13, weight: 'bold' } } }
    };
}

// 1. Bar vertical
function _renderBar1() {
    const f = _gFiltros.bar1;
    const esI = f.metrica === 'ingresos';
    const detalles = _gExtraerDetalles(f);
    const stats = _gAgruparPorProducto(detalles);
    const top = Object.entries(stats).sort((a,b) => esI ? b[1].s-a[1].s : b[1].c-a[1].c).slice(0,8);
    const ctx = document.getElementById('gBar1'); if (!ctx) return;
    _gBar1 = _destroyChart(_gBar1);
    const color = esI ? (_gCssVar('--vimar-chart-bar-cantidad')||'#39ff14') : (_gCssVar('--vimar-chart-bar-ingresos')||'#00f2ff');
    const titulo = esI ? 'TOP INGRESOS POR PRODUCTO ($)' : 'TOP CANTIDAD VENDIDA POR PRODUCTO';
    _gBar1 = new Chart(ctx, {
        type: 'bar',
        data: { labels: top.map(x=>x[0]), datasets: [{ data: top.map(x=> esI?x[1].s:x[1].c), backgroundColor: color, borderRadius: 6 }] },
        options: { ..._baseOpts(titulo), plugins: { ..._baseOpts(titulo).plugins, tooltip: { callbacks: { label: c => esI ? ` $${c.parsed.y.toFixed(2)}` : ` ${c.parsed.y} uds` } } } }
    });
}

// 2. Bar horizontal
function _renderBar2() {
    const f = _gFiltros.bar2;
    const esI = f.metrica === 'ingresos';
    const detalles = _gExtraerDetalles(f);
    const stats = _gAgruparPorProducto(detalles);
    const top = Object.entries(stats).sort((a,b) => esI ? b[1].s-a[1].s : b[1].c-a[1].c).slice(0,8);
    const ctx = document.getElementById('gBar2'); if (!ctx) return;
    _gBar2 = _destroyChart(_gBar2);
    const color = esI ? (_gCssVar('--vimar-chart-bar-cantidad')||'#39ff14') : (_gCssVar('--vimar-chart-bar-ingresos')||'#00f2ff');
    const titulo = esI ? 'TOP INGRESOS POR PRODUCTO ($)' : 'TOP CANTIDAD VENDIDA POR PRODUCTO';
    _gBar2 = new Chart(ctx, {
        type: 'bar',
        data: { labels: top.map(x=>x[0]), datasets: [{ data: top.map(x=> esI?x[1].s:x[1].c), backgroundColor: color, borderRadius: 6 }] },
        options: { ..._baseOptsH(titulo), plugins: { ..._baseOptsH(titulo).plugins, tooltip: { callbacks: { label: c => esI ? ` $${c.parsed.x.toFixed(2)}` : ` ${c.parsed.x} uds` } } } }
    });
}

// 3. Line
function _renderLine() {
    const f = _gFiltros.line;
    const esI = f.metrica === 'ingresos';
    const puntos = _gEvolucionDias(f);
    const ctx = document.getElementById('gLine'); if (!ctx) return;
    _gLine = _destroyChart(_gLine);
    const color = esI ? (_gCssVar('--vimar-chart-bar-cantidad')||'#39ff14') : (_gCssVar('--vimar-chart-bar-ingresos')||'#00f2ff');
    const titulo = esI ? 'EVOLUCIÓN DE VENTAS POR DÍA ($)' : 'EVOLUCIÓN DE CANTIDAD VENDIDA POR DÍA';
    _gLine = new Chart(ctx, {
        type: 'line',
        data: { labels: puntos.map(p=>p.label), datasets: [{ data: puntos.map(p=> esI?p.s:p.c), borderColor: color, backgroundColor: color+'22', pointBackgroundColor: color, tension: 0.35, fill: false, pointRadius: 4 }] },
        options: { ..._baseOpts(titulo), plugins: { ..._baseOpts(titulo).plugins, legend: { display: false }, tooltip: { callbacks: { label: c => esI ? ` $${c.parsed.y.toFixed(2)}` : ` ${c.parsed.y} uds` } } } }
    });
}

// 4. Doughnut
function _renderDoughnut() {
    const f = _gFiltros.doughnut;
    const esI = f.metrica === 'ingresos';
    const detalles = _gExtraerDetalles(f);
    const stats = _gAgruparPorCategoria(detalles);
    const entries = Object.entries(stats).sort((a,b) => esI ? b[1].s-a[1].s : b[1].c-a[1].c);
    const ctx = document.getElementById('gDoughnut'); if (!ctx) return;
    _gDoughnut = _destroyChart(_gDoughnut);
    const tick = _gTick();
    const titulo = esI ? 'DISTRIBUCIÓN POR CATEGORÍA ($)' : 'DISTRIBUCIÓN POR CATEGORÍA (CANTIDAD)';
    _gDoughnut = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: entries.map(e=>e[0]), datasets: [{ data: entries.map(e=> esI?e[1].s:e[1].c), backgroundColor: entries.map(e=>e[1].color||'#888'), borderWidth: 2, borderColor: 'rgba(0,0,0,0.3)' }] },
        options: {
            maintainAspectRatio: false, responsive: true,
            plugins: {
                legend: { display: true, position: 'bottom', labels: { color: tick, font: { size: 10 }, boxWidth: 12, padding: 8 } },
                title: { display: true, text: titulo, color: tick, font: { size: 13, weight: 'bold' } },
                tooltip: { callbacks: { label: c => esI ? ` ${c.label}: $${c.parsed.toFixed(2)}` : ` ${c.label}: ${c.parsed} uds` } }
            }
        }
    });
}

// 5. Area
function _renderArea() {
    const f = _gFiltros.area;
    const esI = f.metrica === 'ingresos';
    const puntos = _gEvolucionDias(f);
    let acum = 0;
    const acumData = puntos.map(p => { acum += esI ? p.s : p.c; return acum; });
    const ctx = document.getElementById('gArea'); if (!ctx) return;
    _gArea = _destroyChart(_gArea);
    const color = esI ? '#F09CFF' : '#fbff00';
    const titulo = esI ? 'TENDENCIA ACUMULADA DE VENTAS ($)' : 'TENDENCIA ACUMULADA DE CANTIDAD';
    _gArea = new Chart(ctx, {
        type: 'line',
        data: { labels: puntos.map(p=>p.label), datasets: [{ data: acumData, borderColor: color, backgroundColor: color+'33', tension: 0.4, fill: true, pointRadius: 3, pointBackgroundColor: color }] },
        options: { ..._baseOpts(titulo), plugins: { ..._baseOpts(titulo).plugins, legend: { display: false }, tooltip: { callbacks: { label: c => esI ? ` Acum: $${c.parsed.y.toFixed(2)}` : ` Acum: ${c.parsed.y} uds` } } } }
    });
}

// ─── Filtros de periodo ───────────────────────────────────────
function _rellenarSelectoresSemanas() {
    const semanas = Object.keys(historialSemanas);
    ['bar1','bar2','line','doughnut','area'].forEach(id => {
        const selSem = document.getElementById(`gSel-${id}-semana`);
        const selDia = document.getElementById(`gSel-${id}-dia`);
        if (!selSem) return;
        selSem.innerHTML = '<option value="">— Semana —</option>';
        semanas.forEach(s => { const o = document.createElement('option'); o.value=s; o.textContent=s; selSem.appendChild(o); });
        if (selDia) selDia.innerHTML = '<option value="">— Día —</option>';
    });
}

function gCambiarFiltro(chartId, modo) {
    if (typeof playSound === 'function') playSound('click');
    _gFiltros[chartId].modo = modo;
    document.querySelectorAll(`.g-filtro-btn[data-chart="${chartId}"]`).forEach(b => b.classList.toggle('activo', b.dataset.modo === modo));
    const rowSem = document.getElementById(`gRow-${chartId}-semana`);
    const rowDia = document.getElementById(`gRow-${chartId}-dia`);
    if (rowSem) rowSem.style.display = (modo === 'especifico-semana' || modo === 'especifico-dia') ? '' : 'none';
    if (rowDia) rowDia.style.display = modo === 'especifico-dia' ? '' : 'none';
    _gRenderChart(chartId);
}

function gCambiarSemana(chartId) {
    const sel = document.getElementById(`gSel-${chartId}-semana`); if (!sel) return;
    _gFiltros[chartId].semana = sel.value || null;
    _gFiltros[chartId].dia = null;
    const selDia = document.getElementById(`gSel-${chartId}-dia`);
    if (selDia) {
        selDia.innerHTML = '<option value="">— Día —</option>';
        _gObtenerDias(sel.value).forEach(d => { const o=document.createElement('option'); o.value=d; o.textContent=d; selDia.appendChild(o); });
    }
    _gRenderChart(chartId);
}

function gCambiarDia(chartId) {
    const sel = document.getElementById(`gSel-${chartId}-dia`); if (!sel) return;
    _gFiltros[chartId].dia = sel.value || null;
    _gRenderChart(chartId);
}

function _gRenderChart(chartId) {
    switch(chartId) {
        case 'bar1': _renderBar1(); break;
        case 'bar2': _renderBar2(); break;
        case 'line': _renderLine(); break;
        case 'doughnut': _renderDoughnut(); break;
        case 'area': _renderArea(); break;
    }
}