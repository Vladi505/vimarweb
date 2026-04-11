// --- INTERFAZ DE USUARIO (UI) Y EVENTOS ---

const VIMAR_IDS_SECCION = [
    'seccionPrincipal',
    'seccionHistorial',
    'seccionHistorialIngresosManuales',
    'seccionHistorialGastos',
    'seccionStocks',
    'seccionHistorialInventario'
];

function vimarActivarSeccionPrincipal() {
    VIMAR_IDS_SECCION.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.remove('vimar-seccion-activa', 'vimar-seccion-principal-activa');
    });
    const p = document.getElementById('seccionPrincipal');
    if (p) p.classList.add('vimar-seccion-principal-activa');
}

function vimarActivarSeccion(id) {
    VIMAR_IDS_SECCION.forEach(sid => {
        const el = document.getElementById(sid);
        if (!el) return;
        el.classList.remove('vimar-seccion-activa', 'vimar-seccion-principal-activa');
    });
    const t = document.getElementById(id);
    if (t) t.classList.add('vimar-seccion-activa');
}

// Helper: abre/cierra carpeta animada
function toggleCarpeta(header, cuerpo, caret) {
    const estaAbierto = !cuerpo.classList.contains('oculto');
    cuerpo.classList.toggle('oculto');
    header.classList.toggle('abierto', !estaAbierto);
    if (caret) {
        caret.classList.toggle('vimar-caret-carpeta--expandido', !cuerpo.classList.contains('oculto'));
    }
}

function renderizarCatalogo() {
    const div = document.getElementById('catalogo'); div.innerHTML = "";
    for (const [cat, data] of Object.entries(categorias)) {
        const sec = document.createElement('div');
        sec.className = 'categoria-contenedor';
        sec.dataset.categoriaNombre = cat.toLowerCase();
        sec.innerHTML = `<div class="categoria-titulo categoria-titulo--accent" style="--categoria-accent:${data.color}">${cat}</div>`;
        const grid = document.createElement('div'); grid.className = 'grid-productos';
            
        data.prods.sort().forEach(p => {
            const card = document.createElement('div'); 
            card.className = 'producto-card producto-card--accent';
            card.dataset.nombre = p.toLowerCase();
            card.style.setProperty('--producto-accent', data.color);
                
            // Lógica de alerta de Stock
            const stockActual = stockProductos[p];
            let alertaHTML = "";
            if (stockActual <= 5) {
                alertaHTML = `<br><span class="producto-card-alerta-stock">Bajo en Stock (${stockActual})</span>`;
                card.classList.add('bajo-stock');
            }

            card.innerHTML = `<span>${p}${alertaHTML}</span>`;

            card.onmouseenter = () => {
                playSound('hover');
            };

            card.onclick = (e) => {
                playSound('click');
                confirmarVisualAgregado(e.currentTarget);
                agregarALista(p, cat);
            };

            grid.appendChild(card);
        });
        sec.appendChild(grid); div.appendChild(sec);
    }
}

function agregarALista(nombre, cat) {
    const tbody = document.getElementById('cuerpoVenta');
    const esArt = (cat === "Artículos");
    let f = document.createElement('tr');
    f.className = 'fila-nueva';
    f.innerHTML = `
        <td class="td-producto"><span>${nombre}</span></td>
        <td class="td-cantidad"><input type="number" class="litros ticket-input" placeholder="0" value="${esArt?1:''}" oninput="recalcularFila(this)"></td>
        <td class="td-pu"><input type="number" class="precio-unit ticket-input" placeholder="0" value="${esArt?baseArticulos[nombre]:''}" oninput="cambiarAManual(this)"></td>
        <td class="td-total"><input type="number" class="total-fila ticket-input total-auto" placeholder="0" value="${esArt?baseArticulos[nombre].toFixed(2):''}" oninput="cambiarAManual(this)"></td>
        <td class="td-accion"><button class="delete-btn" onclick="confirmarBorrado(this, '${nombre}')">✕</button></td>`;
    tbody.appendChild(f); calcularTodo();
    const b = document.getElementById('inputBusqueda'); b.value = ""; filtrarCatalogo(); b.focus();
}

function confirmarVisualAgregado(cardElement) {
    if (!cardElement) return;
    cardElement.classList.add('added');
    setTimeout(() => cardElement.classList.remove('added'), 500);
}

function recalcularFila(input) {
    const fila = input.parentElement.parentElement;
    const nombre = fila.querySelector('.td-producto').innerText;
    const it = fila.querySelector('.total-fila'), ip = fila.querySelector('.precio-unit');
    const cant = parseFloat(input.value);

    if (isNaN(cant) || cant <= 0) { 
        it.value = ""; 
        ip.value = ""; 
    } else {
        [input, it, ip].forEach(el => el.classList.remove('input-error'));
        let calculado = false;

        // 1. LÓGICA PARA LÍQUIDOS (Múltiplos de 3 o específicos)
        if (preciosLiquidos[nombre]) {
            const lp = preciosLiquidos[nombre];
            let precioFinal = null;

            // Primero buscamos si existe el precio exacto para esa cantidad (ej: lp[10])
            if (lp[cant]) {
                precioFinal = lp[cant];
            } 
            // Si no, verificamos si es múltiplo de 3 para aplicar la regla proporcional
            else if (cant % 3 === 0) {
                // Usamos el precio de 3 litros como base para calcular el múltiplo
                precioFinal = (lp[3] / 3) * cant; 
            }

            if (precioFinal) {
                it.value = precioFinal.toFixed(2);
                ip.value = (precioFinal / cant).toFixed(2);
                calculado = true;
            } else {
                // Si es líquido pero no es múltiplo de 3 ni tiene precio, limpiamos para evitar errores
                it.value = "";
                ip.value = "";
            }
        } 
        // 2. LÓGICA PARA PROMOCIONES DE ARTÍCULOS
        else if (promosArticulos[nombre] && promosArticulos[nombre][cant]) {
            let pb = promosArticulos[nombre][cant]; 
            it.value = pb.toFixed(2); 
            ip.value = (pb / cant).toFixed(2); 
            calculado = true;
        } 
        // 3. LÓGICA PARA ARTÍCULOS POR UNIDAD
        else if (baseArticulos[nombre]) {
            let vPU = baseArticulos[nombre]; 
            it.value = (cant * vPU).toFixed(2); 
            ip.value = vPU.toFixed(2); 
            calculado = true;
        }

        if (calculado) {
            it.classList.replace('total-manual', 'total-auto');
        } else {
            it.classList.replace('total-auto', 'total-manual');
        }
    }
    calcularTodo();
}

