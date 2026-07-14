// ============================================================
// BACKUP.JS — Exportar, importar backup y reiniciar sistema
// ============================================================

function exportarBackup() {
    playSound('click');
    _persistirProductosCustom();

    const data = {
        vimarStock:                      JSON.parse(localStorage.getItem('vimarStock'))                      || {},
        vimarCajaMonto:                  localStorage.getItem('vimarCajaMonto')                              || '0',
        vimarProductosCustom:            JSON.parse(localStorage.getItem('vimarProductosCustom'))            || null,
        vimarHistorial:                  JSON.parse(localStorage.getItem('vimarHistorial'))                  || [],
        historialSemanas:                JSON.parse(localStorage.getItem('historialSemanas'))                || {},
        vimarGastos:                     JSON.parse(localStorage.getItem('vimarGastos'))                     || [],
        vimarHistorialGastos:            JSON.parse(localStorage.getItem('vimarHistorialGastos'))            || {},
        vimarIngresosManuales:           JSON.parse(localStorage.getItem('vimarIngresosManuales'))           || [],
        vimarHistorialIngresosManuales:  JSON.parse(localStorage.getItem('vimarHistorialIngresosManuales'))  || {},
        vimarHistorialEntradas:          JSON.parse(localStorage.getItem('vimarHistorialEntradas'))          || [],
        registrosPendientes:             JSON.parse(localStorage.getItem('registrosPendientes'))             || [],
        ventasTicket:                    JSON.parse(localStorage.getItem('ventasTicket'))                    || [],
        vimarSaldoNetoPorSemana:         JSON.parse(localStorage.getItem('vimarSaldoNetoPorSemana'))         || {},
        'tema-preferido':                localStorage.getItem('tema-preferido')                              || 'dark',
        vimarAtajos:                     localStorage.getItem('vimarAtajos')                                 || null
    };

    const href  = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
    const a     = document.createElement('a');
    const fecha = new Date().toLocaleDateString().replace(/\//g, '-');
    a.setAttribute('href', href);
    a.setAttribute('download', `VIMAR_FULL_BACKUP_${fecha}.json`);
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function abrirSelectorImportarBackup() {
    playSound('click');
    document.getElementById('importFile')?.click();
}

function importarBackup(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);

            const ok = await mostrarModalConfirmar(
                '¿Estás seguro de importar este backup?\n\nEsto borrará todas las ventas, gastos, ingresos manuales, inventario y catálogo de productos actuales y los reemplazará por los del archivo.',
                { titulo: 'Importar backup', peligroso: true, btnOk: 'Importar', btnCancel: 'Cancelar' }
            );
            if (!ok) return;

            const keys = {
                vimarStock:                     data.vimarStock,
                vimarCajaMonto:                 data.vimarCajaMonto,
                vimarProductosCustom:           data.vimarProductosCustom,
                vimarHistorial:                 data.vimarHistorial,
                historialSemanas:               data.historialSemanas,
                vimarGastos:                    data.vimarGastos,
                vimarHistorialGastos:           data.vimarHistorialGastos,
                vimarIngresosManuales:          data.vimarIngresosManuales,
                vimarHistorialIngresosManuales: data.vimarHistorialIngresosManuales,
                vimarHistorialEntradas:         data.vimarHistorialEntradas,
                registrosPendientes:            data.registrosPendientes,
                ventasTicket:                   data.ventasTicket,
                vimarSaldoNetoPorSemana:        data.vimarSaldoNetoPorSemana,
                'tema-preferido':               data['tema-preferido'],
                vimarAtajos:                    data.vimarAtajos
            };

            Object.entries(keys).forEach(([key, val]) => {
                if (val !== undefined && val !== null) {
                    localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
                }
            });

            playSound('success');
            await mostrarModalAlerta('Backup restaurado con éxito. El sistema se reiniciará para aplicar los cambios.', { titulo: 'Importación', tipo: 'success' });
            location.reload();
        } catch(err) {
            await mostrarModalAlerta('El archivo no es un backup válido de VIMAR.', { titulo: 'Error', tipo: 'error' });
            console.error(err);
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

async function limpiarTodoElHistorial() {
    playSound('click');
    const ok = await mostrarModalConfirmar(
        '¿Borrar TODO el historial y datos del sistema?\n\nEsta acción no se puede deshacer.',
        { titulo: 'Reiniciar sistema', peligroso: true, btnOk: 'Borrar todo' }
    );
    if (!ok) return;
    playSound('delete');
    localStorage.clear();
    location.reload();
}