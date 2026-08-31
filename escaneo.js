// ============================================================
// ESCANEO.JS — Escaneo de imágenes (fotos de ventas) → días
//              sin archivar, con OCR local (Tesseract.js) y
//              parsing/identificación de productos 100% en código
//              (sin llamadas a APIs de modelos de IA externos)
// ============================================================

const VIMAR_DIAS_BASE = ['LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];

let _scanImagenFile = null;
let _scanResultado  = null; // días ya emparejados, pendientes de confirmar

// ── Orden y detección de días ────────────────────────────────

function _scanNormalizarTexto(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

const _SCAN_MAPA_DIAS = { LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves', VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo' };

// Reconoce rótulos tipo "Jueves 13/08/2026", "Jueves 13 / 08 / 2026", "Domingo16/08/2026" o solo "Jueves".
// El /año (2026 o 26) se ignora siempre; solo se conserva "Jueves 13/08".
function _scanParsearEncabezadoDia(linea) {
    const l = linea.trim();
    const m = l.match(/^(\p{L}+)(?:\s*(\d{1,2})\s*\/\s*(\d{1,2})(?:\s*\/\s*\d{2,4})?)?/u);
    if (!m) return null;

    const palabra = _scanNormalizarTexto(m[1]).replace(/[^A-Z]/g, '');
    if (palabra.length < 4) return null;

    let diaBase = VIMAR_DIAS_BASE.find(d => palabra === d || palabra.startsWith(d));
    if (!diaBase) {
        // Tolerancia a errores de OCR en la palabra del día (distancia de edición)
        let mejor = null, mejorDist = Infinity;
        VIMAR_DIAS_BASE.forEach(d => {
            const dist = _scanLevenshtein(palabra.substring(0, d.length), d);
            if (dist < mejorDist) { mejorDist = dist; mejor = d; }
        });
        if (mejor && mejorDist <= 2) diaBase = mejor;
    }
    if (!diaBase) return null;

    // El resto de la línea (tras el encabezado) debe ser prácticamente nada; si no, no es un rótulo de día.
    const resto = l.slice(m[0].length).trim();
    if (resto.length > 3) return null;

    let nombre = _SCAN_MAPA_DIAS[diaBase];
    if (m[2] && m[3]) nombre += ` ${m[2].padStart(2, '0')}/${m[3].padStart(2, '0')}`;
    return nombre;
}

function _scanEsLineaDeDia(linea) {
    return _scanParsearEncabezadoDia(linea) !== null;
}

function _scanExtraerNombreDia(linea) {
    return _scanParsearEncabezadoDia(linea) || linea.trim();
}

function _scanOrdenDia(nombreDia) {
    const primeraPalabra = String(nombreDia || '').trim().split(/\s+/)[0];
    const norm = _scanNormalizarTexto(primeraPalabra).replace(/[^A-Z]/g, '');
    const idx = VIMAR_DIAS_BASE.findIndex(d => norm.startsWith(d));
    return idx === -1 ? 999 : idx;
}

// ── Normalización para comparar nombres de producto ──────────

function _scanNormalizarProducto(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function _scanLevenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1]
                : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
        }
    }
    return dp[m][n];
}

// ── Emparejamiento con catálogo: ID exacto → nombre exacto → más similar ──

function _scanEmparejarProducto(nombreDetectado) {
    const norm = _scanNormalizarProducto(nombreDetectado);
    if (!norm) return null;

    // 1. ¿El texto detectado contiene un ID de producto conocido? (ej: DETXXX07)
    const posiblesIds = String(nombreDetectado).toUpperCase().match(/[A-Z]{3,6}\d{2}/g) || [];
    for (const idCand of posiblesIds) {
        if (idProductoMap[idCand]) return { nombre: idProductoMap[idCand], metodo: 'id' };
    }

    const todos = Object.keys(productoIdMap);
    if (todos.length === 0) return null;

    // 2. Nombre exacto (normalizado)
    const exacto = todos.find(p => _scanNormalizarProducto(p) === norm);
    if (exacto) return { nombre: exacto, metodo: 'exacto' };

    // 3. Coincidencia por subcadena (nombre detectado contiene o está contenido en un producto)
    const porSubcadena = todos.find(p => {
        const pn = _scanNormalizarProducto(p);
        return pn.length >= 4 && (norm.includes(pn) || pn.includes(norm));
    });
    if (porSubcadena) return { nombre: porSubcadena, metodo: 'subcadena' };

    // 4. Nombre más similar (distancia de Levenshtein)
    let mejor = null, mejorDist = Infinity;
    todos.forEach(p => {
        const d = _scanLevenshtein(norm, _scanNormalizarProducto(p));
        if (d < mejorDist) { mejorDist = d; mejor = p; }
    });
    const umbral = Math.max(3, Math.floor((mejor?.length || 0) * 0.4));
    if (mejor && mejorDist <= umbral) return { nombre: mejor, metodo: 'similar', distancia: mejorDist };

    return null;
}