function filtrarCatalogo() {
    const query = document.getElementById('inputBusqueda').value.toLowerCase().trim();
    const contenedores = document.querySelectorAll('.categoria-contenedor');
    contenedores.forEach(contenedor => {
        const nombreCat = contenedor.dataset.categoriaNombre;
        const coincideCat = nombreCat.includes(query);
        const cards = contenedor.querySelectorAll('.producto-card');
        let algunProductoVisible = false;
        cards.forEach(card => {
            const nombreProd = card.dataset.nombre;
            if (coincideCat || nombreProd.includes(query)) {
                card.classList.remove('vimar-filtro-oculto');
                algunProductoVisible = true;
            } else {
                card.classList.add('vimar-filtro-oculto');
            }
        });
        contenedor.classList.toggle('vimar-filtro-oculto', !(algunProductoVisible || coincideCat));
    });
    focusElement = null;
    removerTodosLosFocus();
}

function toggleSidebar() {
    playSound('sidebar');
    document.getElementById('sidebar').classList.toggle('active');
    document.getElementById('overlay').classList.toggle('active');
    document.getElementById('menuBtn').classList.toggle('active');
}

function renderizarListaVentasTicket() {
    const cont = document.getElementById('listaVentasTicket');
    if (!cont) return;
    cont.innerHTML = "";
 
    if (ventasTicket.length === 0) {
        cont.classList.remove('lista-ventas-ticket--visible');
        return;
    }
 
    const totalAcumulado = ventasTicket.reduce((a, v) => a + v.Total, 0);
    cont.classList.add('lista-ventas-ticket--visible');
 
    const header = document.createElement('div');
    header.className = "ventas-ticket-header";
    header.innerHTML = `
        <span class="ventas-ticket-titulo">
            <i class="fas fa-receipt"></i> VENTAS DEL DÍA
            <span class="ventas-ticket-contador">${ventasTicket.length}</span>
        </span>
        <span class="ventas-ticket-total">$${totalAcumulado.toFixed(2)}</span>
    `;
    cont.appendChild(header);
 
    const lista = document.createElement('div');
    lista.className = "ventas-ticket-lista";
 
    [...ventasTicket].reverse().forEach((venta, idxRev) => {
        const idx = ventasTicket.length - 1 - idxRev;
 
        const item = document.createElement('div');
        item.className = "venta-ticket-item item-nuevo";
        item.style.setProperty('--vimar-stagger-delay', `${idxRev * 40}ms`);
 
        // Cabecera de la venta (hora + botones acción)
        const itemHeader = document.createElement('div');
        itemHeader.className = "venta-ticket-item-header";
        itemHeader.innerHTML = `
            <span class="venta-ticket-hora"><i class="fas fa-clock"></i> Venta ${ventasTicket.length - idxRev} &nbsp;·&nbsp; ${venta.hora}</span>
            <div class="venta-ticket-header-actions">
                <button type="button" class="btn-ticket-venta-ticket" onclick="generarTicketVentaTicket(${idx})" title="Generar ticket imprimible">
                    🖨️
                </button>
                <button class="btn-delete-venta-ticket" onclick="eliminarVentaTicket(${idx})" title="Eliminar venta">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        item.appendChild(itemHeader);
 
        // Tabla de productos
        const tabla = document.createElement('table');
        tabla.className = "venta-ticket-tabla";
        tabla.innerHTML = `
            <thead>
                <tr>
                    <th class="vtt-col-prod">PRODUCTO</th>
                    <th class="vtt-col-num">CANT.</th>
                    <th class="vtt-col-num">P.U.</th>
                    <th class="vtt-col-num">TOTAL</th>
                    <th class="vtt-col-acc"></th>
                </tr>
            </thead>
        `;
        const tbodyVtt = document.createElement('tbody');
        venta.Detalles.forEach((p, idxProd) => {
            const pu = p.Cantidad ? p.Subtotal / p.Cantidad : 0;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="vtt-td-prod">${p.Producto}</td>
                <td class="vtt-td-num">${p.Cantidad}</td>
                <td class="vtt-td-num">$${pu.toFixed(2)}</td>
                <td class="vtt-td-num vtt-td-subtotal">$${p.Subtotal.toFixed(2)}</td>
                <td class="vtt-td-acc">
                    <button type="button" onclick="editarDatoProductoVentaTicket(${idx}, ${idxProd})" class="btn-edit-small" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                    <button type="button" onclick="eliminarProductoVentaTicket(${idx}, ${idxProd})" class="btn-delete-prod" title="Eliminar línea"><i class="fas fa-trash-alt"></i></button>
                </td>`;
            tbodyVtt.appendChild(tr);
        });
        tabla.appendChild(tbodyVtt);
        item.appendChild(tabla);
 
        // Subtotal de la venta
        const subtotalRow = document.createElement('div');
        subtotalRow.className = "venta-ticket-subtotal";
        subtotalRow.innerHTML = `
            <span>SUBTOTAL VENTA</span>
            <span class="venta-ticket-subtotal-monto">$${venta.Total.toFixed(2)}</span>
        `;
        item.appendChild(subtotalRow);
 
        lista.appendChild(item);
    });
 
    cont.appendChild(lista);
}

function actualizarGastosUI() {
    const c = document.getElementById('listaGastosUI'); 
    if (!c) return;
    
    c.innerHTML = "";
    gastosArray.forEach((g, i) => { 
        const item = document.createElement('div');
        item.className = 'item-nuevo lista-gasto-ingreso-item';
        item.style.setProperty('--vimar-stagger-delay', `${i * 45}ms`);
        item.innerHTML = `
            <span class="lista-gasto-ingreso-texto">• ${g.nombre}: <b class="monto-ui-gasto">- $${g.monto.toFixed(2)}</b></span>
            <button class="delete-btn" onclick="borrarGasto(${i})">✕</button>
        `;
        c.appendChild(item);
    });

    // Controlar visibilidad del botón de guardado (asumiendo que tiene id 'btnGuardarGastosSemana')
    const btnGuardar = document.getElementById('btnGuardarGastosSemana');
    if (btnGuardar) {
        btnGuardar.classList.toggle('vimar-btn-guardar-semana-visible', gastosArray.length > 0);
    }
}

