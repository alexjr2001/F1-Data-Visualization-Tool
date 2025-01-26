document.addEventListener('DOMContentLoaded', () => {
    const lapSelect = document.getElementById('lapSelect');
    const lapValue = document.getElementById('lapValue');
    const decrementLapButton = document.getElementById('decrementLap');
    const incrementLapButton = document.getElementById('incrementLap');
    const applyLapButton = document.getElementById('applyLap');

    let temporaryLap = 1; // Variable temporal para almacenar el valor seleccionado

    // Función para cargar datos de un archivo CSV dinámico
    function loadLapData(csvFilePath) {
        d3.csv(csvFilePath).then(data => {
            // Convertir los valores de LapNumber a números y obtener el máximo valor
            const maxLapNumber = d3.max(data, d => +d.LapNumber);
            const minLapNumber = 1;

            // Establecer los valores del slider y mostrar la vuelta inicial
            lapSelect.max = maxLapNumber;
            lapSelect.min = minLapNumber;
            lapSelect.value = minLapNumber;
            lapValue.textContent = `Lap ${minLapNumber}`;

            temporaryLap = minLapNumber; // Inicializar la vuelta temporal
        }).catch(error => {
            console.error(`Error al cargar el archivo CSV (${csvFilePath}):`, error);
        });
    }

    // Función para actualizar la visualización del valor temporal
    function updateTemporaryLap(newLap) {
        temporaryLap = newLap;
        lapValue.textContent = `Lap ${newLap}`;
    }

    // Actualizar el valor temporal cuando cambia el slider
    lapSelect.addEventListener('input', () => {
        updateTemporaryLap(parseInt(lapSelect.value, 10));
    });

    // Incrementar la vuelta temporal en 1
    incrementLapButton.addEventListener('click', () => {
        let newLap = Math.min(parseInt(lapSelect.value, 10) + 1, lapSelect.max);
        lapSelect.value = newLap; // Sincronizar el slider
        updateTemporaryLap(newLap);
    });

    // Decrementar la vuelta temporal en 1
    decrementLapButton.addEventListener('click', () => {
        let newLap = Math.max(parseInt(lapSelect.value, 10) - 1, lapSelect.min);
        lapSelect.value = newLap; // Sincronizar el slider
        updateTemporaryLap(newLap);
    });

    // Aplicar la vuelta seleccionada al presionar "Apply Lap"
    applyLapButton.addEventListener('click', () => {
        const selectedLap = temporaryLap;

        // Emitir un evento personalizado con la vuelta seleccionada
        const lapEvent = new CustomEvent('lapChanged', { detail: selectedLap });
        document.dispatchEvent(lapEvent);
    });

    // Escuchar cambios de carrera y actualizar el archivo CSV dinámicamente
    document.addEventListener('raceFileChanged', event => {
        const raceFile = event.detail.raceFile;
        if (raceFile) {
            const csvFilePath = `../../2024/LapData/${raceFile}`;
            loadLapData(csvFilePath);
        }
    });
});




//SOLO SELECT

/*
// selectLap.js
document.addEventListener('DOMContentLoaded', () => {
    const lapSelect = document.getElementById('lapSelect');
    const csvFilePath = "../../2024/LapData/Bahrain_Grand_Prix.csv";

    // Usando d3 para cargar el archivo CSV
    d3.csv(csvFilePath).then(data => {
        // Convertir los valores de LapNumber a números y obtener el máximo valor
        const maxLapNumber = d3.max(data, d => +d.LapNumber);

        // Rellenar el selector de vuelta con opciones desde 1 hasta maxLapNumber
        for (let lap = 1; lap <= maxLapNumber; lap++) {
            const option = document.createElement('option');
            option.value = lap;
            option.textContent = Lap ${lap};
            lapSelect.appendChild(option);
        }
    }).catch(error => {
        console.error("Error al cargar el archivo CSV:", error);
    });

    // Escuchar cambios en el selector de vuelta
    lapSelect.addEventListener('change', () => {
        const selectedLap = parseInt(lapSelect.value, 10);
        
        // Emitir un evento personalizado con la vuelta seleccionada
        const lapEvent = new CustomEvent('lapChanged', { detail: selectedLap });
        document.dispatchEvent(lapEvent);
    });
});

*/