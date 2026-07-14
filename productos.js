// ============================================================
// PRODUCTOS.JS — IDs de producto, CRUD de productos/categorías,
//                carga de datos custom desde localStorage
// ============================================================

// --- GENERACIÓN DE IDs ---

function _vimarAbreviarNombre(nombre, variante = 0) {
    const limpio = nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    let palabras = limpio.split(/[^A-Z]+/).filter(w => w);
    palabras = palabras.filter(w => w.length > 1 && !VIMAR_PALABRAS_IGNORADAS.has(w));
    palabras = palabras.filter(w => !VIMAR_CONECTORES.has(w));
    if (palabras.length === 0) return 'XXX';

    if (palabras.length === 1) {
        const w = palabras[0];
        const primera = w[0];
        const resto = w.substring(1);
        const cons = resto.split('').filter(c => !'AEIOU'.includes(c));
        let segunda, tercera;
        if (cons.length >= 2) {
            const idxA = Math.min(variante, cons.length - 2);
            segunda = cons[idxA];
            tercera = cons[cons.length - 1 - Math.floor(variante / Math.max(1, cons.length - 1))] || cons[cons.length - 1];
        } else if (cons.length === 1) {
            segunda = cons[0];
            const idx = resto.indexOf(cons[0]);
            const resto2 = resto.substring(idx + 1);
            tercera = resto2 ? resto2[resto2.length - 1] : (resto[0] !== segunda ? resto[0] : 'X');
        } else {
            const vocales = resto.split('').filter(c => 'AEIOU'.includes(c));
            segunda = vocales[0] || resto[0] || 'X';
            tercera = vocales[1] || resto[1] || 'X';
        }
        if (cons.length < 2 && variante > 0 && resto.length > 0) {
            tercera = resto[variante % resto.length];
        }
        return ((primera + segunda + tercera).padEnd(3, 'X')).substring(0, 3);
    }

    const p1 = palabras[0], p2 = palabras[1];
    const variantePalabra = Math.floor(variante / 3);
    const varianteLetra   = variante % 3;
    const primera = p1[0];
    const resto   = p1.substring(1);

    let segunda;
    if (resto.length === 0) {
        segunda = 'X';
    } else if (!'AEIOU'.includes(resto[0])) {
        segunda = resto[0];
    } else {
        const cons = resto.split('').filter(c => !'AEIOU'.includes(c));
        if      (cons.length === 0) segunda = resto[0];
        else if (cons.length === 1) segunda = cons[0];
        else if (cons.length === 2) segunda = cons[1];
        else                        segunda = cons[Math.floor(cons.length / 2)];
    }
    if (varianteLetra > 0 && resto.length > 0) segunda = resto[varianteLetra % resto.length];

    let tercera = p2[0];
    if (p2.length > 1) tercera = p2[variantePalabra % p2.length];

    return ((primera + segunda + tercera).padEnd(3, 'X')).substring(0, 3);
}

function _vimarHashNombre(nombre) {
    let hash = 0;
    const limpio = nombre.toUpperCase().trim();
    for (let i = 0; i < limpio.length; i++) hash = (hash * 31 + limpio.charCodeAt(i)) % 100;
    return hash;
}

function generarIdsProductos() {
    productoIdMap = {};
    idProductoMap = {};
    const prefijosUsadosCats = new Set();

    for (const [cat, data] of Object.entries(categorias)) {
        let prefijoCat = VIMAR_PREFIJOS_CATEGORIA[cat];
        if (!prefijoCat) {
            let v = 0;
            prefijoCat = _vimarAbreviarNombre(cat, v);
            while (prefijosUsadosCats.has(prefijoCat) && v < 30) prefijoCat = _vimarAbreviarNombre(cat, ++v);
        }
        prefijosUsadosCats.add(prefijoCat);

        const prefijosUsadosCat = new Set();
        [...data.prods].sort().forEach(p => {
            let prefijoNom = _vimarAbreviarNombre(p, 0);
            let prefijoCompleto = prefijoCat + prefijoNom;
            let v = 1;
            while (prefijosUsadosCat.has(prefijoCompleto) && v < 30) {
                prefijoNom = _vimarAbreviarNombre(p, v++);
                prefijoCompleto = prefijoCat + prefijoNom;
            }
            prefijosUsadosCat.add(prefijoCompleto);

            let num = _vimarHashNombre(p);
            let id  = prefijoCompleto + String(num).padStart(2, '0');
            while (idProductoMap[id]) { num = (num + 1) % 100; id = prefijoCompleto + String(num).padStart(2, '0'); }
            productoIdMap[p]  = id;
            idProductoMap[id] = p;
        });
    }
}

