// colors.js

// Define los colores de los pilotos como un objeto global
window.driverColors = {
    "VER": "#FF0000", // Max Verstappen - Rojo
    "PER": "#00FF00", // Sergio Perez - Verde
    "SAI": "#0000FF", // Carlos Sainz - Azul
    "LEC": "#FFA500", // Charles Leclerc - Naranja
    "RUS": "#800080", // George Russell - Púrpura
    "NOR": "#FFFF00", // Lando Norris - Amarillo
    "HAM": "#00FFFF", // Lewis Hamilton - Cian
    "PIA": "#FFC0CB", // Oscar Piastri - Rosa
    "ALO": "#808080", // Fernando Alonso - Gris
    "STR": "#8B4513", // Lance Stroll - Marrón
    "ZHO": "#4682B4", // Guanyu Zhou - Azul acero
    "MAG": "#A52A2A", // Kevin Magnussen - Marrón oscuro
    "OCO": "#7FFF00", // Daniel Ricciardo - Chartreuse
    "TSU": "#DC143C", // Yuki Tsunoda - Carmesí
    "ALB": "#4169E1", // Alexander Albon - Azul real
    "HUL": "#228B22", // Nico Hulkenberg - Verde bosque
    "LAW": "#FFD700", // Esteban Ocon - Dorado
    "GAS": "#00BFFF", // Pierre Gasly - Azul cielo profundo
    "BOT": "#9932CC", // Valtteri Bottas - Azul violeta oscuro
    "SAR": "#FF69B4", // Logan Sargeant - Rosa fuerte
    "BEA": "#B22222", // Oliver Bearman - Rojo fuego
    "COL": "#20B2AA", // Franco Colapinto - Azul verdoso claro
    "RIC": "#2E8B57"  // Liam Lawson - Verde mar oscuro
};

// Define una función global para obtener el color de un piloto
window.getDriverColor = function(acronym) {
    return window.driverColors[acronym] || "#CCCCCC"; // Gris por defecto si no se encuentra el piloto
};
