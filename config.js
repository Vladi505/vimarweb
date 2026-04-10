// --- CONFIGURACIÓN Y ESTADO INICIAL ---

const preciosLiquidos = {
    "Persil Verde": {0.5: 10, 1: 16, 2: 30, 3: 40}, "Persil Transparente": {0.5: 10, 1: 16, 2: 30, 3: 40},
    "Mas Color": {0.5: 10, 1: 16, 2: 30, 3: 40}, "Ariel": {0.5: 10, 1: 16, 2: 30, 3: 40},
    "Zote Blanco": {0.5: 10, 1: 16, 2: 30, 3: 40}, "Zote Rosa": {0.5: 10, 1: 18, 2: 32, 3: 42},
    "Zote Con Pinol": {0.5: 10, 1: 18, 2: 32, 3: 42}, "Foca": {0.5: 10, 1: 18, 2: 32, 3: 42},
    "Vanish Rosa": {0.5: 10, 1: 18, 2: 32, 3: 42}, "Ace": {0.5: 10, 1: 18, 2: 32, 3: 42},
    "Roma": {0.5: 10, 1: 18, 2: 32, 3: 42}, "Vel Rosita": {0.5: 10, 1: 18, 2: 32, 3: 42},
    "Desmugrante": {0.5: 10, 1: 18, 2: 32, 3: 42}, "Carisma": {0.5: 10, 1: 18, 2: 32, 3: 42},
    "Axion Limon": {0.5: 12, 1: 20, 2: 35, 3: 45}, "S Carisma": {0.5: 10, 1: 16, 2: 30, 3: 40},
    "S Paris Hilton": {0.5: 10, 1: 18, 2: 32, 3: 42}, "S Primavera": {0.5: 12, 1: 20, 2: 38, 3: 50},
    "S Vainilla/Floral": {0.5: 12, 1: 20, 2: 38, 3: 50}, "S Downy": {0.5: 12, 1: 20, 2: 38, 3: 50},
    "S Bebe": {0.5: 12, 1: 20, 2: 38, 3: 50}, "S Frutal": {0.5: 12, 1: 20, 2: 38, 3: 50},
    "S Microcapsulas": {0.5: 15, 1: 25, 2: 40, 3: 55}, "F Manzana Canela": {0.5: 7, 1: 10, 2: 17, 3: 25},
    "F Chica Fresa": {0.5: 7, 1: 10, 2: 17, 3: 25}, "F Brisa Marina": {0.5: 7, 1: 10, 2: 17, 3: 25},
    "F Channel": {0.5: 7, 1: 10, 2: 17, 3: 25}, "F Chicle": {0.5: 7, 1: 10, 2: 17, 3: 25},
    "F Limon": {0.5: 7, 1: 10, 2: 17, 3: 25}, "F Lavanda": {0.5: 7, 1: 10, 2: 17, 3: 25},
    "F Menta": {0.5: 7, 1: 10, 2: 17, 3: 25}, "F Naranja": {0.5: 7, 1: 10, 2: 17, 3: 25},
    "Pinol Blanco": {0.5: 7, 1: 10, 2: 17, 3: 25}, "Pinol Verde": {0.5: 8, 1: 12, 2: 20, 3: 30}, 
    "Maestro Limpio": {0.5: 8, 1: 12, 2: 20, 3: 30}, "Cloro": {0.5: 4, 1: 7, 2: 13, 3: 18},
    "Hipoclorito": {0.5: 8, 1: 15, 2: 25, 3: 36}, "Cloro En Gel": {0.5: 10, 1: 18, 2: 32, 3: 42},
    "Shampoo M Durazno": {0.5: 13, 1: 20, 2: 35, 3: 50}, "Shampoo M Naranja": {0.5: 13, 1: 20, 2: 35, 3: 50},
    "Shampoo M Manzana Canela": {0.5: 13, 1: 20, 2: 35, 3: 50}, "Shampoo M Frutal": {0.5: 13, 1: 20, 2: 35, 3: 50},
    "Shampoo C Fresa": {0.5: 13, 1: 25, 2: 45, 3: 65}, "Shampoo C Coco": {0.5: 13, 1: 25, 2: 45, 3: 65},
    "Shampoo C Durazno": {0.5: 13, 1: 25, 2: 45, 3: 65}, "Sarricida": {0.5: 10, 1: 18, 2: 32, 3: 42},
    "Desengrasante Rosa": {0.5: 10, 1: 18, 2: 32, 3: 42}, "Desengrasante Amarillo": {0.5: 10, 1: 18, 2: 32, 3: 42},
    "Shampoo Para Mascotas": {0.25: 9, 0.5: 15, 1: 30, 2: 50, 3: 75}, "Creolina": {0.25: 9, 0.5: 15, 1: 30, 2: 50, 3: 75},
    "Acido Domestico": {0.25: 9, 0.5: 15, 1: 30, 2: 50, 3: 75}, "Almorol": {0.25: 9, 0.5: 15, 1: 30, 2: 55, 3: 75},
    "Neutralizador De Aromas": {0.25: 8, 0.5: 13, 1: 25, 2: 45, 3: 65}, "Liquido Azul": {0.25: 8, 0.5: 13, 1: 25, 2: 45, 3: 65}
};