function actualizarIngresosManualesUI() {
    const c = document.getElementById('listaIngresosManualesUI');
    if (!c) return;

    c.innerHTML = "";
    ingresosManualesArray.forEach((i, idx) => {
        const item = document.createElement('div');
        item.className = 'item-nuevo lista-gasto-ingreso-item';
        item.style.setProperty('--vimar-stagger-delay', `${idx * 45}ms`);
        item.innerHTML = `
            <span class="lista-gasto-ingreso-texto">• ${i.nombre}: <b class="monto-ui-ingreso">+ $${i.monto.toFixed(2)}</b></span>
            <button class="delete-btn" onclick="borrarIngresoManual(${idx})">✕</button>
        `;
        c.appendChild(item);
    });

    const btnGuardar = document.getElementById('btnGuardarIngresosManualesSemana');
    if (btnGuardar) {
        btnGuardar.classList.toggle('vimar-btn-guardar-semana-visible', ingresosManualesArray.length > 0);
    }
}

function verHistorialGastos() {
    playSound('click');
    vimarActivarSeccion('seccionHistorialGastos');
    renderizarHistorialGastos();
    localStorage.setItem('vimarSeccionActual', 'historialGastos');
        
    if (document.getElementById('sidebar').classList.contains('active')) {
        toggleSidebar();
    }
}

function verHistorialIngresosManuales() {
    playSound('click');
    vimarActivarSeccion('seccionHistorialIngresosManuales');
    renderizarHistorialIngresosManuales();
    localStorage.setItem('vimarSeccionActual', 'historialIngresosManuales');

    if (document.getElementById('sidebar').classList.contains('active')) {
        toggleSidebar();
    }
}

