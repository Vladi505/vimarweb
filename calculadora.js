// ============================================================
// CALCULADORA FLOTANTE VIMAR — calculadora.js  (F1)
// ============================================================
(function () {
    let _visible = false;

    // Estado de la calculadora
    // operandoA: número acumulado izquierdo
    // operador:  operador pendiente (+, -, *, /)
    // entrada:   string del número que el usuario está escribiendo
    // esperandoOperando: true justo después de presionar un operador o =
    let _state = _estadoInicial();

    function _estadoInicial() {
        return { operandoA: null, operador: null, entrada: '0', esperando: false, exprStr: '' };
    }

    // ── DOM ──────────────────────────────────────────────────
    function _crear() {
        if (document.getElementById('vimar-calc')) return;
        const el = document.createElement('div');
        el.id = 'vimar-calc';
        el.innerHTML = `
            <div id="vimar-calc-header">
                <span style="font-size:0.8em;font-weight:900;letter-spacing:2px;opacity:0.7;">CALCULADORA</span>
                <span id="vimar-calc-close" title="Cerrar (F1)">✕</span>
            </div>
            <div id="vimar-calc-display">
                <div id="vimar-calc-expr"></div>
                <div id="vimar-calc-result">0</div>
            </div>
            <div id="vimar-calc-btns">
                <button class="vc-btn vc-fn" data-ac="AC">AC</button>
                <button class="vc-btn vc-fn" data-ac="+/-">+/-</button>
                <button class="vc-btn vc-fn" data-ac="%">%</button>
                <button class="vc-btn vc-op" data-ac="/">÷</button>

                <button class="vc-btn" data-ac="7">7</button>
                <button class="vc-btn" data-ac="8">8</button>
                <button class="vc-btn" data-ac="9">9</button>
                <button class="vc-btn vc-op" data-ac="*">×</button>

                <button class="vc-btn" data-ac="4">4</button>
                <button class="vc-btn" data-ac="5">5</button>
                <button class="vc-btn" data-ac="6">6</button>
                <button class="vc-btn vc-op" data-ac="-">−</button>

                <button class="vc-btn" data-ac="1">1</button>
                <button class="vc-btn" data-ac="2">2</button>
                <button class="vc-btn" data-ac="3">3</button>
                <button class="vc-btn vc-op" data-ac="+">+</button>

                <button class="vc-btn vc-zero" data-ac="0">0</button>
                <button class="vc-btn" data-ac=".">.</button>
                <button class="vc-btn vc-eq" data-ac="=">=</button>
            </div>
            <div id="vimar-calc-resize"></div>
        `;
        document.body.appendChild(el);
        el.style.left = Math.max(20, (window.innerWidth  - 280) / 2) + 'px';
        el.style.top  = Math.max(80, (window.innerHeight - 420) / 2) + 'px';
        _bindEventos(el);
    }

    // ── Helpers display ───────────────────────────────────────
    function _setDisplay(val) { document.getElementById('vimar-calc-result').textContent = val; }
    function _setExpr(val)    { document.getElementById('vimar-calc-expr').textContent = val; }
    function _getDisplay()    { return document.getElementById('vimar-calc-result').textContent; }

    function _fmt(n) {
        if (!isFinite(n)) return 'Error';
        // Máximo 10 dígitos significativos, sin ceros finales
        let s = parseFloat(n.toPrecision(10)).toString();
        return s;
    }

    function _opSimbolo(op) {
        return op === '/' ? '÷' : op === '*' ? '×' : op === '-' ? '−' : '+';
    }

    // ── Aplicar operación pendiente ───────────────────────────
    function _calcular(a, op, b) {
        switch(op) {
            case '+': return a + b;
            case '-': return a - b;
            case '*': return a * b;
            case '/': return b === 0 ? Infinity : a / b;
        }
        return b;
    }

    // ── Lógica principal ─────────────────────────────────────
    function _presionar(ac) {
        const s = _state;

        // AC — reset total
        if (ac === 'AC') {
            _state = _estadoInicial();
            _setDisplay('0'); _setExpr(''); return;
        }

        // +/-
        if (ac === '+/-') {
            const v = parseFloat(_getDisplay());
            if (!isNaN(v) && v !== 0) _setDisplay(_fmt(-v));
            return;
        }

        // %
        if (ac === '%') {
            const v = parseFloat(_getDisplay());
            if (!isNaN(v)) {
                // Si hay operando acumulado, calcular % relativo (ej: 200 + 10% = 200 + 20)
                if (s.operandoA !== null && (s.operador === '+' || s.operador === '-')) {
                    _setDisplay(_fmt(s.operandoA * v / 100));
                } else {
                    _setDisplay(_fmt(v / 100));
                }
                s.entrada = _getDisplay();
            }
            return;
        }

        // OPERADOR (+, -, *, /)
        if (['+','-','*','/'].includes(ac)) {
            const valorActual = parseFloat(_getDisplay());

            if (s.operandoA !== null && !s.esperando) {
                // Encadenar: evaluar lo que hay y el resultado pasa a ser operandoA
                const res = _calcular(s.operandoA, s.operador, valorActual);
                s.operandoA = res;
                _setDisplay(_fmt(res));
            } else {
                s.operandoA = valorActual;
            }

            s.operador  = ac;
            s.esperando = true;
            s.entrada   = '0';
            _setExpr(_fmt(s.operandoA) + ' ' + _opSimbolo(ac));
            return;
        }

        // IGUAL
        if (ac === '=') {
            if (s.operandoA === null || s.operador === null) {
                // Nada pendiente, solo mostrar
                _setExpr(_getDisplay() + ' =');
                return;
            }
            const b = parseFloat(_getDisplay());
            const res = _calcular(s.operandoA, s.operador, b);
            _setExpr(_fmt(s.operandoA) + ' ' + _opSimbolo(s.operador) + ' ' + _fmt(b) + ' =');
            _setDisplay(_fmt(res));
            // Guardar operandoB y operador para repetir = al estilo calculadora real
            s.operandoA = null;
            s.operador  = null;
            s.esperando = false;
            s.entrada   = _fmt(res);
            return;
        }

        // PUNTO
        if (ac === '.') {
            if (s.esperando) { _setDisplay('0.'); s.esperando = false; s.entrada = '0.'; return; }
            if (_getDisplay().includes('.')) return;
            _setDisplay(_getDisplay() + '.');
            s.entrada = _getDisplay();
            return;
        }

        // DÍGITO
        if (s.esperando) {
            // Empezar nuevo número
            _setDisplay(ac === '0' ? '0' : ac);
            s.esperando = false;
            s.entrada = _getDisplay();
        } else {
            const actual = _getDisplay();
            if (actual === '0' || actual === 'Error') _setDisplay(ac);
            else _setDisplay(actual + ac);
            s.entrada = _getDisplay();
        }
    }

    // ── Teclado físico ────────────────────────────────────────
    function _keyCalc(e) {
        if (!_visible) return;
        if (e.target && e.target.tagName === 'INPUT') return;
        const map = {
            '0':'0','1':'1','2':'2','3':'3','4':'4',
            '5':'5','6':'6','7':'7','8':'8','9':'9',
            '.':'.', ',':'.', 'Enter':'=', '=':'=',
            '+':'+', '-':'-', '*':'*', '/':'/',
            'Backspace':'__back__', 'Escape':'__esc__', 'Delete':'AC'
        };
        const ac = map[e.key];
        if (!ac) return;
        e.preventDefault();
        if (ac === '__esc__') { _toggle(); return; }
        if (ac === '__back__') {
            const d = document.getElementById('vimar-calc-result');
            if (d.textContent.length > 1 && d.textContent !== 'Error') {
                d.textContent = d.textContent.slice(0, -1) || '0';
            } else {
                d.textContent = '0';
            }
            _state.entrada = d.textContent;
            return;
        }
        _presionar(ac);
    }

    // ── Drag ──────────────────────────────────────────────────
    function _bindDrag(el) {
        const header = document.getElementById('vimar-calc-header');
        let ox, oy, sx, sy;
        header.addEventListener('mousedown', e => {
            if (e.target.id === 'vimar-calc-close') return;
            sx = e.clientX; sy = e.clientY;
            ox = el.offsetLeft; oy = el.offsetTop;
            const mv = ev => {
                el.style.left = Math.max(0, ox + ev.clientX - sx) + 'px';
                el.style.top  = Math.max(0, oy + ev.clientY - sy) + 'px';
            };
            const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
            document.addEventListener('mousemove', mv);
            document.addEventListener('mouseup', up);
        });
    }

    // ── Resize ────────────────────────────────────────────────
    function _bindResize(el) {
        const h = document.getElementById('vimar-calc-resize');
        let sx, sy, sw, sh;
        h.addEventListener('mousedown', e => {
            e.preventDefault();
            sx = e.clientX; sy = e.clientY;
            sw = el.offsetWidth; sh = el.offsetHeight;
            const mv = ev => {
                el.style.width  = Math.max(240, sw + ev.clientX - sx) + 'px';
                el.style.height = Math.max(360, sh + ev.clientY - sy) + 'px';
            };
            const up = () => { document.removeEventListener('mousemove', mv); document.removeEventListener('mouseup', up); };
            document.addEventListener('mousemove', mv);
            document.addEventListener('mouseup', up);
        });
    }

    // ── Bind eventos ─────────────────────────────────────────
    function _bindEventos(el) {
        _bindDrag(el);
        _bindResize(el);
        document.getElementById('vimar-calc-close').addEventListener('click', _toggle);
        el.querySelectorAll('.vc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (typeof playSound === 'function') playSound('click');
                _presionar(btn.dataset.ac);
            });
        });
        document.addEventListener('keydown', _keyCalc);
    }

    // ── Toggle ────────────────────────────────────────────────
    function _toggle() {
        _crear();
        const el = document.getElementById('vimar-calc');
        _visible = !_visible;
        el.style.display = _visible ? 'flex' : 'none';
        if (typeof playSound === 'function') playSound('click');
    }

    window.vimarToggleCalc = _toggle;
})();