// ── Cálculo de precio (misma lógica que recalcularFila en ui.js) ────

function _scanCalcularSubtotal(nombreProducto, cantidad) {
    const cant = parseFloat(cantidad);
    if (isNaN(cant) || cant <= 0) return null;

    if (preciosLiquidos[nombreProducto]) {
        const lp = preciosLiquidos[nombreProducto];
        if (lp[cant]) return lp[cant];
        if (cant % 3 === 0 && lp[3]) return (lp[3] / 3) * cant;
        if (cant > 3 && lp[3]) {
            const puMayoreo = lp[3] / 3;
            if (Number.isInteger(puMayoreo)) return puMayoreo * cant;
        }
        return null;
    }
    if (promosArticulos[nombreProducto] && promosArticulos[nombreProducto][cant]) {
        return promosArticulos[nombreProducto][cant];
    }
    if (baseArticulos[nombreProducto] != null) {
        return cant * baseArticulos[nombreProducto];
    }
    return null;
}

// ── Parsing de líneas de texto OCR → {nombre, cantidad, subtotal} ────
// Formato real esperado: "1 L. M. Limpio $12", "1L. Creolina $30",
// "10 Litros Cloro $60", "5L Cloro $30", "2 Arom. Manzana- Canela $55"
// (la unidad L/L./Lts/Litros es opcional; el nombre puede llevar puntos,
// abreviaturas y guiones internos; el precio siempre va marcado con $).

function _scanParsearLineaProducto(linea) {
    const l = linea.trim();
    if (!l || l.length < 4) return null;

    const m = l.match(/^(\d+(?:[.,]\d+)?)\s*(?:L\.?|LTS?\.?|LITROS?\.?)?\s*[:\-]?\s*(.+?)\s*\$\s*(\d+(?:[.,]\d{1,2})?)/i);
    if (!m) return null;

    const cantidad = parseFloat(m[1].replace(',', '.'));
    const nombre   = m[2].replace(/[.\-\s]+$/, '').trim();
    const subtotal = parseFloat(m[3].replace(',', '.'));

    if (isNaN(cantidad) || cantidad <= 0 || !nombre || nombre.length < 2) return null;
    return { nombre, cantidad, subtotal: isNaN(subtotal) ? null : subtotal };
}

// ── OCR con Tesseract.js (100% local, sin API de IA externa) ────

async function _scanEjecutarOCR(file, onProgress) {
    if (typeof Tesseract === 'undefined') {
        throw new Error('Falta cargar la librería Tesseract.js (revisa el script en index.html).');
    }
    const { data } = await Tesseract.recognize(file, 'spa', {
        logger: info => {
            if (onProgress && info.status === 'recognizing text') {
                onProgress(Math.round((info.progress || 0) * 100));
            }
        }
    });
    return data.text || '';
}

// ── Texto OCR → días → productos emparejados (lógica propia) ────

