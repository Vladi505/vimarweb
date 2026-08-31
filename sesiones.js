// ============================================================
// SESION.JS — Roles, login y permisos de usuario
// ============================================================

const VIMAR_USUARIOS = {
    'admin':    { pass: 'Vimar2024_.,', rol: 'admin' },
    'vendedor': { pass: 'vimar2024',    rol: 'vendedor' }
};

let vimarRolActual = null; // 'admin' | 'vendedor' | null

function intentarLogin() {
    playSound('click');
    const u    = document.getElementById('login-usuario')?.value?.trim();
    const p    = document.getElementById('login-pass')?.value;
    const errEl = document.getElementById('login-error');
    const user  = VIMAR_USUARIOS[u];

    if (!user || user.pass !== p) {
        if (errEl) { errEl.textContent = 'Usuario o contraseña incorrectos.'; errEl.style.display = 'block'; }
        playSound('error');
        return;
    }

    vimarRolActual = user.rol;
    sessionStorage.setItem('vimarRol',  vimarRolActual);
    sessionStorage.setItem('vimarUser', u);
    document.getElementById('vimar-login-screen').style.display = 'none';
    playSound('success');
    if (typeof vimarInicializarApp === 'function') vimarInicializarApp();
}

function aplicarPermisosPorRol() {
    const esAdmin = vimarRolActual === 'admin';

    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = esAdmin ? '' : 'none';
    });

    const botonesAdmin = [
        'verHistorial', 'verHistorialIngresosManuales', 'verHistorialGastos',
        'verStocks', 'verHistorialInventario', 'verGraficasMetricas'
    ];
    document.querySelectorAll('.sidebar-nav-btn').forEach(btn => {
        const fn = btn.getAttribute('onclick') || '';
        if (botonesAdmin.some(b => fn.includes(b))) btn.style.display = esAdmin ? '' : 'none';
    });

    document.querySelectorAll('.btn-exportar-backup, .btn-importar-backup, .btn-reiniciar-sistema')
        .forEach(el => el.style.display = esAdmin ? '' : 'none');

    const btnSesion  = document.getElementById('btn-cerrar-sesion');
    const lblUsuario = document.getElementById('btn-sesion-usuario');
    if (btnSesion)  btnSesion.style.display  = 'flex';
    if (lblUsuario) lblUsuario.textContent   = sessionStorage.getItem('vimarUser') || vimarRolActual;
}

function cerrarSesion() {
    sessionStorage.removeItem('vimarRol');
    sessionStorage.removeItem('vimarUser');
    vimarRolActual = null;

    const btnSesion = document.getElementById('btn-cerrar-sesion');
    if (btnSesion) btnSesion.style.display = 'none';

    const loginEl = document.getElementById('vimar-login-screen');
    if (loginEl) {
        loginEl.style.display = 'flex';
        document.getElementById('login-usuario').value = '';
        document.getElementById('login-pass').value    = '';
        document.getElementById('login-error').style.display = 'none';
    }

    if (typeof vimarActivarSeccionPrincipal === 'function') vimarActivarSeccionPrincipal();
    playSound('sidebar');
}