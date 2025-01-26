const driverSelect = d3.select("#driverSelect");
const selectedDriversContainer = d3.select("#selectedDrivers");
let selectedDrivers = [];

// Función para actualizar los tags visuales
function updateSelectedTags() {
    // Limpiar el contenedor de tags
    selectedDriversContainer.html("");

    // Crear un tag para cada piloto seleccionado
    selectedDrivers.forEach(driver => {
        const tag = selectedDriversContainer.append("div")
            .attr("class", "driver-tag")
            .text(driver);

        // Agregar el botón "x" al lado del nombre del piloto
        tag.append("span")
            .attr("class", "remove-tag")
            .text(" x")
            .on("click", () => removeDriver(driver));
    });
}

// Función para manejar la selección de pilotos en el dropdown
driverSelect.on("change", function() {
    const newDriver = this.value;
    if (newDriver && !selectedDrivers.includes(newDriver)) {
        selectedDrivers.push(newDriver);
        updateSelectedTags();

        // Emitir el evento de cambio para actualizar los gráficos
        const event = new CustomEvent('driverChanged', { detail: selectedDrivers });
        document.dispatchEvent(event);
    }

    // Limpiar la selección en el dropdown
    this.value = "";
});

// Función para remover un piloto de la selección
function removeDriver(driver) {
    // Remover el piloto de la lista
    selectedDrivers = selectedDrivers.filter(d => d !== driver);
    updateSelectedTags();

    // Emitir el evento de cambio para actualizar los gráficos
    const event = new CustomEvent('driverChanged', { detail: selectedDrivers });
    document.dispatchEvent(event);
}


document.addEventListener("raceFileChanged", function () {
    // Vaciar la lista de pilotos seleccionados al cambiar la carrera
    selectedDrivers = [];
    updateSelectedTags();

    // Emitir un evento para notificar que no hay pilotos seleccionados
    const event = new CustomEvent('driverChanged', { detail: selectedDrivers });
    document.dispatchEvent(event);
});