function _scanProcesarTexto(textoCrudo) {
    const lineas = textoCrudo.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);

    const bloques = []; // [{dia, lineas:[...]}]
    let actual = null;

    lineas.forEach(linea => {
        if (_scanEsLineaDeDia(linea)) {
            actual = { dia: _scanExtraerNombreDia(linea), lineas: [] };
            bloques.push(actual);
        } else if (actual) {
            actual.lineas.push(linea);
        }
        // Líneas antes de detectar el primer día se ignoran (no sabemos a qué día pertenecen)
    });

    const diasProcesados = [];
    const noEmparejados  = [];

    bloques
        .sort((a, b) => _scanOrdenDia(a.dia) - _scanOrdenDia(b.dia))
        .forEach(bloque => {
            const detalles = [];
            bloque.lineas.forEach(linea => {
                const parsed = _scanParsearLineaProducto(linea);
                if (!parsed) return;
                const match = _scanEmparejarProducto(parsed.nombre);
                if (!match) { noEmparejados.push(`${bloque.dia}: "${parsed.nombre}"`); return; }

                let subtotal = parsed.subtotal;
                if (subtotal == null || isNaN(subtotal) || subtotal <= 0) {
                    subtotal = _scanCalcularSubtotal(match.nombre, parsed.cantidad);
                }
                if (subtotal == null || isNaN(subtotal)) { noEmparejados.push(`${bloque.dia}: "${parsed.nombre}" (sin precio)`); return; }

                detalles.push({ Producto: match.nombre, Cantidad: parsed.cantidad, Subtotal: parseFloat(subtotal.toFixed(2)) });
            });

            if (detalles.length > 0) {
                diasProcesados.push({
                    Día: bloque.dia,
                    Total: detalles.reduce((a, b) => a + b.Subtotal, 0),
                    Detalles: detalles,
                    esTemporal: true
                });
            }
        });

    return { diasProcesados, noEmparejados };
}

async function vimarEscanearImagen() {
    if (!_scanImagenFile) {
        playSound('error');
        await mostrarModalAlerta('Primero adjunta una imagen.', { titulo: 'Escaneo', tipo: 'error' });
        return;
    }

    const btn = document.getElementById('vimar-scan-btn-procesar');
    if (btn) { btn.disabled = true; btn.textContent = 'Leyendo imagen... 0%'; }
    playSound('click');

    try {
        const texto = await _scanEjecutarOCR(_scanImagenFile, (pct) => {
            if (btn) btn.textContent = `Leyendo imagen... ${pct}%`;
        });

        const { diasProcesados, noEmparejados } = _scanProcesarTexto(texto);

        if (diasProcesados.length === 0) {
            playSound('error');
            await mostrarModalAlerta(
                'No se pudo reconocer ningún día/producto en la imagen.\n\nAsegúrate de que la foto sea nítida y que cada día esté claramente rotulado (ej: "Lunes").',
                { titulo: 'Escaneo', tipo: 'error' }
            );
            return;
        }

        _scanResultado = diasProcesados;
        _scanMostrarResumen(diasProcesados, noEmparejados);

    } catch (err) {
        console.error('Error de escaneo:', err);
        playSound('error');
        await mostrarModalAlerta('Error al procesar la imagen: ' + err.message, { titulo: 'Escaneo', tipo: 'error' });
    } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Escanear Imagen'; }
    }
}

function _scanMostrarResumen(dias, noEmparejados) {
    const cont = document.getElementById('vimar-scan-resultado');
    if (!cont) return;
    let html = '';
    dias.forEach(d => {
        html += `<div class="vimar-info-seccion"><b>${d.Día}</b> — $${d.Total.toFixed(2)}<br>`;
        d.Detalles.forEach(p => { html += `&nbsp;&nbsp;• ${p.Producto}: ${p.Cantidad} → $${p.Subtotal.toFixed(2)}<br>`; });
        html += `</div>`;
    });
    if (noEmparejados.length) {
        html += `<div class="vimar-info-seccion" style="color:#ff8080;"><b>No identificados / omitidos:</b><br>${noEmparejados.join('<br>')}</div>`;
    }
    cont.innerHTML = html;
    cont.style.display = 'block';
    const btnConfirmar = document.getElementById('vimar-scan-btn-confirmar');
    if (btnConfirmar) btnConfirmar.style.display = 'inline-block';
}

