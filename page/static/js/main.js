let selectedRaceFile = ""; // Variable global para almacenar el archivo seleccionado

// Actualiza el archivo seleccionado y notifica a los demás scripts
function updateRaceFile(raceFile) {
    selectedRaceFile = raceFile;

    // Emite un evento para notificar el cambio
    const event = new CustomEvent("raceFileChanged", { detail: { raceFile } });
    document.dispatchEvent(event);
}

// Escucha cambios en el dropdown de carreras
document.getElementById("race").addEventListener("change", function () {
    const raceFile = this.value + "_Grand_Prix.csv"; // Construye el nombre del archivo basado en la carrera seleccionada
    updateRaceFile(raceFile);
});

// Escucha clics en el botón "Load Data"
document.getElementById("loadDataBtn").addEventListener("click", function () {
    if (selectedRaceFile) {
        console.log("Archivo de carrera seleccionado:", selectedRaceFile);
        // Aquí puedes cargar datos adicionales si es necesario
    } else {
        alert("Selecciona una carrera primero.");
    }
});