function obtenerIdProducto(nombre)   { return productoIdMap[nombre] || ''; }
function obtenerProductoPorId(id)    { return idProductoMap[String(id).toUpperCase().trim()] || null; }

function buscarProductosPorIdParcial(texto) {
    const q = String(texto).toUpperCase().trim();
    if (!q) return [];
    return Object.entries(idProductoMap).filter(([id]) => id.includes(q)).map(([, nombre]) => nombre);
}

// --- CARGA DE CUSTOM DESDE LOCALSTORAGE ---

(function vimarCargarProductosCustom() {
    const saved = localStorage.getItem('vimarProductosCustom');
    if (!saved) return;
    try {
        const custom = JSON.parse(saved);

        if (custom.liquidos) {
            Object.keys(preciosLiquidos).forEach(p => { if (!(p in custom.liquidos)) delete preciosLiquidos[p]; });
            Object.assign(preciosLiquidos, custom.liquidos);
        }
        if (custom.articulos) {
            Object.keys(baseArticulos).forEach(p => { if (!(p in custom.articulos)) delete baseArticulos[p]; });
            Object.assign(baseArticulos, custom.articulos);
        }
        if (custom.promos) {
            Object.keys(promosArticulos).forEach(p => { if (!(p in custom.promos)) delete promosArticulos[p]; });
            Object.assign(promosArticulos, custom.promos);
        }
        if (custom.cats) {
            // Actualizar categorías existentes
            Object.keys(categorias).forEach(cat => {
                if (custom.cats[cat]) {
                    categorias[cat].prods = [...custom.cats[cat]];
                    if (custom.catColors?.[cat]) categorias[cat].color = custom.catColors[cat];
                } else {
                    categorias[cat].prods = [];
                }
            });
            // Agregar categorías nuevas creadas por el usuario
            Object.keys(custom.cats).forEach(cat => {
                if (!categorias[cat]) {
                    categorias[cat] = { color: custom.catColors?.[cat] || '#888888', prods: [...custom.cats[cat]] };
                }
            });
            // Restaurar orden guardado
            const ordenGuardado = Object.keys(custom.cats);
            const nuevasCategorias = {};
            ordenGuardado.forEach(cat => { if (categorias[cat]) nuevasCategorias[cat] = categorias[cat]; });
            Object.keys(categorias).forEach(cat => { if (!nuevasCategorias[cat]) nuevasCategorias[cat] = categorias[cat]; });
            Object.keys(categorias).forEach(k => delete categorias[k]);
            Object.assign(categorias, nuevasCategorias);
        }
        if (categorias['Artículos']) {
            Object.keys(custom.articulos || {}).forEach(p => {
                if (!categorias['Artículos'].prods.includes(p)) categorias['Artículos'].prods.push(p);
            });
        }
    } catch(e) { console.error('Error cargando productos custom', e); }
})();

// --- CRUD DE PRODUCTOS ---

let _mpEditando = null;
let _infoProductoAdminNombre = null;

const _ETIQUETAS_LITROS = { 0.25: '250ml', 0.5: '500ml', 1: '1L', 2: '2L', 3: '3L' };

function _obtenerCategoriaProducto(nombre) {
    for (const [cat, data] of Object.entries(categorias)) {
        if (data.prods.includes(nombre)) return cat;
    }
    return 'Sin categoría';
}

