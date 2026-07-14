// ============================================================
// CONFIG.JS — Datos de catálogo, estado inicial, IDs de producto
// ============================================================

// --- CATÁLOGO BASE ---

const preciosLiquidos = {};

const baseArticulos = {};

const promosArticulos = {};

const categorias = {};

// --- ESTADO DE LA APLICACIÓN ---

let stockProductos                    = JSON.parse(localStorage.getItem('vimarStock'))                      || {};
let historialSemanas                  = JSON.parse(localStorage.getItem('historialSemanas'))                 || {};
let registrosPendientes               = JSON.parse(localStorage.getItem('registrosPendientes'))              || [];
let gastosArray                       = JSON.parse(localStorage.getItem('vimarGastos'))                      || [];
let ingresosManualesArray             = JSON.parse(localStorage.getItem('vimarIngresosManuales'))            || [];
let ventasTicket                      = JSON.parse(localStorage.getItem('ventasTicket'))                     || [];
let detalleVentas                     = JSON.parse(localStorage.getItem('detalleVentas'))                    || [];
let resumenDias                       = JSON.parse(localStorage.getItem('resumenDias'))                      || [];
let historialEntradas                 = JSON.parse(localStorage.getItem('vimarHistorialEntradas'))           || [];
let historialGastosSemanales          = JSON.parse(localStorage.getItem('vimarHistorialGastos'))             || {};
let historialIngresosManualesSemanales= JSON.parse(localStorage.getItem('vimarHistorialIngresosManuales'))  || {};
let saldoNetoPorSemana                = JSON.parse(localStorage.getItem('vimarSaldoNetoPorSemana'))          || {};
let filtroGraficaActual               = localStorage.getItem('vimarFiltroGrafica')                          || 'general';
let soloMostrarBajoStock              = false;
let focusElement                      = null;
let gI                                = null;
let gC                                = null;

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// --- IDs DE PRODUCTO ---

const VIMAR_PREFIJOS_CATEGORIA = {};

let productoIdMap = {};
let idProductoMap = {};

const VIMAR_CONECTORES       = new Set(['DE','DEL','LA','EL','LOS','LAS','CON','PARA','Y','EN','A']);
const VIMAR_PALABRAS_IGNORADAS = new Set(['SHAMPOO']);