const baseArticulos = {
	"Escoba Corta": 35, "Escoba Simple": 42, "Escoba Larga": 42, "Cepillo Chueco": 42, "Escoba Tricolor": 50,
	"Escoba Italy": 50, "Trapeador Carpe": 45, "Trapeador Simple": 40, "Trapeador Amarillo": 40, "Trapeador Azul": 35,
	"Trapeador Giratorio": 250, "Recogedor": 25, "Escurridor": 30, "Destapacaños": 18, "Cepillo Para Retrete": 30,
	"Fibra Verde": 3, "Fibra Esponja": 4, "Fibra Espiral": 5, "Fibra Centella": 5, "Fibra Blanca": 25,
	"Fibra Metálica Chica": 7, "Fibra Metálica Mediana": 10, "Fibra Metálica Grande": 13, "Estropajo Cuadrado": 9,
	"Cubeta Chica": 25, "Cubeta Exprimidora": 90, "Cubeta Exprimidora Grande": 100, "Gancho Para Ropa": 3,
	"Pinza Para Ropa": 20, "Mecate Café": 16, "Mecate Blanco": 17, "Cepillo Plancha": 13, "Fashion Argolla": 18,
	"Coladera Chica": 5, "Coladera Mediana": 8, "Coladera Grande": 12, "Coladera Extra Grande": 25,
	"Escurridor Cuadrado": 13, "Escurridor De Verdura": 15, "Palangana": 25, "Cesto Fatima": 28,
	"Jerga De 1 Metro": 18, "Jerga De Cocina": 6, "Atrapa Moscas": 3, "Trampa Para Ratones": 20,
	"Atomizador De 500 ml": 15, "Disparador De Atomizador": 13, "Neutralizador Aromatizante": 70,
	"Liquido Para Estufa (MONY)": 20, "2 Pastillas De Cloro": 10, "Guantes": 20, "Bolsa Negra Mediana": 3,
	"Bolsa Negra Jumbo": 8, "Cerillos": 3 
};

const promosArticulos = { "Gancho Para Ropa": { 10: 27 } };

const categorias = {
	"Detergentes": {color: "var(--cat-detergente)", prods: ["Persil Verde", "Persil Transparente", "Mas Color", "Ariel", "Zote Blanco", "Zote Rosa", "Zote Con Pinol", "Foca", "Vanish Rosa", "Ace", "Roma", "Vel Rosita", "Desmugrante", "Carisma", "Axion Limon"]},
	"Suavizantes": {color: "var(--cat-suavizante)", prods: ["S Carisma", "S Paris Hilton", "S Primavera", "S Vainilla/Floral", "S Downy", "S Bebe", "S Frutal", "S Microcapsulas"]},
	"Limpiador Multiusos": {color: "var(--cat-limpiador)", prods: ["F Manzana Canela", "F Chica Fresa", "F Brisa Marina", "F Channel", "F Chicle", "F Limon", "F Menta", "F Lavanda", "F Naranja", "Pinol Blanco", "Pinol Verde", "Maestro Limpio"]},
	"Cloros": {color: "var(--cat-cloro)", prods: ["Cloro", "Hipoclorito", "Cloro En Gel"]},
	"Shampoo Manos": {color: "var(--cat-shampoo-m)", prods: ["Shampoo M Durazno", "Shampoo M Naranja", "Shampoo M Manzana Canela", "Shampoo M Frutal"]},
	"Shampoo Capilar": {color: "var(--cat-shampoo-c)", prods: ["Shampoo C Fresa", "Shampoo C Coco", "Shampoo C Durazno"]},
	"Otros Líquidos": {color: "var(--cat-otros)", prods: ["Sarricida", "Desengrasante Rosa", "Desengrasante Amarillo", "Shampoo Para Mascotas", "Creolina", "Acido Domestico", "Almorol", "Neutralizador De Aromas", "Liquido Azul"]},
	"Artículos": {color: "var(--cat-articulos)", prods: Object.keys(baseArticulos)} 
};

// Ahora cargamos un objeto de semanas o uno vacío
let stockProductos = JSON.parse(localStorage.getItem('vimarStock')) || {};
let historialSemanas = JSON.parse(localStorage.getItem('historialSemanas')) || {}; 
let registrosPendientes = JSON.parse(localStorage.getItem('registrosPendientes')) || []; 
let gastosArray = JSON.parse(localStorage.getItem('gastosArray')) || [];
let ingresosManualesArray = JSON.parse(localStorage.getItem('vimarIngresosManuales')) || [];
let ventasTicket = JSON.parse(localStorage.getItem('ventasTicket')) || [];
let detalleVentas = JSON.parse(localStorage.getItem('detalleVentas')) || [];
let resumenDias = JSON.parse(localStorage.getItem('resumenDias')) || [];
let historialEntradas = JSON.parse(localStorage.getItem('vimarHistorialEntradas')) || [];
let filtroGraficaActual = localStorage.getItem('vimarFiltroGrafica') || 'general';
let soloMostrarBajoStock = false;
let focusElement = null;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
let gI = null
let gC = null
let historialGastosSemanales = JSON.parse(localStorage.getItem('vimarHistorialGastos')) || {};
let historialIngresosManualesSemanales = JSON.parse(localStorage.getItem('vimarHistorialIngresosManuales')) || {};
let saldoNetoPorSemana = JSON.parse(localStorage.getItem('vimarSaldoNetoPorSemana')) || {};