function _obtenerUnidadStock(nombre) {
    return _obtenerCategoriaProducto(nombre) === 'Artículos' ? 'pzs' : 'lts';
}

function _construirHtmlInfoProducto(nombre) {
    const cat   = _obtenerCategoriaProducto(nombre);
    const stock = stockProductos[nombre] != null ? stockProductos[nombre] : 0;
    const unidad = _obtenerUnidadStock(nombre);
    const esArt  = !!baseArticulos[nombre];
    let filas = '';

    filas += `<div class="vimar-info-fila"><span class="vimar-info-label">ID</span><span class="vimar-info-valor">${obtenerIdProducto(nombre) || '—'}</span></div>`;
    filas += `<div class="vimar-info-fila"><span class="vimar-info-label">Categoría</span><span class="vimar-info-valor">${cat}</span></div>`;
    filas += `<div class="vimar-info-fila"><span class="vimar-info-label">Stock</span><span class="vimar-info-valor">${stock} ${unidad}</span></div>`;

    if (esArt) {
        filas += `<div class="vimar-info-fila"><span class="vimar-info-label">Precio unitario</span><span class="vimar-info-valor">$${baseArticulos[nombre].toFixed(2)}</span></div>`;
        const promo = promosArticulos[nombre];
        if (promo && Object.keys(promo).length) {
            const promoTxt = Object.entries(promo).map(([k, v]) => `${k} uds → $${v}`).join(', ');
            filas += `<div class="vimar-info-fila"><span class="vimar-info-label">Promoción</span><span class="vimar-info-valor">${promoTxt}</span></div>`;
        }
    } else {
        const lp     = preciosLiquidos[nombre] || {};
        const precios = [0.25, 0.5, 1, 2, 3].filter(l => lp[l] > 0)
            .map(l => `<div class="vimar-info-precio-item"><span>${_ETIQUETAS_LITROS[l]}</span><span>$${lp[l].toFixed(2)}</span></div>`).join('');
        if (precios) filas += `<div class="vimar-info-seccion"><span class="vimar-info-label">Precios</span><div class="vimar-info-precios-grid">${precios}</div></div>`;
        else         filas += `<div class="vimar-info-fila"><span class="vimar-info-label">Precios</span><span class="vimar-info-valor vimar-info-sin-dato">Sin precios registrados</span></div>`;
    }
    return filas;
}

function mostrarInfoProductoAdmin(nombre) {
    _infoProductoAdminNombre = nombre;
    const root = document.getElementById('vimar-popup-producto-info');
    if (!root) return;
    document.getElementById('vimar-popup-producto-titulo').textContent = nombre;
    document.getElementById('vimar-popup-producto-contenido').innerHTML = _construirHtmlInfoProducto(nombre);
    root.setAttribute('aria-hidden', 'false');
    root.classList.add('vimar-modal-confirmar--visible');
    vimarActualizarCapaModalBody();
    if (typeof playSound === 'function') playSound('click');
}

function cerrarInfoProductoAdmin(conSonido = true) {
    const root = document.getElementById('vimar-popup-producto-info');
    if (!root) return;
    const estabaAbierto = root.classList.contains('vimar-modal-confirmar--visible');
    root.setAttribute('aria-hidden', 'true');
    root.classList.remove('vimar-modal-confirmar--visible');
    _infoProductoAdminNombre = null;
    vimarActualizarCapaModalBody();
    if (conSonido && estabaAbierto && typeof playSound === 'function') playSound('click');
}

function abrirModalEditarProductoDesdeInfo() {
    const nombre = _infoProductoAdminNombre;
    if (!nombre) return;
    cerrarInfoProductoAdmin(false);
    abrirModalEditarProducto(nombre);
}

function abrirModalAgregarProducto() {
    _mpEditando = null;
    _rellenarFormProducto(null, null);
    document.getElementById('modal-producto-titulo').textContent = 'Agregar Producto';
    _mostrarModalProducto();
}