function renderizarTablasHistorial() {
    const cont = document.getElementById('contenedorTablasHistorial');
    if (!cont) return;
    
    cont.innerHTML = "";
    const semanas = Object.keys(historialSemanas);
    
    if (semanas.length === 0 && registrosPendientes.length === 0) {
        cont.innerHTML = "<h3 class='historial-vacio'>No hay semanas registradas...</h3>"; 
        return; 
    }

    // --- DÍAS TEMPORALES (registrosPendientes aún no archivados en semana) ---
    if (registrosPendientes.length > 0) {
        const divTemporal = document.createElement('div');
        divTemporal.className = "card-semana card-semana-temporal";

        const totalTemporal = registrosPendientes.reduce((a, r) => a + r.Total, 0);

        divTemporal.innerHTML = `
            <div class="header-semana header-semana-temporal">
                <div class="titulo-semana">
                    <i class="fas fa-caret-right vimar-caret-carpeta"></i>
                    <i class="fas fa-folder-open"></i>
                    <span> Días sin archivar</span>
                </div>
                <div class="vimar-hist-header-row">
                    <span class="total-semana-dinero total-semana-temporal">$${totalTemporal.toFixed(2)}</span>
                </div>
            </div>
            <div class="contenido-semana oculto vimar-scroll-ventas" id="cuerpoTemporal"></div>
        `;

        const headerTemporal = divTemporal.querySelector('.header-semana-temporal');
        headerTemporal.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const cuerpo = headerTemporal.nextElementSibling;
            const caret = headerTemporal.querySelector('.fa-caret-right');
            if (cuerpo) toggleCarpeta(headerTemporal, cuerpo, caret);
        });

        const cuerpoTemp = divTemporal.querySelector('#cuerpoTemporal');

        registrosPendientes.forEach((reg, idxReg) => {
            const tablaContenedor = document.createElement('div');
            tablaContenedor.className = "contenedor-dia";

            tablaContenedor.innerHTML = `
                <div class="header-dia">
                    <span class="label-dia">
                        <i class="fas fa-calendar-day"></i> ${reg.Día}
                        <button onclick="event.stopPropagation(); editarNombreRegistroPendiente(${idxReg})" class="btn-edit-small" title="Editar nombre del día"><i class="fas fa-pencil-alt"></i></button>
                        <button onclick="event.stopPropagation(); eliminarDiaTemporal(${idxReg})" class="btn-delete-small" title="Eliminar día"><i class="fas fa-trash"></i></button>
                    </span>
                    <span class="subtotal-dia">Subtotal: $${reg.Total.toFixed(2)}</span>
                </div>
            `;

            const tabla = document.createElement('table');
            tabla.className = "tabla-historial-vimar";
            tabla.innerHTML = `
                <thead>
                    <tr>
                        <th class="th-hist-prod th-hist-prod--w34">PROD.</th>
                        <th class="th-hist-cant th-hist-cant--w12">CANT.</th>
                        <th class="th-hist-pu th-hist-pu--w16">P.U.</th>
                        <th class="th-hist-total th-hist-total--w16">TOTAL</th>
                        <th class="th-hist-acc"></th>
                    </tr>
                </thead>`;

            const tbody = document.createElement('tbody');
            reg.Detalles.forEach((prod, idxProd) => {
                const pu = prod.Cantidad ? prod.Subtotal / prod.Cantidad : 0;
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="td-hist-producto">${prod.Producto}</td>
                    <td class="col-cantidad">${prod.Cantidad}</td>
                    <td class="col-pu">$${pu.toFixed(2)}</td>
                    <td class="col-total-prod">$${prod.Subtotal.toFixed(2)}</td>
                    <td class="td-hist-acciones">
                        <button onclick="editarDatoProductoPendiente(${idxReg}, ${idxProd})" class="btn-edit-small" title="Editar"><i class="fas fa-pencil-alt"></i></button>
                        <button onclick="eliminarProductoPendiente(${idxReg}, ${idxProd})" class="btn-delete-prod" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                    </td>`;
                tbody.appendChild(tr);
            });

            tabla.appendChild(tbody);
            tablaContenedor.appendChild(tabla);
            cuerpoTemp.appendChild(tablaContenedor);
        });

        cont.appendChild(divTemporal);
    }

    semanas.reverse().forEach((nomSem, semIdx) => {
        const dias = historialSemanas[nomSem];
        const totalSemana = dias.reduce((a, b) => a + b.Total, 0);

        const divSemana = document.createElement('div');
        divSemana.className = "card-semana item-nuevo";
        divSemana.style.setProperty('--vimar-stagger-delay', `${semIdx * 50}ms`);
        
        divSemana.innerHTML = `
            <div class="header-semana">                
                <div class="titulo-semana">
                    <i class="fas fa-caret-right vimar-caret-carpeta"></i>
                    <i class="fas fa-folder-open"></i> 
                    <span>${nomSem}</span>
                    <button type="button" class="btn-edit-small btn-week-rename" title="Renombrar semana">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button type="button" class="btn-excel-small btn-week-excel" title="Excel de esta semana">
                        <i class="fas fa-file-excel"></i>
                    </button>
                </div>
                <div class="vimar-hist-header-row">
                    <span class="total-semana-dinero">$${totalSemana.toFixed(2)}</span>
                    <button type="button" class="delete-btn btn-week-delete" title="Eliminar semana">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="contenido-semana oculto vimar-scroll-ventas"></div>
        `;

        const headerSem = divSemana.querySelector('.header-semana');
        headerSem.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const cuerpoEl = headerSem.nextElementSibling;
            const caret = headerSem.querySelector('.fa-caret-right');
            if (cuerpoEl) toggleCarpeta(headerSem, cuerpoEl, caret);
        });
        divSemana.querySelector('.btn-week-rename').addEventListener('click', (e) => {
            e.stopPropagation();
            editarNombreSemana(nomSem);
        });
        divSemana.querySelector('.btn-week-excel').addEventListener('click', (e) => {
            e.stopPropagation();
            generarExcelSemana(nomSem);
        });
        divSemana.querySelector('.btn-week-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            eliminarSemanaCompleta(nomSem);
        });

        const cuerpo = divSemana.querySelector('.contenido-semana');

        dias.forEach((reg, idxReg) => {
            const tablaContenedor = document.createElement('div');
            tablaContenedor.className = "contenedor-dia";
            
            tablaContenedor.innerHTML = `
                <div class="header-dia">
                    <span class="label-dia">
                        <i class="fas fa-calendar-day"></i> ${reg.Día} 
                        <button onclick="editarNombreRegistro('${nomSem}', ${idxReg})" class="btn-edit-small"><i class="fas fa-pencil-alt"></i></button>
                        <button onclick="eliminarRegistroDia('${nomSem}', ${idxReg})" class="btn-delete-small"><i class="fas fa-trash"></i></button>
                    </span>
                    <span class="subtotal-dia">Subtotal: $${reg.Total.toFixed(2)}</span>
                </div>
            `;
                
            const tabla = document.createElement('table');
            tabla.className = "tabla-historial-vimar";
            
            tabla.innerHTML = `
                <thead>
                    <tr>
                        <th class="th-hist-prod th-hist-prod--w40">PROD.</th>
                        <th class="th-hist-cant th-hist-cant--w15">CANT.</th>
                        <th class="th-hist-pu th-hist-pu--w20">P.U.</th>
                        <th class="th-hist-total th-hist-total--w20">TOTAL</th>
                        <th class="th-hist-acc"></th> </tr>
                </thead>`;
            
            const tbody = document.createElement('tbody');
            reg.Detalles.forEach((prod, idxProd) => {
                const pu = prod.Subtotal / prod.Cantidad;
                const tr = document.createElement('tr');
                
                tr.innerHTML = `
                    <td class="td-hist-producto">${prod.Producto}</td>
                    <td class="col-cantidad">${prod.Cantidad}</td>
                    <td class="col-pu">$${pu.toFixed(2)}</td>
                    <td class="col-total-prod">$${prod.Subtotal.toFixed(2)}</td>
                    <td class="td-hist-acciones">
                        <button onclick="editarDatoProducto('${nomSem}', ${idxReg}, ${idxProd})" class="btn-edit-small">
                            <i class="fas fa-pencil-alt"></i>
                        </button>
                        <button onclick="eliminarProductoUnico('${nomSem}', ${idxReg}, ${idxProd})" class="btn-delete-prod">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </td>`;
                tbody.appendChild(tr);
            });
            
            tabla.appendChild(tbody);
            tablaContenedor.appendChild(tabla);
            cuerpo.appendChild(tablaContenedor);
        });
        cont.appendChild(divSemana);
    });
}

function renderizarHistorialGastos() {
    const cont = document.getElementById('contenedorHistorialGastos');
    if (!cont) return;
    cont.innerHTML = "";
    
    const semanas = Object.keys(historialGastosSemanales);

    if (semanas.length === 0) {
        cont.classList.add('vimar-contenedor-historial-semanas--solo-mensaje');
        cont.innerHTML = "<h3 class='historial-subseccion-vacio'>No hay registros de gastos...</h3>";
        return;
    }
    cont.classList.remove('vimar-contenedor-historial-semanas--solo-mensaje');

    semanas.reverse().forEach(nomSem => {
        const gastos = historialGastosSemanales[nomSem];
        const total = gastos.reduce((a, b) => a + b.monto, 0);

        const divSemana = document.createElement('div');
        divSemana.className = 'card-historial-gasto-semana';
        
        divSemana.innerHTML = `
            <div class="header-semana header-toggle-gastos js-toggle-gastos">
                <div class="header-toggle-gastos__izq">
                    <i class="fas fa-caret-right vimar-caret-carpeta header-toggle-gastos__caret"></i>
                    <span class="header-toggle-gastos__titulo">
                        <i class="fas fa-folder-open"></i> ${nomSem}
                    </span>
                    <button onclick="event.stopPropagation(); editarNombreSemanaGasto('${nomSem}')" class="btn-edit-small btn-edit-semana-header" title="Editar Nombre">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                </div>

                <div class="header-toggle-gastos__der">
                    <span class="header-toggle-gastos__total">
                        $${total.toFixed(2)}
                    </span>
                    <button onclick="event.stopPropagation(); eliminarSemanaGastos('${nomSem}')" class="delete-btn btn-delete-semana-header" title="Eliminar Semana Completa">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div class="contenido-semana oculto vimar-scroll-rojo contenido-historial-gasto-inner">
                <table class="tabla-historial-vimar tabla-historial-vimar--full">
                    <thead>
                        <tr class="hist-gasto-thead-row">
                            <th class="hist-gasto-th hist-gasto-th--left">Concepto</th>
                            <th class="hist-gasto-th hist-gasto-th--right">Monto</th>
                            <th class="th-hist-acc"></th> </tr>
                    </thead>
                    <tbody class="hist-gasto-tbody">
                        ${gastos.map((g, idx) => `
                            <tr class="hist-gasto-fila">
                                <td class="hist-gasto-concepto">${g.nombre}</td>
                                <td class="hist-gasto-monto">$${g.monto.toFixed(2)}</td>
                                <td class="hist-gasto-celda-acciones">
                                    <button onclick="editarGastoIndividual('${nomSem}', ${idx})" class="btn-edit-small btn-accion-tabla-mini">
                                        <i class="fas fa-pencil-alt"></i>
                                    </button>
                                    <button onclick="eliminarGastoHistorial('${nomSem}', ${idx})" class="btn-delete-small btn-delete-historial-fila">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        cont.appendChild(divSemana);

        const headerGasto = divSemana.querySelector('.js-toggle-gastos');
        const caret = headerGasto.querySelector('.fa-caret-right');
        headerGasto.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const cuerpo = headerGasto.nextElementSibling;
            if (cuerpo) toggleCarpeta(headerGasto, cuerpo, caret);
        });
    });
}

function renderizarHistorialIngresosManuales() {
    const cont = document.getElementById('contenedorHistorialIngresosManuales');
    if (!cont) return;
    cont.innerHTML = "";

    const semanas = Object.keys(historialIngresosManualesSemanales);

    if (semanas.length === 0) {
        cont.classList.add('vimar-contenedor-historial-semanas--solo-mensaje');
        cont.innerHTML = "<h3 class='historial-subseccion-vacio'>No hay registros de ingresos manuales...</h3>";
        return;
    }
    cont.classList.remove('vimar-contenedor-historial-semanas--solo-mensaje');

    semanas.reverse().forEach(nomSem => {
        const ingresos = historialIngresosManualesSemanales[nomSem] || [];
        const total = ingresos.reduce((a, b) => a + b.monto, 0);

        const divSemana = document.createElement('div');
        divSemana.className = 'card-historial-gasto-semana';

        divSemana.innerHTML = `
            <div class="header-semana header-toggle-ingresos-manuales js-toggle-ingresos-manuales">
                <div class="header-toggle-gastos__izq">
                    <i class="fas fa-caret-right vimar-caret-carpeta header-toggle-ingresos-manuales__caret"></i>
                    <span class="header-toggle-ingresos-manuales__titulo">
                        <i class="fas fa-folder-open"></i> ${nomSem}
                    </span>
                    <button onclick="event.stopPropagation(); editarNombreSemanaIngresoManual('${nomSem}')" class="btn-edit-small btn-edit-semana-header" title="Editar Nombre">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                </div>

                <div class="header-toggle-gastos__der">
                    <span class="header-toggle-ingresos-manuales__total">
                        $${total.toFixed(2)}
                    </span>
                    <button onclick="event.stopPropagation(); eliminarSemanaIngresosManuales('${nomSem}')" class="delete-btn btn-delete-semana-header" title="Eliminar Semana Completa">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <div class="contenido-semana oculto vimar-scroll-ingresos contenido-historial-gasto-inner">
                <table class="tabla-historial-vimar tabla-historial-vimar--full">
                    <thead>
                        <tr class="hist-ingreso-thead-row">
                            <th class="hist-ingreso-th hist-ingreso-th--left">Concepto</th>
                            <th class="hist-ingreso-th hist-ingreso-th--right">Monto</th>
                            <th class="th-hist-acc"></th> 
                        </tr>
                    </thead>
                    <tbody class="hist-gasto-tbody">
                        ${ingresos.map((g, idx) => `
                            <tr class="hist-gasto-fila">
                                <td class="hist-gasto-concepto">${g.nombre}</td>
                                <td class="hist-gasto-monto">$${g.monto.toFixed(2)}</td>
                                <td class="hist-gasto-celda-acciones">
                                    <button onclick="editarIngresoManualIndividual('${nomSem}', ${idx})" class="btn-edit-small btn-accion-tabla-mini">
                                        <i class="fas fa-pencil-alt"></i>
                                    </button>
                                    <button onclick="eliminarIngresoManualHistorial('${nomSem}', ${idx})" class="btn-delete-small btn-delete-historial-fila">
                                        <i class="fas fa-trash-alt"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        cont.appendChild(divSemana);

        const headerIngreso = divSemana.querySelector('.js-toggle-ingresos-manuales');
        const caret = headerIngreso.querySelector('.fa-caret-right');
        headerIngreso.addEventListener('click', (e) => {
            if (e.target.closest('button')) return;
            const cuerpo = headerIngreso.nextElementSibling;
            if (cuerpo) toggleCarpeta(headerIngreso, cuerpo, caret);
        });
    });
}

function cambiarFiltroGrafica(tipo) {
    playSound('click');
    filtroGraficaActual = tipo;
    localStorage.setItem('vimarFiltroGrafica', tipo);
    actualizarVisualFiltrosGrafica();
    actualizarGraficas();
}

function actualizarVisualFiltrosGrafica() {
    const tipo = filtroGraficaActual;
    document.querySelectorAll('.btn-filtro-vimar').forEach(btn => btn.classList.remove('activo'));
    
    if(tipo === 'dia') document.getElementById('btnFiltroDia')?.classList.add('activo');
    if(tipo === 'semana') document.getElementById('btnFiltroSemana')?.classList.add('activo');
    if(tipo === 'general') document.getElementById('btnFiltroGeneral')?.classList.add('activo');
}

function actualizarGraficas() {
    let productosFiltrados = [];

    const todasLasSemanas = Object.values(historialSemanas);
    const ultimaSemanaObj = todasLasSemanas[todasLasSemanas.length - 1] || [];
    const ultimoRegistroPendiente = registrosPendientes[registrosPendientes.length - 1];

    if (filtroGraficaActual === 'dia') {
        // Solo el último día que se guardó (esté en pendientes o en la última semana)
        if (registrosPendientes.length > 0) {
            productosFiltrados = [...ultimoRegistroPendiente.Detalles];
        } else if (ultimaSemanaObj.length > 0) {
            productosFiltrados = [...ultimaSemanaObj[ultimaSemanaObj.length - 1].Detalles];
        }
    } 
    else if (filtroGraficaActual === 'semana') {
        // Prioridad a la semana actual en curso (pendientes) + última cerrada si es necesario
        registrosPendientes.forEach(r => productosFiltrados.push(...r.Detalles));
        if (productosFiltrados.length === 0 && ultimaSemanaObj.length > 0) {
            ultimaSemanaObj.forEach(r => productosFiltrados.push(...r.Detalles));
        }
    } 
    else {
        // General: Todo el historial
        todasLasSemanas.forEach(sem => sem.forEach(reg => productosFiltrados.push(...reg.Detalles)));
        registrosPendientes.forEach(reg => productosFiltrados.push(...reg.Detalles));
    }

    // Agrupar y procesar (El resto de la lógica de Chart.js se mantiene igual)
    const stats = productosFiltrados.reduce((acc, p) => {
        if (!acc[p.Producto]) acc[p.Producto] = { s: 0, c: 0 };
        acc[p.Producto].s += p.Subtotal;
        acc[p.Producto].c += p.Cantidad;
        return acc;
    }, {});

    const topS = Object.entries(stats).sort((a, b) => b[1].s - a[1].s).slice(0, 5);
    const topC = Object.entries(stats).sort((a, b) => b[1].c - a[1].c).slice(0, 5);

    if (gI) gI.destroy(); 
    if (gC) gC.destroy();

    const rs = getComputedStyle(document.documentElement);
    const chartTick = rs.getPropertyValue('--vimar-chart-tick').trim() || '#fbff00';
    const chartGrid = rs.getPropertyValue('--vimar-chart-grid').trim() || 'rgba(255,255,255,0.05)';
    const chartBarI = rs.getPropertyValue('--vimar-chart-bar-ingresos').trim() || '#00f2ff';
    const chartBarC = rs.getPropertyValue('--vimar-chart-bar-cantidad').trim() || '#39ff14';

    const cfg = (titulo, datos, color) => ({
        type: 'bar',
        data: {
            labels: datos.map(x => x[0]),
            datasets: [{
                data: datos.map(x => x[1]),
                backgroundColor: color,
                borderRadius: 5
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                y: { beginAtZero: true, ticks: { color: chartTick }, grid: { color: chartGrid } },
                x: { ticks: { color: chartTick, font: { size: 11 } }, grid: { display: false } }
            },
            plugins: {
                legend: { display: false },
                title: { display: true, text: titulo, color: chartTick, font: { size: 14, weight: 'bold' } }
            }
        }
    });

    const ctxI = document.getElementById('chartI');
    const ctxC = document.getElementById('chartC');
    if (ctxI && ctxC) {
        gI = new Chart(ctxI, cfg(`TOP INGRESOS (${filtroGraficaActual.toUpperCase()})`, topS.map(x => [x[0], x[1].s]), chartBarI));
        gC = new Chart(ctxC, cfg(`TOP CANTIDAD (${filtroGraficaActual.toUpperCase()})`, topC.map(x => [x[0], x[1].c]), chartBarC));
    }
}

function verStocks() {
    playSound('click');
    vimarActivarSeccion('seccionStocks');
    renderizarSeccionStocks();
    localStorage.setItem('vimarSeccionActual', 'stocks');
        
    // Si el sidebar está abierto, lo cerramos
    if (document.getElementById('sidebar').classList.contains('active')) {
        toggleSidebar();
    }
}

function renderizarSeccionStocks() {
    const cont = document.getElementById('contenedorStocks');
    if (!cont) return;
    cont.innerHTML = "";

    const STOCK_MAXIMO = 60; 

    for (const [cat, data] of Object.entries(categorias)) {
        let productosAMostrar = data.prods;
        if (soloMostrarBajoStock) {
            productosAMostrar = data.prods.filter(p => (stockProductos[p] || 0) <= 10);
        }
        if (productosAMostrar.length === 0) continue;
        const divCat = document.createElement('div');
        divCat.className = 'stock-seccion-cat';
        
        divCat.innerHTML = `
            <div class="stock-cat-header">
                <div class="stock-cat-barra" style="--cat-accent:${data.color}"></div>
                <h3 class="stock-cat-titulo" style="--cat-accent:${data.color}">${cat}</h3>
            </div>
        `;
        
        const grid = document.createElement('div');
        grid.className = 'stock-productos-grid';

        productosAMostrar.sort().forEach(p =>{
            const stock = stockProductos[p] || 0;
            const unidad = cat === "Artículos" ? "Pzs" : "Lts";
            
            // --- NUEVA LÓGICA DE COLORES ---
            let estadoColor = data.color; // Color original (Stock OK)
            let textoEstado = "STOCK OK";
            let esCritico = false;
            let esAdvertencia = false;
            let esVacio = false;

            if (stock <= 0) {
                estadoColor = "#555555"; // Gris (Vacío)
                textoEstado = "❌ VACÍO";
                esVacio = true;
            } else if (stock <= 5) {
                estadoColor = "#ff0000"; // Rojo (Crítico)
                textoEstado = "⚠️ RELLENAR";
                esCritico = true;
            } else if (stock <= 10) {
                estadoColor = "#ffcc00"; // Amarillo (Advertencia)
                textoEstado = "⚡ BAJO";
                esAdvertencia = true;
            }
                
            const porcentaje = Math.min((stock / STOCK_MAXIMO) * 100, 100);
            
            const box = document.createElement('div');
            const estadoCls = esVacio ? 'stock-caja--vacio' : esCritico ? 'stock-caja--critico' : esAdvertencia ? 'stock-caja--advertencia' : 'stock-caja--ok';
            box.className = `stock-caja ${estadoCls}`;
            box.style.setProperty('--stock-accent', estadoColor);

            const badgeCls = esVacio ? 'stock-caja-badge--vacio' : (esCritico || esAdvertencia) ? 'stock-caja-badge--alerta' : 'stock-caja-badge--ok';

                box.innerHTML = `
                <div class="stock-caja-relleno" style="--stock-fill-h:${porcentaje}%"></div>

                <div class="stock-caja-acciones">
                    <button onclick="event.stopPropagation(); añadirStockManual('${p}')" 
                        class="btn-stock-accion btn-stock-accion--themed" title="Sumar Stock">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button onclick="event.stopPropagation(); editarStockDirecto('${p}')" 
                        class="btn-stock-accion btn-stock-accion--themed" title="Corregir Stock">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>

                <span class="stock-caja-nombre${esVacio ? ' stock-caja-nombre--vacio' : ''}">
                    ${p}
                </span>
                    
                <div class="stock-caja-monto-wrap">
                    <span class="stock-caja-monto-valor">
                        ${stock}
                    </span>
                    <span class="stock-caja-monto-unidad">
                        ${unidad}
                    </span>
                </div>

                <div class="stock-caja-badge ${badgeCls}">
                    ${textoEstado}
                </div>
            `;
            grid.appendChild(box);
        });
        divCat.appendChild(grid);
        cont.appendChild(divCat);
    }
}

function verInicio() { 
    playSound('click');
    vimarActivarSeccionPrincipal();
    setTimeout(() => {
        actualizarDimensionesGraficas();
    }, 50);
    localStorage.setItem('vimarSeccionActual', 'inicio'); 
    toggleSidebar(); 
}

function verHistorial() { 
    playSound('click');
    if (typeof recalcularTodosSaldosNetoSemanales === 'function') recalcularTodosSaldosNetoSemanales();
    vimarActivarSeccion('seccionHistorial');
    renderizarTablasHistorial(); 
    localStorage.setItem('vimarSeccionActual', 'historial'); 
    toggleSidebar(); 
}

function verHistorialInventario() {
    playSound('click');
    const secInventario = document.getElementById('seccionHistorialInventario');
    if (secInventario) {
        vimarActivarSeccion('seccionHistorialInventario');
        renderizarTablaInventario();
        localStorage.setItem('vimarSeccionActual', 'historialInventario');
    } else {
        console.error("No se encontró el ID 'seccionHistorialInventario' en el HTML");
    }
        
    // Cerramos el sidebar si está abierto
    if (typeof toggleSidebar === 'function' && document.getElementById('sidebar').classList.contains('active')) {
        toggleSidebar();
    }
}

function renderizarTablaInventario() {
    const tbody = document.getElementById('listaEntradasInventario');
    if (!tbody) return;
    tbody.innerHTML = "";

    if (historialEntradas.length === 0) {
        tbody.innerHTML = `<tr class="inv-vacio-msg"><td colspan="4"><b>No hay movimientos registrados...</b></td></tr>`;
        return;
    }

    historialEntradas.forEach((reg, index) => {
        const tr = document.createElement('tr');
        tr.className = 'fila-nueva inv-fila';
        tr.style.setProperty('--vimar-stagger-delay', `${index * 30}ms`);
            
        tr.innerHTML = `
            <td class="inv-celda-fecha">
                ${reg.fecha}
            </td>
            <td class="inv-celda-producto">
                ${reg.producto}
            </td>
            <td class="inv-celda-cantidad">
                <span class="inv-cantidad-badge">
                    + ${reg.cantidad}
                </span>
            </td>
            <td class="inv-celda-acciones">
                <div class="inv-acciones-row">
                    <i class="fas fa-edit inv-icon-edit" 
                       onclick="editarEntradaStock(${index})" 
                       title="Editar entrada">
                    </i>
                    <i class="fas fa-trash-alt btn-delete-small inv-icon-trash" 
                       onclick="eliminarEntradaStock(${index})" 
                       title="Eliminar entrada">
                    </i>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function toggleFiltroTanques() {
    playSound('click');
    soloMostrarBajoStock = !soloMostrarBajoStock;
    localStorage.setItem('vimarFiltroBajoStock', soloMostrarBajoStock);
    const btn = document.getElementById('btnFiltroTanques');
    const texto = document.getElementById('txtFiltro');
    if (!btn || !texto) return;
        
    if (soloMostrarBajoStock) {
        btn.classList.add('filtro-tanques--activo');
        texto.innerText = "Por Reabastecer";
    } else {
        btn.classList.remove('filtro-tanques--activo');
        texto.innerText = "Mostrar Todo";
    }
        
    renderizarSeccionStocks();
}

function actualizarVisualFiltro() {
    const btn = document.getElementById('btnFiltroTanques');
    const texto = document.getElementById('txtFiltro');
        
    if (!btn || !texto) return;

    if (soloMostrarBajoStock) {
        btn.classList.add('filtro-tanques--activo');
        texto.innerText = "Por Reabastecer";
    } else {
        btn.classList.remove('filtro-tanques--activo');
        texto.innerText = "Mostrar Todo";
    }
}

function actualizarFocusVisual() {
    document.querySelectorAll('.producto-card').forEach(c => c.classList.remove('teclado-focus'));
    if (focusElement) {
        playSound('hover');
        focusElement.classList.add('teclado-focus');
        focusElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function removerTodosLosFocus() {
    document.querySelectorAll('.producto-card').forEach(c => c.classList.remove('teclado-focus'));
}

async function confirmarBorrado(btn, nombre) {
    const ok = await mostrarModalConfirmar(
        `¿Quitar ${nombre}?`,
        { titulo: 'Quitar producto', peligroso: true, btnOk: 'Quitar' }
    );
    if (!ok) return;
    playSound('delete');
    btn.parentElement.parentElement.remove();
    calcularTodo();
}

function alternarTema() {
    playSound('click');
    const checkbox = document.getElementById('checkbox-theme');
    const link = document.getElementById('theme-link');

    if (checkbox.checked) {
        // Si el switch está activo (hacia el sol)
        link.setAttribute("href", "light.css");
        localStorage.setItem('tema-preferido', 'light');
    } else {
        // Si el switch está apagado (hacia la luna)
        link.setAttribute("href", "dark.css");
        localStorage.setItem('tema-preferido', 'dark');
    }
}

document.addEventListener('keydown', (e) => {
    // ESC - Limpiar y quitar foco del buscador (el modal de confirmación captura ESC antes)
    if (e.key === 'Escape') {
        if (document.body.classList.contains('vimar-modal-abierto')) return;
        const buscador = document.getElementById('inputBusqueda');
        buscador.value = "";       // Borra el texto
        filtrarCatalogo();         // Refresca el catálogo para mostrar todo
        buscador.blur();           // Quita el cursor del buscador
    }
    // F7 - Guardar Venta
    if (e.key === 'F7') {
        e.preventDefault();
        guardarVentaTicket();
    }
    // F8 - Guardar Día
    if (e.key === 'F8') {
        e.preventDefault();
        terminarDia();
    }
    // F9 - Guardar Semana
    if (e.key === 'F9') {
        e.preventDefault();
        guardarSemana();
    }
    // F10 - Reporte Excel
    if (e.key === 'F10') {
        e.preventDefault();
         generarExcelCompleto();
    }
    // F2 - Buscador
    if (e.key === 'F2') {
        e.preventDefault();
        document.getElementById('inputBusqueda').focus();
    }

    if (document.activeElement.id === 'inputBusqueda') {
        const visibles = Array.from(document.querySelectorAll('.producto-card')).filter(c => c.offsetParent !== null);
        if (visibles.length === 0) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault(); if (!focusElement) focusElement = visibles[0];
            else {
                const rectActual = focusElement.getBoundingClientRect(); const centroX = rectActual.left + rectActual.width/2; const centroY = rectActual.top + rectActual.height/2;
                let candidato = null; let minimaDistancia = Infinity;
                visibles.forEach(v => { if (v === focusElement) return; const r = v.getBoundingClientRect(); const cX = r.left + r.width/2; const cY = r.top + r.height/2; let vld = false; if (e.key === 'ArrowRight' && cX > centroX + 10 && Math.abs(cY - centroY) < 50) vld = true; if (e.key === 'ArrowLeft' && cX < centroX - 10 && Math.abs(cY - centroY) < 50) vld = true; if (e.key === 'ArrowDown' && cY > centroY + 10) vld = true; if (e.key === 'ArrowUp' && cY < centroY - 10) vld = true; if (vld) { const dist = (e.key === 'ArrowDown' || e.key === 'ArrowUp') ? Math.abs(cX - centroX) + Math.abs(cY - centroY) * 2 : Math.sqrt((cX - centroX)**2 + (cY - centroY)**2); if (dist < minimaDistancia) { minimaDistancia = dist; candidato = v; } } });
                if (candidato) focusElement = candidato;
            }
            actualizarFocusVisual();
        } else if (e.key === 'Enter') { e.preventDefault(); if (focusElement) focusElement.click(); }
    }
});

window.onload = () => {
    // --- RELOJ EN TIEMPO REAL ---
    function actualizarReloj() {
        const ahora = new Date();
        const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const dia = diasSemana[ahora.getDay()];
        const fecha = `${dia} ${ahora.getDate()} ${meses[ahora.getMonth()]} ${ahora.getFullYear()}`;
        const hh = String(ahora.getHours()).padStart(2, '0');
        const mm = String(ahora.getMinutes()).padStart(2, '0');
        const ss = String(ahora.getSeconds()).padStart(2, '0');
        const horas12 = ahora.getHours() % 12 || 12;
        const ampm = ahora.getHours() >= 12 ? 'PM' : 'AM';
        const hora = `${String(horas12).padStart(2, '0')}:${mm} <span class="reloj-ampm">${ampm}</span>`;
        const elFecha = document.getElementById('reloj-fecha');
        const elHora  = document.getElementById('reloj-hora');
        if (elFecha) elFecha.textContent = fecha;
        if (elHora)  elHora.innerHTML  = hora;
    }
    actualizarReloj();
    setInterval(actualizarReloj, 1000);
    if (typeof recalcularTodosSaldosNetoSemanales === 'function') recalcularTodosSaldosNetoSemanales();

    const caja = localStorage.getItem('vimarCajaMonto');
    if (caja) document.getElementById('inputCajaReal').value = caja;

    const temaGuardado = localStorage.getItem('tema-preferido');
    const checkbox = document.getElementById('checkbox-theme');
    const link = document.getElementById('theme-link');

    if (temaGuardado === 'light') {
        checkbox.checked = true;
        link.setAttribute("href", "light.css");
    } else {
        checkbox.checked = false;
        link.setAttribute("href", "dark.css");
    }

    const filtroGuardado = localStorage.getItem('vimarFiltroBajoStock');
    if (filtroGuardado !== null) {
        soloMostrarBajoStock = (filtroGuardado === 'true');
        actualizarVisualFiltro(); 
    }

    const seccionGuardada = localStorage.getItem('vimarSeccionActual');
        
    if (seccionGuardada === 'stocks') {
        vimarActivarSeccion('seccionStocks');
        actualizarVisualFiltro();
        renderizarSeccionStocks();
    } else if (seccionGuardada === 'historial') {
        vimarActivarSeccion('seccionHistorial');
        renderizarTablasHistorial();
    } else if (seccionGuardada === 'historialInventario') {
        verHistorialInventario();
    } else if (seccionGuardada === 'historialGastos') {
        verHistorialGastos();
    } else if (seccionGuardada === 'historialIngresosManuales') {
        verHistorialIngresosManuales();
    } else {
        vimarActivarSeccionPrincipal();
        setTimeout(actualizarDimensionesGraficas, 200);
    }

    document.getElementById('gastoNombre').addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('gastoMonto').focus();
        } 
    });
    document.getElementById('gastoMonto').addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') { e.preventDefault();
            agregarGasto();
        } 
    });

    document.getElementById('ingresoManualNombre').addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('ingresoManualMonto').focus();
        } 
    });
    document.getElementById('ingresoManualMonto').addEventListener('keydown', (e) => { 
        if (e.key === 'Enter') { 
            e.preventDefault();
            agregarIngresoManual();
        } 
    });
    
    const gastosGuardados = localStorage.getItem('vimarGastos');
    if (gastosGuardados) {
        gastosArray = JSON.parse(gastosGuardados);
    } else {
        gastosArray = [];
    }

    const ingresosGuardados = localStorage.getItem('vimarIngresosManuales');
    if (ingresosGuardados) {
        ingresosManualesArray = JSON.parse(ingresosGuardados);
    } else {
        ingresosManualesArray = [];
    }

    const ventasTicketGuardadas = localStorage.getItem('ventasTicket');
    if (ventasTicketGuardadas) {
        ventasTicket = JSON.parse(ventasTicketGuardadas);
    } else {
        ventasTicket = [];
    }
    renderizarListaVentasTicket();

    alternarTema();
    actualizarVisualFiltrosGrafica();
    renderizarCatalogo(); 
    actualizarGastosUI(); 
    actualizarIngresosManualesUI();
    actualizarGraficas(); 
    calcularTodo();
    inicializarStockSiVacio();

};
