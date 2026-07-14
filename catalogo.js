// ============================================================
// CATALOGO.JS — Catálogo de precios VIMAR (PDF descargable)
// Librería: jsPDF + jsPDF-AutoTable (Letter 215.9×279.4 mm)
// ============================================================

async function generarCatalogoPDF() {

    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        await mostrarModalAlerta(
            'La librería PDF no está disponible. Verifica tu conexión a internet.',
            { titulo: 'Error', tipo: 'error' }
        );
        return;
    }

    // ── Márgenes y medidas (mm) ──────────────────────────────
    const PW  = 215.9;   // ancho Letter
    const PH  = 279.4;   // alto Letter
    const ML  = 8;       // margen izq (Ajustado para mejor centrado)
    const MR  = 8;       // margen der (Ajustado para mejor centrado)
    const TW  = PW - ML - MR;   // ancho de tabla dinámico y exacto
    const FOOTER_H = 8;  // alto del footer
    // El header termina exactamente en Y = 32 (10 margen + 13 espacio + 4 banda colores + 5 franja texto)
    const CONTENT_TOP = 32;              
    const CONTENT_BOT = PH - 14 - FOOTER_H; // Y donde termina contenido

    // ── Paleta de colores: leída desde categorias[] (respeta cambios en la app) ──
    function _hexToRgb(hex) {
        hex = (hex || '').replace('#','').trim();
        if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
        if (hex.length !== 6) return null;
        return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
    }
    function _resolverColorCat(cat) {
        const raw = categorias[cat]?.color || '#039094';
        let hex = raw;
        if (raw.startsWith('var(')) {
            const varName = raw.replace(/^var\(/,'').replace(/\)$/,'').trim();
            hex = getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#039094';
        }
        return _hexToRgb(hex) || [3, 144, 148];
    }
    const COL_CAT = {};
    Object.keys(categorias).forEach(cat => { COL_CAT[cat] = _resolverColorCat(cat); });

    const COL_DEFAULT  = [3, 144, 148];
    const COL_TH_BG    = [67, 173, 122];        // Verde para "PRESENTACIÓN"
    const COL_TH_LIT   = [155, 188, 228];       // Azul Claro para "250 ml", "Precios", etc.
    const COL_TH_FG    = [255, 255, 255];
    const COL_ROW_ODD  = [237, 247, 240];       // Gris/Verde ultra claro
    const COL_ROW_EVN  = [212, 237, 218];       // Verde claro (alternancia)
    const COL_PROD_FG  = [13,  92,  99];        // Texto oscuro teal para productos
    const COL_PRICE_FG = [26, 107,  60];        // Verde para precios
    const COL_PROMO_FG = [230, 81,   0];
    const COL_EMPTY_FG = [200, 200, 200];
    const COL_BORDER   = [178, 223, 219];
    const COL_FOOT_BG  = [3, 144, 148];
    const COL_FOOT_FG  = [255, 255, 255];

    function isLight(c) { return (c[0]*299 + c[1]*587 + c[2]*114)/1000 > 150; }
    function catBg(cat) { return COL_CAT[cat] || COL_DEFAULT; }
    function catFg(cat) { return isLight(catBg(cat)) ? [50,50,50] : [255,255,255]; }

    // ── Presentaciones de litros ─────────────────────────────
    const LT_LABEL = {
        0.25: '250 ml', 0.5: '500 ml',
        1: '1 Litro', 2: '2 Litros', 3: '3 Litros'
    };

    function esArt(cat) { return cat === 'Artículos'; }

    function tienePrecio(prod, cat) {
        if (esArt(cat)) return baseArticulos[prod] != null;
        const lp = preciosLiquidos[prod];
        return lp && Object.values(lp).some(v => v > 0);
    }

    function cmpLiq(a, b) {
        const la = preciosLiquidos[a]||{}, lb = preciosLiquidos[b]||{};
        for (const l of [0.5, 1, 2, 3, 0.25]) {
            const d = (la[l]||9999) - (lb[l]||9999);
            if (d !== 0) return d;
        }
        return a.localeCompare(b, 'es');
    }

    // ── Subcategorías internas de "Artículos" (orden de exhibición) ──
    const ART_SUBGRUPOS = [
        { nombre: 'Escobas y Cepillos de Barrer', prods: ['Escoba Corta','Escoba Simple','Escoba Larga','Escoba Veneciana','Escoba Italy','Cepillo Chueco'] },
        { nombre: 'Trapeadores', prods: ['Trapeador Carpe','Trapeador Simple','Trapeador Amarillo','Trapeador Azul','Trapeador Giratorio'] },
        { nombre: 'Recogedores y Cepillos', prods: ['Recogedor','Escurridor','Escurridor Cuadrado','Escurridor De Verdura','Destapacaños','Cepillo Para Retrete','Cepillo Plancha','Cepillo Manual'] },
        { nombre: 'Fibras y Estropajos', prods: ['Fibra Verde','Fibra Esponja','Fibra Espiral','Fibra Centella','Fibra Blanca','Fibra Metálica Chica','Fibra Metálica Mediana','Fibra Metálica Grande','Estropajo Cuadrado'] },
        { nombre: 'Cubetas y Palanganas', prods: ['Cubeta Chica','Cubeta Exprimidora','Cubeta Exprimidora Grande','Palangana','Cesto Fatima'] },
        { nombre: 'Tendido de Ropa', prods: ['Gancho Para Ropa','Pinza Para Ropa','Mecate Café','Mecate Blanco','Fashion Argolla'] },
        { nombre: 'Coladeras', prods: ['Coladera Chica','Coladera Mediana','Coladera Grande','Coladera Extra Grande'] },
        { nombre: 'Jergas', prods: ['Jerga De 1 Metro','Jerga De Cocina'] },
        { nombre: 'Control de Plagas', prods: ['Atrapa Moscas','Trampa Para Ratones'] },
        { nombre: 'Atomizadores y Aromatizantes', prods: ['Atomizador De 500 ml','Disparador De Atomizador','Neutralizador Aromatizante','Liquido Para Estufa (MONY)'] },
        { nombre: 'Otros Artículos', prods: ['Pastilla De Cloro','Guantes','Bolsa Negra Mediana','Bolsa Negra Jumbo','Cerillos','Encendedor'] },
    ];

    const ART_SUBGRUPO_DE = {};
    ART_SUBGRUPOS.forEach((g, idx) => g.prods.forEach(p => { ART_SUBGRUPO_DE[p] = idx; }));
    const ART_SUBGRUPO_DESCONOCIDO = ART_SUBGRUPOS.length;

    // Keywords para detectar subgrupo de productos nuevos no listados explícitamente
    const ART_KEYWORDS = [
        { idx: 0, kw: ['escoba','cepillo chueco','cepillo barre'] },
        { idx: 1, kw: ['trapeador','mopa'] },
        { idx: 2, kw: ['recogedor','escurridor','destapacaños','cepillo retrete','cepillo plancha','cepillo manual'] },
        { idx: 3, kw: ['fibra','estropajo'] },
        { idx: 4, kw: ['cubeta','palangana','cesto'] },
        { idx: 5, kw: ['gancho','pinza','mecate','tendedero','argolla'] },
        { idx: 6, kw: ['coladera'] },
        { idx: 7, kw: ['jerga'] },
        { idx: 8, kw: ['mosca','raton','trampa','insecto','plaga'] },
        { idx: 9, kw: ['atomizador','disparador','neutralizador','aromatizante','estufa'] },
        { idx: 10, kw: ['pastilla','guante','bolsa negra','bolsa basura','cerillo','encendedor'] },
    ];

    function ordenSubgrupoArt(nombre) {
        if (ART_SUBGRUPO_DE[nombre] !== undefined) return ART_SUBGRUPO_DE[nombre];
        const lower = nombre.toLowerCase();
        for (const { idx, kw } of ART_KEYWORDS) {
            if (kw.some(k => lower.includes(k))) return idx;
        }
        return ART_SUBGRUPO_DESCONOCIDO;
    }

    function cmpArt(a, b) {
        const ga = ordenSubgrupoArt(a), gb = ordenSubgrupoArt(b);
        if (ga !== gb) return ga - gb;
        const d = (baseArticulos[a]||9999) - (baseArticulos[b]||9999);
        return d !== 0 ? d : a.localeCompare(b, 'es');
    }

    function promoStr(prod) {
        const pr = promosArticulos[prod];
        if (!pr || !Object.keys(pr).length) return '';
        const [k, v] = Object.entries(pr)[0];
        return `${k} x $${v}`;
    }

    // ── Logo → base64 ────────────────────────────────────────
    async function imgB64(url) {
        return new Promise(res => {
            const img = new Image();
            // Se elimina img.crossOrigin para evitar bloqueos locales
            img.onload = () => {
                try {
                    const c = document.createElement('canvas');
                    c.width = img.naturalWidth; 
                    c.height = img.naturalHeight;
                    c.getContext('2d').drawImage(img, 0, 0);
                    res({ b64: c.toDataURL('image/png'), w: img.naturalWidth, h: img.naturalHeight });
                } catch (e) {
                    console.error("El navegador bloqueó la conversión de la imagen (Canva Tainted).", e);
                    res(null);
                }
            };
            img.onerror = () => {
                console.error("No se pudo encontrar la imagen en la ruta:", url);
                res(null);
            };
            img.src = url;
        });
    }

    // Al estar en la misma carpeta, basta con llamarla directamente
    const logoData = await imgB64('./LVIMAR.png');

    const hoy   = new Date();
    const FECHA = `${String(hoy.getDate()).padStart(2,'0')} / ${String(hoy.getMonth()+1).padStart(2,'0')} / ${hoy.getFullYear()}`;

    // ── Crear documento ──────────────────────────────────────
    const doc = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });

    // ── Dibujar header ────────────────────────────────────────
    function drawHeader(doc) {
        const y0 = 10; // margen superior de la página

        // Logo
        if (logoData) {
            const lh = 13;
            const lw = (logoData.w / logoData.h) * lh;
            doc.addImage(logoData.b64, 'PNG', ML, y0, lw, lh);
            // "VIMAR" al lado del logo
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16); // Aumentado
            doc.setTextColor(3, 144, 148);
            doc.text('VIMAR', ML + lw + 3, y0 + 9);
        }

        // Texto central "Actualización …"
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12); // Aumentado
        doc.setTextColor(40, 40, 40);
        doc.text(`Actualización ${FECHA}`, PW / 2, y0 + 8, { align: 'center' });

        // Banda decorativa de 5 segmentos (igual a las imágenes)
        const bandY = y0 + 13;
        const segW  = TW / 5;
        const segH  = 4;
        const bandColors = [
            [5,  80, 100],
            [3, 144, 148],
            [39, 174, 96],
            [3, 144, 148],
            [5,  80, 100],
        ];
        bandColors.forEach((col, i) => {
            doc.setFillColor(...col);
            doc.rect(ML + i * segW, bandY, segW, segH, 'F');
        });

        // Franja verde con texto (TONO MÁS CLARO)
        const labelH = 5;
        doc.setFillColor(100, 200, 140); // <-- Color corregido para ser más claro
        doc.rect(ML, bandY + segH, TW, labelH, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);
        doc.text('LISTA DE PRECIOS', PW / 2, bandY + segH + 3.5, { align: 'center' });
    }

    // ── Dibujar footer ────────────────────────────────────────
    function drawFooter(doc) {
        const fy = PH - 12 - FOOTER_H;
        doc.setFillColor(...COL_FOOT_BG);
        doc.rect(ML, fy, TW, FOOTER_H, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10); // Aumentado un poco para legibilidad
        doc.setTextColor(...COL_FOOT_FG);
        doc.text(
            'Tel: (229) 319-17-88  |  Correo: limpiezavimar@gmail.com',
            PW / 2, fy + FOOTER_H / 2 + 1.2,
            { align: 'center' }
        );
    }

    // ── Dibujar encabezado de categoría ──────────────────────
    function drawCatHeader(doc, cat, y) {
        doc.setFillColor(...(COL_CAT[cat] || [3, 144, 148]));
        doc.setDrawColor(0, 0, 0);     // <-- Añadido: Color de borde negro
        doc.setLineWidth(0.2);         // <-- Añadido: Grosor del borde (igual al de la tabla)
        doc.rect(ML, y, TW, 7, 'FD');  // <-- Cambiado: 'FD' dibuja tanto el relleno como el borde
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(cat.toUpperCase(), PW / 2, y + 5, { align: 'center' });
        return y + 7;
    }

    // ── Procesar categorías ───────────────────────────────────
    const bloques = [];
    for (const [cat, data] of Object.entries(categorias)) {
        const isArtCat = esArt(cat);
        const validos  = [...data.prods].filter(p => tienePrecio(p, cat));
        if (!validos.length) continue;

        validos.sort(isArtCat ? cmpArt : cmpLiq);

        let litsUsados = [];
        let head, body, colStyles;

        if (isArtCat) {
            head      = [['PRESENTACIÓN', 'PRECIO UNITARIO', 'PAQUETE']];
            body      = validos.map(p => [p, `$${baseArticulos[p]||0}`, promoStr(p)||'—']);
            colStyles = {
                0: { cellWidth: TW * 0.56, halign: 'center' },
                1: { cellWidth: TW * 0.25, halign: 'center' },
                2: { cellWidth: TW * 0.19, halign: 'center' },
            };
        } else {
            litsUsados = [0.25, 0.5, 1, 2, 3].filter(l =>
                validos.some(p => (preciosLiquidos[p]||{})[l] > 0)
            );
            const nL     = litsUsados.length;
            const wProd  = nL >= 5 ? TW*0.30 : nL >= 4 ? TW*0.34 : TW*0.38;
            const wCol   = (TW - wProd) / nL;
            head         = [['PRESENTACIÓN', ...litsUsados.map(l => LT_LABEL[l])]];
            body         = validos.map(p => {
                const lp = preciosLiquidos[p]||{};
                return [p, ...litsUsados.map(l => lp[l]>0 ? `$${lp[l]}` : '—')];
            });
            colStyles    = { 0: { cellWidth: wProd, halign: 'center' } };
            litsUsados.forEach((_, i) => { colStyles[i+1] = { cellWidth: wCol, halign: 'center' }; });
        }

        bloques.push({ cat, isArt: isArtCat, head, body, colStyles });
    }

    // ── Renderizar con autoTable ──────────────────────────────
    drawHeader(doc);
    drawFooter(doc);

    let cursorY = CONTENT_TOP;

    bloques.forEach((blk) => {
        
        // --- REGLA: Mínimo título, columnas y 3 productos ---
        // 7mm (Título) + ~8mm (Columnas) + ~25mm (3 filas) = ~40mm requeridos
        const espacioRequerido = 40; 
        
        if (cursorY + espacioRequerido > CONTENT_BOT) {
            doc.addPage();
            drawHeader(doc);
            drawFooter(doc);
            cursorY = CONTENT_TOP; 
        }

        const afterCatHead = drawCatHeader(doc, blk.cat, cursorY);
        let firstPageOfBlk = true;

        doc.autoTable({
            head:         blk.head,
            body:         blk.body,
            startY:       afterCatHead,
            tableWidth:   TW, // Ancho de tabla forzado al calculado
            margin:       {
                top:    CONTENT_TOP, // <-- Corrección: exactamente pegado a la franja
                left:   ML,  // Se asegura de alinear exactamente con la cabecera
                right:  MR,
                bottom: PH - CONTENT_BOT,
            },
            columnStyles: blk.colStyles,
            styles: {
                fontSize:    10, // Aumentado de 8 a 10 para coincidir con la imagen
                cellPadding: { top: 2, right: 3, bottom: 2, left: 3 },
                lineColor:   [0, 0, 0],
                lineWidth:   0.2,
                overflow:    'linebreak',
                font:        'helvetica',
                valign:      'middle', // ¡Clave para centrado vertical!
            },
            headStyles: {
                textColor: COL_TH_FG,
                fontStyle: 'bold',
                halign:    'center',
                valign:    'middle',
            },
            alternateRowStyles: { fillColor: COL_ROW_EVN },
            bodyStyles: {
                fillColor: COL_ROW_ODD,
                textColor: COL_PROD_FG,
                fontStyle: 'bold', // Letras negritas para productos/precios
                valign:    'middle',
            },
            didParseCell(d) {
                // 1. Lógica para encabezados (Verde para col 0, Azul claro para el resto)
                if (d.section === 'head') {
                    if (d.column.index === 0) {
                        d.cell.styles.fillColor = COL_TH_BG;
                    } else {
                        d.cell.styles.fillColor = COL_TH_LIT;
                    }
                    return;
                }

                if (d.section !== 'body') return;
                
                const v = d.cell.raw;

                // 2. Lógica para el cuerpo de la tabla
                if (d.column.index === 0) return; // nombre: color ya definido en bodyStyles

                // Forzar centrado horizontal de precios/promos
                d.cell.styles.halign = 'center';

                if (!v || v === '—') {
                    d.cell.styles.textColor  = COL_EMPTY_FG;
                    d.cell.styles.fontStyle  = 'normal';
                } else if (blk.isArt && d.column.index === 2 && v !== '—') {
                    d.cell.styles.textColor  = COL_PROMO_FG;
                    d.cell.styles.fontStyle  = 'bold';
                } else {
                    d.cell.styles.textColor  = COL_PRICE_FG;
                    d.cell.styles.fontStyle  = 'bold';
                }
            },
            willDrawPage(d) {
                if (firstPageOfBlk) { firstPageOfBlk = false; return; }
                drawHeader(doc);
                drawFooter(doc);
                drawCatHeader(doc, blk.cat, d.settings.margin.top); // Ajustado al top exacto sin el -9
            },
        });

        cursorY = doc.lastAutoTable.finalY;
    });

    // ── Guardar ───────────────────────────────────────────────
    const fecha = `${String(hoy.getDate()).padStart(2,'0')}-${String(hoy.getMonth()+1).padStart(2,'0')}-${hoy.getFullYear()}`;
    doc.save(`Catalogo_VIMAR_${fecha}.pdf`);
    playSound('success');
}