function abrirModalEditarProducto(nombre) {
    _mpEditando = nombre;
    let catNombre = 'Artículos';
    Object.keys(categorias).forEach(c => { if (categorias[c].prods.includes(nombre)) catNombre = c; });
    _rellenarFormProducto(nombre, catNombre);
    document.getElementById('modal-producto-titulo').textContent = 'Editar Producto';
    _mostrarModalProducto();
}

function _mostrarModalProducto() {
    const m = document.getElementById('vimar-modal-producto');
    if (!m) return;
    m.setAttribute('aria-hidden', 'false');
    m.classList.add('vimar-modal-confirmar--visible');
    vimarActualizarCapaModalBody();
    _actualizarSeccionesFormProducto();
    if (typeof playSound === 'function') playSound('click');
}

function cerrarModalProducto(conSonido = true) {
    const m = document.getElementById('vimar-modal-producto');
    if (!m) return;
    const estabaAbierto = m.classList.contains('vimar-modal-confirmar--visible');
    m.setAttribute('aria-hidden', 'true');
    m.classList.remove('vimar-modal-confirmar--visible');
    vimarActualizarCapaModalBody();
    _mpEditando = null;
    if (conSonido && estabaAbierto && typeof playSound === 'function') playSound('click');
}

function _rellenarFormProducto(nombre, catNombre) {
    const sel = document.getElementById('mp-categoria');
    sel.innerHTML = '';
    Object.keys(categorias).forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        if (c === catNombre) opt.selected = true;
        sel.appendChild(opt);
    });
    document.getElementById('mp-nombre').value = nombre || '';
    const lp = nombre && preciosLiquidos[nombre] ? preciosLiquidos[nombre] : {};
    document.getElementById('mp-p025').value = lp[0.25] || '';
    document.getElementById('mp-p05').value  = lp[0.5]  || '';
    document.getElementById('mp-p1').value   = lp[1]    || '';
    document.getElementById('mp-p2').value   = lp[2]    || '';
    document.getElementById('mp-p3').value   = lp[3]    || '';
    document.getElementById('mp-pu').value   = nombre && baseArticulos[nombre] ? baseArticulos[nombre] : '';
    const promo    = nombre && promosArticulos[nombre] ? promosArticulos[nombre] : {};
    const promoStr = Object.entries(promo).map(([k, v]) => `${k}:${v}`).join(', ');
    document.getElementById('mp-promo').value = promoStr;
    document.getElementById('mp-stock').value = nombre && stockProductos[nombre] != null ? stockProductos[nombre] : 0;
    sel.addEventListener('change', _actualizarSeccionesFormProducto, { once: false });
    _actualizarSeccionesFormProducto();
}

function _actualizarSeccionesFormProducto() {
    const cat   = document.getElementById('mp-categoria')?.value;
    const esArt = cat === 'Artículos';
    document.getElementById('mp-seccion-liquido').style.display  = esArt ? 'none' : '';
    document.getElementById('mp-seccion-articulo').style.display = esArt ? ''     : 'none';
    const lblStock = document.getElementById('mp-stock-label');
    if (lblStock) lblStock.textContent = esArt ? 'Stock (pzs)' : 'Stock (lts)';
}

document.addEventListener('change', function(e) {
    if (e.target && e.target.id === 'mp-categoria') _actualizarSeccionesFormProducto();
});

