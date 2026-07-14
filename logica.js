// ============================================================
// LOGICA.JS — Orquestación principal
// Depurado: la lógica de negocio vive en módulos separados:
//   audio.js     → playSound
//   finanzas.js  → calcularTodo, saldo, caja, gastos, ingresos
//   ventas.js    → ticket, día, semana
//   historial.js → edición/eliminación del historial
//   stock_ops.js → actualizarStock, inventario
//   excel.js     → generarExcel*, vimarImporteALetrasMX
//   backup.js    → exportar/importar/limpiar
//   sesion.js    → login, roles, permisos
// ============================================================

// Alias de compatibilidad por si algún lugar llama guardarTodo desde logica
// (la función real está en historial.js)