async function vimarConfirmarEscaneo() {
    if (!_scanResultado || _scanResultado.length === 0) return;
    playSound('click');

    _scanResultado.forEach(dia => {
        dia.Detalles.forEach(p => actualizarStock(p.Producto, p.Cantidad, 'descontar'));
    });
    registrosPendientes.push(..._scanResultado);
    localStorage.setItem('registrosPendientes', JSON.stringify(registrosPendientes));

    const totalDias = _scanResultado.length;
    _scanResultado = null;
    cerrarModalEscaneo(false);

    calcularTodo();
    actualizarGraficas();
    if (document.getElementById('seccionHistorial')?.classList.contains('vimar-seccion-activa')) renderizarTablasHistorial();

    playSound('success');
    await mostrarModalAlerta(`${totalDias} día(s) agregado(s) a "Días sin archivar".`, { titulo: 'Escaneo completado', tipo: 'success' });
}

// ── Modal (creado dinámicamente) ─────────────────────────────

function _scanCrearModal() {
    if (document.getElementById('vimar-modal-escaneo')) return;
    const div = document.createElement('div');
    div.id = 'vimar-modal-escaneo';
    div.className = 'vimar-modal-confirmar';
    div.setAttribute('aria-hidden', 'true');
    div.innerHTML = `
        <div class="vimar-modal-confirmar-backdrop" onclick="cerrarModalEscaneo()"></div>
        <div class="vimar-modal-confirmar-caja" style="max-width:560px;max-height:85vh;overflow-y:auto;">
            <div class="vimar-modal-confirmar-glow"></div>
            <h3 class="vimar-modal-confirmar-titulo">Escanear Imagen de Ventas</h3>
            <p class="vimar-modal-confirmar-msg" style="margin-bottom:14px;">
                Sube una foto donde cada día esté rotulado (ej: "Jueves 13/08/2026", el año se ignora)
                seguido de líneas tipo "1 L. Producto $12" o "10 Litros Producto $60".
            </p>
            <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px;">
                <input type="file" id="vimar-scan-input" accept="image/*" class="vimar-modal-prompt-input">
                <img id="vimar-scan-preview" style="display:none;max-width:100%;max-height:260px;border-radius:8px;object-fit:contain;">
                <div id="vimar-scan-resultado" style="display:none;font-size:0.85em;line-height:1.6;max-height:220px;overflow-y:auto;"></div>
            </div>
            <div class="vimar-modal-confirmar-actions">
                <button type="button" onclick="cerrarModalEscaneo()" class="vimar-modal-confirmar-btn vimar-modal-confirmar-btn--ghost">Cerrar</button>
                <button type="button" id="vimar-scan-btn-confirmar" onclick="vimarConfirmarEscaneo()"
                    class="vimar-modal-confirmar-btn vimar-modal-confirmar-btn--primary" style="display:none;">Guardar en Días Pendientes</button>
                <button type="button" id="vimar-scan-btn-procesar" onclick="vimarEscanearImagen()"
                    class="vimar-modal-confirmar-btn vimar-modal-confirmar-btn--primary">Escanear Imagen</button>
            </div>
        </div>`;
    document.body.appendChild(div);

    document.getElementById('vimar-scan-input').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        _scanImagenFile = file;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = document.getElementById('vimar-scan-preview');
            img.src = ev.target.result;
            img.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
}

function vimarAbrirEscaneo() {
    playSound('click');
    _scanCrearModal();
    _scanImagenFile = null; _scanResultado = null;
    document.getElementById('vimar-scan-input').value = '';
    document.getElementById('vimar-scan-preview').style.display = 'none';
    document.getElementById('vimar-scan-resultado').style.display = 'none';
    document.getElementById('vimar-scan-btn-confirmar').style.display = 'none';
    const m = document.getElementById('vimar-modal-escaneo');
    m.setAttribute('aria-hidden', 'false');
    m.classList.add('vimar-modal-confirmar--visible');
    vimarActualizarCapaModalBody();
}

function cerrarModalEscaneo(conSonido = true) {
    const m = document.getElementById('vimar-modal-escaneo');
    if (!m) return;
    m.setAttribute('aria-hidden', 'true');
    m.classList.remove('vimar-modal-confirmar--visible');
    vimarActualizarCapaModalBody();
    if (conSonido && typeof playSound === 'function') playSound('click');
}