function guardarProductoModal() {
    if (typeof playSound === 'function') playSound('click');
    const nombre = document.getElementById('mp-nombre').value.trim();
    const cat    = document.getElementById('mp-categoria').value;
    if (!nombre) { if (typeof playSound === 'function') playSound('error'); return; }

    const nombreViejo = _mpEditando;

    if (nombreViejo) {
        Object.keys(categorias).forEach(c => {
            [nombreViejo, nombre].forEach(n => {
                const idx = categorias[c].prods.indexOf(n);
                if (idx > -1) categorias[c].prods.splice(idx, 1);
            });
        });
        if (nombreViejo !== nombre) {
            delete preciosLiquidos[nombreViejo];
            delete baseArticulos[nombreViejo];
            delete promosArticulos[nombreViejo];
            if (stockProductos[nombreViejo] !== undefined && stockProductos[nombre] === undefined) {
                stockProductos[nombre] = stockProductos[nombreViejo];
            }
            delete stockProductos[nombreViejo];
        }
    }

    if (cat === 'Artículos') {
        baseArticulos[nombre] = parseFloat(document.getElementById('mp-pu').value) || 0;
        const promoRaw = document.getElementById('mp-promo').value.trim();
        if (promoRaw) {
            promosArticulos[nombre] = {};
            promoRaw.split(',').forEach(par => {
                const [k, v] = par.split(':').map(x => x.trim());
                if (k && v) promosArticulos[nombre][parseFloat(k)] = parseFloat(v);
            });
        } else { delete promosArticulos[nombre]; }
        delete preciosLiquidos[nombre];
    } else {
        const lp = {};
        const v025 = parseFloat(document.getElementById('mp-p025').value);
        const v05  = parseFloat(document.getElementById('mp-p05').value);
        const v1   = parseFloat(document.getElementById('mp-p1').value);
        const v2   = parseFloat(document.getElementById('mp-p2').value);
        const v3   = parseFloat(document.getElementById('mp-p3').value);
        if (!isNaN(v025) && v025 > 0) lp[0.25] = v025;
        if (!isNaN(v05)  && v05  > 0) lp[0.5]  = v05;
        if (!isNaN(v1)   && v1   > 0) lp[1]    = v1;
        if (!isNaN(v2)   && v2   > 0) lp[2]    = v2;
        if (!isNaN(v3)   && v3   > 0) lp[3]    = v3;
        preciosLiquidos[nombre] = lp;
        delete baseArticulos[nombre];
        delete promosArticulos[nombre];
    }

    if (!categorias[cat].prods.includes(nombre)) categorias[cat].prods.push(nombre);

    _persistirProductosCustom();

    const stockRaw = document.getElementById('mp-stock').value;
    const stockVal = stockRaw === '' ? 0 : parseFloat(stockRaw);
    if (isNaN(stockVal) || stockVal < 0) { if (typeof playSound === 'function') playSound('error'); return; }
    stockProductos[nombre] = stockVal;
    localStorage.setItem('vimarStock', JSON.stringify(stockProductos));

    cerrarModalProducto(false);
    if (typeof playSound === 'function') playSound('success');
    generarIdsProductos();
    if (typeof renderizarCatalogo     === 'function') renderizarCatalogo();
    if (typeof renderizarSeccionStocks === 'function') renderizarSeccionStocks();
}

function _quitarProductoDeCatalogo(nombre) {
    Object.keys(categorias).forEach(c => {
        const idx = categorias[c].prods.indexOf(nombre);
        if (idx > -1) categorias[c].prods.splice(idx, 1);
    });
    delete preciosLiquidos[nombre];
    delete baseArticulos[nombre];
    delete promosArticulos[nombre];
    delete stockProductos[nombre];
}

async function eliminarProductoCatalogo(nombre) {
    if (typeof playSound === 'function') playSound('click');
    const ok = await mostrarModalConfirmar(`¿Eliminar "${nombre}" del catálogo?`, { titulo: 'Eliminar producto', peligroso: true, btnOk: 'Eliminar' });
    if (!ok) return;
    _quitarProductoDeCatalogo(nombre);
    _persistirProductosCustom();
    localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
    generarIdsProductos();
    if (typeof playSound === 'function') playSound('delete');
    if (typeof renderizarCatalogo      === 'function') renderizarCatalogo();
    if (typeof renderizarSeccionStocks  === 'function') renderizarSeccionStocks();
}

function _persistirProductosCustom() {
    const custom = { liquidos: preciosLiquidos, articulos: baseArticulos, promos: promosArticulos, cats: {}, catColors: {} };
    Object.keys(categorias).forEach(c => {
        custom.cats[c]      = [...categorias[c].prods];
        custom.catColors[c] = categorias[c].color;
    });
    localStorage.setItem('vimarProductosCustom', JSON.stringify(custom));
}