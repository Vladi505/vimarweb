// ============================================================
// CATEGORIAS.JS — Color pickers (vcp, vcp2), modal nueva
//                 categoría, modal editar/reordenar categorías
// ============================================================

// --- UTILIDADES COMPARTIDAS DE COLOR ---

function _vcpHsvToHex(h, s, v) {
    let r, g, b;
    switch (Math.floor(h / 60) % 6) {
        case 0: r=v; g=v*(1-(1-(h/60-Math.floor(h/60)))*s); b=v*(1-s); break;
        case 1: r=v*(1-(h/60-Math.floor(h/60))*s); g=v; b=v*(1-s); break;
        case 2: r=v*(1-s); g=v; b=v*(1-(1-(h/60-Math.floor(h/60)))*s); break;
        case 3: r=v*(1-s); g=v*(1-(h/60-Math.floor(h/60))*s); b=v; break;
        case 4: r=v*(1-(1-(h/60-Math.floor(h/60)))*s); g=v*(1-s); b=v; break;
        case 5: r=v; g=v*(1-s); b=v*(1-(h/60-Math.floor(h/60))*s); break;
    }
    // Recalcular correctamente con switch estándar
    const i = Math.floor(h / 60) % 6, f = h/60 - Math.floor(h/60);
    const p = v*(1-s), q = v*(1-f*s), t = v*(1-(1-f)*s);
    switch(i){case 0:r=v;g=t;b=p;break;case 1:r=q;g=v;b=p;break;case 2:r=p;g=v;b=t;break;
               case 3:r=p;g=q;b=v;break;case 4:r=t;g=p;b=v;break;case 5:r=v;g=p;b=q;break;}
    return [r,g,b].map(x => Math.round(x*255).toString(16).padStart(2,'0')).join('').toUpperCase();
}

function _vcpHexToHsv(hex) {
    hex = hex.replace('#','');
    if (hex.length !== 6) return null;
    const r = parseInt(hex.slice(0,2),16)/255, g = parseInt(hex.slice(2,4),16)/255, b = parseInt(hex.slice(4,6),16)/255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
    let h = 0;
    if (d > 0) {
        if      (max === r) h = ((g-b)/d+6)%6;
        else if (max === g) h = (b-r)/d+2;
        else                h = (r-g)/d+4;
        h *= 60;
    }
    return { h, s: max > 0 ? d/max : 0, v: max };
}

function _vcpResolverColor(color) {
    // Convierte var(--cat-xxx) o cualquier string a hex usable por el picker
    if (!color) return '#00f2ff';
    if (color.startsWith('var(')) {
        const varName = color.replace(/^var\(/, '').replace(/\)$/, '').trim();
        const resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
        color = resolved || '#00f2ff';
    }
    return color.startsWith('#') ? color : '#00f2ff';
}

// --- COLOR PICKER 1 (modal nueva categoría) ---

const _vcp = { h: 0, s: 1, v: 1, draggingGrad: false, draggingHue: false };

function _vcpRenderGradient() {
    const canvas = document.getElementById('vcp-gradient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.offsetWidth || 400, h = canvas.offsetHeight || 180;
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = `hsl(${_vcp.h},100%,50%)`;
    ctx.fillRect(0,0,w,h);
    const gW = ctx.createLinearGradient(0,0,w,0); gW.addColorStop(0,'rgba(255,255,255,1)'); gW.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = gW; ctx.fillRect(0,0,w,h);
    const gB = ctx.createLinearGradient(0,0,0,h); gB.addColorStop(0,'rgba(0,0,0,0)'); gB.addColorStop(1,'rgba(0,0,0,1)');
    ctx.fillStyle = gB; ctx.fillRect(0,0,w,h);
}

function _vcpActualizarUI() {
    _vcpRenderGradient();
    const hex = _vcpHsvToHex(_vcp.h, _vcp.s, _vcp.v);
    const canvas = document.getElementById('vcp-gradient-canvas');
    const cursor = document.getElementById('vcp-cursor');
    if (canvas && cursor) {
        cursor.style.left = (_vcp.s * (canvas.offsetWidth  || 400)) + 'px';
        cursor.style.top  = ((1-_vcp.v) * (canvas.offsetHeight || 180)) + 'px';
    }
    const hueThumb = document.getElementById('vcp-hue-thumb');
    if (hueThumb) hueThumb.style.left = (_vcp.h/360*100) + '%';
    const preview  = document.getElementById('vcp-preview');
    if (preview)   preview.style.background = '#' + hex;
    const hexInput = document.getElementById('vcp-hex-input');
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;
}

function vcpHexInput(val) {
    val = val.replace(/[^0-9a-fA-F]/g,'');
    if (val.length === 6) { const hsv = _vcpHexToHsv(val); if (hsv) { _vcp.h=hsv.h; _vcp.s=hsv.s; _vcp.v=hsv.v; _vcpActualizarUI(); } }
}

function vcpCopiarHex() {
    navigator.clipboard?.writeText('#' + _vcpHsvToHex(_vcp.h,_vcp.s,_vcp.v)).catch(()=>{});
    if (typeof playSound === 'function') playSound('click');
}

function vcpObtenerHexActual() { return '#' + _vcpHsvToHex(_vcp.h,_vcp.s,_vcp.v); }

function vcpSetColor(hexColor) {
    const hsv = _vcpHexToHsv(_vcpResolverColor(hexColor).replace('#',''));
    if (hsv) { _vcp.h=hsv.h; _vcp.s=hsv.s; _vcp.v=hsv.v; } else { _vcp.h=0; _vcp.s=1; _vcp.v=1; }
    setTimeout(_vcpActualizarUI, 30);
}

function _vcpBindEventos() {
    const canvas  = document.getElementById('vcp-gradient-canvas');
    const hueWrap = document.getElementById('vcp-hue-wrap');
    if (!canvas || !hueWrap || canvas.dataset.vcpBound === '1') return;
    canvas.dataset.vcpBound = '1';

    function onGrad(e) {
        if (!_vcp.draggingGrad) return;
        const r = canvas.getBoundingClientRect();
        const cx = e.touches?.[0]?.clientX ?? e.clientX;
        const cy = e.touches?.[0]?.clientY ?? e.clientY;
        _vcp.s = Math.max(0,Math.min(1,(cx-r.left)/r.width));
        _vcp.v = Math.max(0,Math.min(1,1-(cy-r.top)/r.height));
        _vcpActualizarUI();
    }
    function onHue(e) {
        if (!_vcp.draggingHue) return;
        const r = hueWrap.getBoundingClientRect();
        const cx = e.touches?.[0]?.clientX ?? e.clientX;
        _vcp.h = Math.max(0,Math.min(360,((cx-r.left)/r.width)*360));
        _vcpActualizarUI();
    }

    canvas.addEventListener('mousedown',  e => { _vcp.draggingGrad=true; onGrad(e); });
    canvas.addEventListener('touchstart', e => { e.preventDefault(); _vcp.draggingGrad=true; onGrad(e); }, { passive:false });
    hueWrap.addEventListener('mousedown',  e => { _vcp.draggingHue=true; onHue(e); });
    hueWrap.addEventListener('touchstart', e => { e.preventDefault(); _vcp.draggingHue=true; onHue(e); }, { passive:false });
    document.addEventListener('mousemove', e => { onGrad(e); onHue(e); });
    document.addEventListener('touchmove', e => { onGrad(e); onHue(e); }, { passive:false });
    document.addEventListener('mouseup',   () => { _vcp.draggingGrad=false; _vcp.draggingHue=false; });
    document.addEventListener('touchend',  () => { _vcp.draggingGrad=false; _vcp.draggingHue=false; });

    const hexInput = document.getElementById('vcp-hex-input');
    if (hexInput) {
        hexInput.addEventListener('paste', e => {
            e.preventDefault();
            const pasted = (e.clipboardData||window.clipboardData).getData('text').replace(/[^0-9a-fA-F#]/g,'').replace('#','').substring(0,6);
            hexInput.value = pasted; vcpHexInput(pasted);
        });
    }
}

// --- MODAL NUEVA CATEGORÍA ---

function abrirModalAgregarCategoria() {
    if (typeof playSound === 'function') playSound('click');
    document.getElementById('mc-nombre').value = '';
    vcpSetColor('#00f2ff');
    const m = document.getElementById('vimar-modal-categoria');
    m.setAttribute('aria-hidden','false');
    m.classList.add('vimar-modal-confirmar--visible');
    vimarActualizarCapaModalBody();
    setTimeout(() => { _vcpBindEventos(); _vcpActualizarUI(); document.getElementById('mc-nombre')?.focus(); }, 60);
}

function cerrarModalCategoria(conSonido = true) {
    const m = document.getElementById('vimar-modal-categoria');
    if (!m) return;
    const estabaAbierto = m.classList.contains('vimar-modal-confirmar--visible');
    m.setAttribute('aria-hidden','true');
    m.classList.remove('vimar-modal-confirmar--visible');
    vimarActualizarCapaModalBody();
    if (conSonido && estabaAbierto && typeof playSound === 'function') playSound('click');
}

async function guardarCategoriaModal() {
    const nombre = document.getElementById('mc-nombre').value.trim();
    if (!nombre) {
        if (typeof playSound === 'function') playSound('error');
        document.getElementById('mc-nombre').classList.add('input-error');
        setTimeout(() => document.getElementById('mc-nombre').classList.remove('input-error'), 600);
        return;
    }
    if (categorias[nombre]) {
        await mostrarModalAlerta(`Ya existe una categoría llamada "${nombre}".`, { titulo: 'Nombre duplicado', tipo: 'error' });
        return;
    }
    categorias[nombre] = { color: vcpObtenerHexActual(), prods: [] };
    _persistirProductosCustom();
    if (typeof playSound === 'function') playSound('success');
    cerrarModalCategoria(false);
    generarIdsProductos();
    if (typeof renderizarCatalogo      === 'function') renderizarCatalogo();
    if (typeof renderizarSeccionStocks  === 'function') renderizarSeccionStocks();
    await mostrarModalAlerta(`Categoría "${nombre}" creada con éxito.`, { titulo: 'Categoría creada', tipo: 'success' });
}

// --- COLOR PICKER 2 (modal editar categoría) ---

const _vcp2 = { h: 0, s: 1, v: 1, draggingGrad: false, draggingHue: false };

function _vcp2RenderGradient() {
    const canvas = document.getElementById('vcp2-gradient-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.offsetWidth || 380, h = canvas.offsetHeight || 160;
    canvas.width = w; canvas.height = h;
    ctx.fillStyle = `hsl(${_vcp2.h},100%,50%)`;
    ctx.fillRect(0,0,w,h);
    const gW = ctx.createLinearGradient(0,0,w,0); gW.addColorStop(0,'rgba(255,255,255,1)'); gW.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle = gW; ctx.fillRect(0,0,w,h);
    const gB = ctx.createLinearGradient(0,0,0,h); gB.addColorStop(0,'rgba(0,0,0,0)'); gB.addColorStop(1,'rgba(0,0,0,1)');
    ctx.fillStyle = gB; ctx.fillRect(0,0,w,h);
}

function _vcp2ActualizarUI() {
    _vcp2RenderGradient();
    const hex = _vcpHsvToHex(_vcp2.h, _vcp2.s, _vcp2.v);
    const canvas = document.getElementById('vcp2-gradient-canvas');
    const cursor = document.getElementById('vcp2-cursor');
    if (canvas && cursor) {
        cursor.style.left = (_vcp2.s * (canvas.offsetWidth  || 380)) + 'px';
        cursor.style.top  = ((1-_vcp2.v) * (canvas.offsetHeight || 160)) + 'px';
    }
    const hueThumb = document.getElementById('vcp2-hue-thumb');
    if (hueThumb) hueThumb.style.left = (_vcp2.h/360*100) + '%';
    const preview  = document.getElementById('vcp2-preview');
    if (preview)   preview.style.background = '#' + hex;
    const hexInput = document.getElementById('vcp2-hex-input');
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;
}

function vcp2HexInput(val) {
    val = val.replace(/[^0-9a-fA-F]/g,'');
    if (val.length === 6) { const hsv = _vcpHexToHsv(val); if (hsv) { _vcp2.h=hsv.h; _vcp2.s=hsv.s; _vcp2.v=hsv.v; _vcp2ActualizarUI(); } }
}

function vcp2CopiarHex() {
    navigator.clipboard?.writeText('#' + _vcpHsvToHex(_vcp2.h,_vcp2.s,_vcp2.v)).catch(()=>{});
    if (typeof playSound === 'function') playSound('click');
}

function vcp2ObtenerHexActual() { return '#' + _vcpHsvToHex(_vcp2.h,_vcp2.s,_vcp2.v); }

function vcp2SetColor(hexColor) {
    const hsv = _vcpHexToHsv(_vcpResolverColor(hexColor).replace('#',''));
    if (hsv) { _vcp2.h=hsv.h; _vcp2.s=hsv.s; _vcp2.v=hsv.v; } else { _vcp2.h=0; _vcp2.s=1; _vcp2.v=1; }
    setTimeout(_vcp2ActualizarUI, 30);
}

function _vcp2BindEventos() {
    const canvas  = document.getElementById('vcp2-gradient-canvas');
    const hueWrap = document.getElementById('vcp2-hue-wrap');
    if (!canvas || !hueWrap || canvas.dataset.vcp2Bound === '1') return;
    canvas.dataset.vcp2Bound = '1';

    function onGrad(e) {
        if (!_vcp2.draggingGrad) return;
        const r = canvas.getBoundingClientRect();
        const cx = e.touches?.[0]?.clientX ?? e.clientX;
        const cy = e.touches?.[0]?.clientY ?? e.clientY;
        _vcp2.s = Math.max(0,Math.min(1,(cx-r.left)/r.width));
        _vcp2.v = Math.max(0,Math.min(1,1-(cy-r.top)/r.height));
        _vcp2ActualizarUI();
    }
    function onHue(e) {
        if (!_vcp2.draggingHue) return;
        const r = hueWrap.getBoundingClientRect();
        const cx = e.touches?.[0]?.clientX ?? e.clientX;
        _vcp2.h = Math.max(0,Math.min(360,((cx-r.left)/r.width)*360));
        _vcp2ActualizarUI();
    }

    canvas.addEventListener('mousedown',  e => { _vcp2.draggingGrad=true; onGrad(e); });
    canvas.addEventListener('touchstart', e => { e.preventDefault(); _vcp2.draggingGrad=true; onGrad(e); }, { passive:false });
    hueWrap.addEventListener('mousedown',  e => { _vcp2.draggingHue=true; onHue(e); });
    hueWrap.addEventListener('touchstart', e => { e.preventDefault(); _vcp2.draggingHue=true; onHue(e); }, { passive:false });
    document.addEventListener('mousemove', e => { onGrad(e); onHue(e); });
    document.addEventListener('touchmove', e => { onGrad(e); onHue(e); }, { passive:false });
    document.addEventListener('mouseup',   () => { _vcp2.draggingGrad=false; _vcp2.draggingHue=false; });
    document.addEventListener('touchend',  () => { _vcp2.draggingGrad=false; _vcp2.draggingHue=false; });

    const hexInput = document.getElementById('vcp2-hex-input');
    if (hexInput) {
        hexInput.addEventListener('paste', e => {
            e.preventDefault();
            const pasted = (e.clipboardData||window.clipboardData).getData('text').replace(/[^0-9a-fA-F#]/g,'').replace('#','').substring(0,6);
            hexInput.value = pasted; vcp2HexInput(pasted);
        });
    }
}

// --- MODAL EDITAR CATEGORÍA (nombre + color + orden) ---

let _mecCatEditando = null;
let _mecOrden       = [];
let _mecDragSrc     = null;

function _mecRenderizarLista() {
    const lista = document.getElementById('mec-lista-orden');
    if (!lista) return;
    lista.innerHTML = '';
    _mecOrden.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'mec-item' + (cat === _mecCatEditando ? ' mec-item--activo' : '');
        item.draggable = true;
        item.dataset.cat = cat;
        item.innerHTML = `
            <span class="mec-drag-handle"><i class="fas fa-grip-vertical"></i></span>
            <span class="mec-item-dot" style="background:${_vcpResolverColor(categorias[cat]?.color)};"></span>
            <span class="mec-item-nombre">${cat}</span>
            <button type="button" class="mec-item-btn-edit" title="Editar" onclick="mecSeleccionarCategoria('${cat.replace(/'/g,"\\'")}')">
                <i class="fas fa-pencil-alt"></i>
            </button>
            <button type="button" class="mec-item-btn-del" title="Eliminar" onclick="mecEliminarCategoria('${cat.replace(/'/g,"\\'")}')">
                <i class="fas fa-trash-alt"></i>
            </button>`;

        item.addEventListener('dragstart', e => {
            _mecDragSrc = cat; e.dataTransfer.effectAllowed = 'move';
            item.classList.add('mec-item--dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('mec-item--dragging');
            lista.querySelectorAll('.mec-item').forEach(el => el.classList.remove('mec-item--over'));
        });
        item.addEventListener('dragover', e => {
            e.preventDefault(); e.dataTransfer.dropEffect = 'move';
            lista.querySelectorAll('.mec-item').forEach(el => el.classList.remove('mec-item--over'));
            item.classList.add('mec-item--over');
        });
        item.addEventListener('drop', e => {
            e.preventDefault();
            if (_mecDragSrc && _mecDragSrc !== cat) {
                const fi = _mecOrden.indexOf(_mecDragSrc), ti = _mecOrden.indexOf(cat);
                _mecOrden.splice(fi, 1); _mecOrden.splice(ti, 0, _mecDragSrc);
                _mecDragSrc = null;
                _mecRenderizarLista();
                _mecAplicarOrden(false);
            }
        });
        lista.appendChild(item);
    });
}

function mecSeleccionarCategoria(cat) {
    _mecCatEditando = cat;
    document.getElementById('mec-nombre').value = cat;
    vcp2SetColor(_vcpResolverColor(categorias[cat]?.color));
    _mecRenderizarLista();
    if (typeof playSound === 'function') playSound('click');
}

async function mecEliminarCategoria(cat) {
    if (typeof playSound === 'function') playSound('click');
    const nProds = categorias[cat]?.prods?.length || 0;
    const msg = nProds > 0
        ? `¿Eliminar la categoría "${cat}"?\n\nTiene ${nProds} producto(s) que también serán eliminados del catálogo.`
        : `¿Eliminar la categoría "${cat}"?`;
    const ok = await mostrarModalConfirmar(msg, { titulo: 'Eliminar categoría', peligroso: true, btnOk: 'Eliminar' });
    if (!ok) return;

    (categorias[cat]?.prods || []).forEach(p => {
        delete preciosLiquidos[p]; delete baseArticulos[p];
        delete promosArticulos[p]; delete stockProductos[p];
    });
    delete categorias[cat];
    const idx = _mecOrden.indexOf(cat);
    if (idx > -1) _mecOrden.splice(idx, 1);

    if (_mecCatEditando === cat) {
        _mecCatEditando = _mecOrden[0] || null;
        if (_mecCatEditando) mecSeleccionarCategoria(_mecCatEditando);
    }

    _persistirProductosCustom();
    localStorage.setItem('vimarStock', JSON.stringify(stockProductos));
    generarIdsProductos();
    _mecRenderizarLista();
    if (typeof renderizarCatalogo      === 'function') renderizarCatalogo();
    if (typeof renderizarSeccionStocks  === 'function') renderizarSeccionStocks();
    if (typeof playSound === 'function') playSound('delete');
}

function _mecAplicarOrden(conSonido = true) {
    const nuevasCategorias = {};
    _mecOrden.forEach(cat => { if (categorias[cat]) nuevasCategorias[cat] = categorias[cat]; });
    Object.keys(categorias).forEach(k => delete categorias[k]);
    Object.assign(categorias, nuevasCategorias);
    _persistirProductosCustom();
    if (typeof renderizarCatalogo      === 'function') renderizarCatalogo();
    if (typeof renderizarSeccionStocks  === 'function') renderizarSeccionStocks();
    if (conSonido && typeof playSound === 'function') playSound('success');
}

function abrirModalEditarCategoria(catInicial) {
    if (typeof playSound === 'function') playSound('click');
    _mecOrden       = Object.keys(categorias);
    _mecCatEditando = catInicial || _mecOrden[0];
    document.getElementById('mec-nombre').value = _mecCatEditando;
    vcp2SetColor(_vcpResolverColor(categorias[_mecCatEditando]?.color));
    _mecRenderizarLista();
    const m = document.getElementById('vimar-modal-editar-cat');
    m.setAttribute('aria-hidden','false');
    m.classList.add('vimar-modal-confirmar--visible');
    vimarActualizarCapaModalBody();
    setTimeout(() => { _vcp2BindEventos(); _vcp2ActualizarUI(); document.getElementById('mec-nombre')?.focus(); }, 60);
}

function cerrarModalEditarCategoria(conSonido = true) {
    const m = document.getElementById('vimar-modal-editar-cat');
    if (!m) return;
    const estabaAbierto = m.classList.contains('vimar-modal-confirmar--visible');
    m.setAttribute('aria-hidden','true');
    m.classList.remove('vimar-modal-confirmar--visible');
    vimarActualizarCapaModalBody();
    if (conSonido && estabaAbierto && typeof playSound === 'function') playSound('click');
}

async function guardarEdicionCategoria() {
    if (!_mecCatEditando) return;
    const nombreNuevo = document.getElementById('mec-nombre').value.trim();
    if (!nombreNuevo) {
        if (typeof playSound === 'function') playSound('error');
        document.getElementById('mec-nombre').classList.add('input-error');
        setTimeout(() => document.getElementById('mec-nombre').classList.remove('input-error'), 600);
        return;
    }
    if (nombreNuevo !== _mecCatEditando && categorias[nombreNuevo]) {
        await mostrarModalAlerta(`Ya existe una categoría llamada "${nombreNuevo}".`, { titulo: 'Nombre duplicado', tipo: 'error' });
        return;
    }

    const nuevoColor = vcp2ObtenerHexActual();

    if (nombreNuevo !== _mecCatEditando) {
        const data = { ...categorias[_mecCatEditando], color: nuevoColor };
        const idx  = _mecOrden.indexOf(_mecCatEditando);
        if (idx > -1) _mecOrden[idx] = nombreNuevo;

        const nuevasCategorias = {};
        _mecOrden.forEach(cat => {
            nuevasCategorias[cat === nombreNuevo ? nombreNuevo : cat] =
                cat === nombreNuevo ? data : categorias[cat];
        });
        Object.keys(categorias).forEach(k => delete categorias[k]);
        Object.assign(categorias, nuevasCategorias);

        if (VIMAR_PREFIJOS_CATEGORIA[_mecCatEditando]) {
            VIMAR_PREFIJOS_CATEGORIA[nombreNuevo] = VIMAR_PREFIJOS_CATEGORIA[_mecCatEditando];
            delete VIMAR_PREFIJOS_CATEGORIA[_mecCatEditando];
        }
        _mecCatEditando = nombreNuevo;
    } else {
        categorias[_mecCatEditando].color = nuevoColor;
    }

    _persistirProductosCustom();
    generarIdsProductos();
    _mecRenderizarLista();
    if (typeof renderizarCatalogo      === 'function') renderizarCatalogo();
    if (typeof renderizarSeccionStocks  === 'function') renderizarSeccionStocks();
    if (typeof playSound === 'function') playSound('success');
    await mostrarModalAlerta('Categoría actualizada.', { titulo: 'Listo', tipo: 'success' });
}