// Variables globales para conductor, vuelta seleccionados y datos de telemetría
let selectedDriver = null;
let selectedLap = null;
let cachedTelemetry = null; // Variable para almacenar los datos de telemetría
let currentRaceFile = null; // Variable global para almacenar la carrera seleccionada

// Dimensiones y márgenes para el gráfico
const width = 800;
const height = 400;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

// Crear un SVG dentro del contenedor
function createSVG(containerId) {
    d3.select(containerId).select("svg").remove(); // Elimina el SVG previo
    return d3.select(containerId)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .style("background-color", "black")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
}

// Manejar cambio de conductor
document.addEventListener('driverChanged', (event) => {
    selectedDriver = event.detail;
    updateCharts(); // Actualiza el gráfico cuando cambia el conductor
});

// Manejar cambio de vuelta
document.addEventListener('lapChanged', (event) => {
    selectedLap = event.detail;
    updateCharts(); // Actualiza el gráfico cuando cambia la vuelta
});

document.addEventListener("raceFileChanged", (event) => {
    currentRaceFile = event.detail.raceFile; // Guardar la carrera seleccionada
    cachedTelemetry = null; // Resetear datos en caché al cambiar de carrera
    console.log(`Carrera seleccionada: ${currentRaceFile}`);
    updateCharts(); // Llamar a updateCharts para actualizar el gráfico si hay conductor y vuelta seleccionados
});

// Dividir el circuito en sectores
function getSectors(x_vals, y_vals, speeds, brake_vals, throttle_vals, brakeThreshold, throttleThreshold, distance_vals) {
    let sectors = [];
    let currentSector = { x: [], y: [], speed: [], brake: [], throttle: [], begin: 0.0, end: 0.0 };
    let lastBrakeThresholdReached = false;

    for (let i = 0; i < x_vals.length; i++) {
        if (currentSector.x.length === 0) {
            currentSector.begin = distance_vals[i];
        }
        if (lastBrakeThresholdReached) {
            if (throttle_vals[i] >= throttleThreshold) {
                currentSector.end = distance_vals[i];
                if (currentSector.x.length > 0) sectors.push(currentSector);
                currentSector = { x: [], y: [], speed: [], brake: [], throttle: [], begin: distance_vals[i], end: 0.0 };
                lastBrakeThresholdReached = false;
            }
        } else {
            if (brake_vals[i] >= brakeThreshold) {
                currentSector.end = distance_vals[i];
                if (currentSector.x.length > 0) sectors.push(currentSector);
                currentSector = { x: [], y: [], speed: [], brake: [], throttle: [], begin: distance_vals[i], end: 0.0 };
                lastBrakeThresholdReached = true;
            }
        }
        currentSector.x.push(x_vals[i]);
        currentSector.y.push(y_vals[i]);
        currentSector.speed.push(speeds[i]);
        currentSector.brake.push(brake_vals[i]);
        currentSector.throttle.push(throttle_vals[i]);
    }
    if (currentSector.x.length > 0) {
        currentSector.end = distance_vals[distance_vals.length - 1];
        sectors.push(currentSector);
    }
    return sectors;
}

// Mostrar el spinner de carga
function showLoadingSpinner() {
    document.getElementById("loadingSpinner").classList.remove("hidden");
}

// Ocultar el spinner de carga
function hideLoadingSpinner() {
    document.getElementById("loadingSpinner").classList.add("hidden");
}

// Dibujar líneas para los finales de sectores
function drawSectorPoints(sectorCoords, svg, xScale, yScale, sectorLabels) {
    console.log(sectorCoords);
    sectorCoords.forEach((coords, index) => {
        if (coords && coords.x !== null && coords.y !== null) {
            const xPos = xScale(coords.x);
            const yPos = yScale(coords.y);

            // Dibujar un punto en el gráfico
            svg.append("circle")
                .attr("cx", xPos) // Posición en X
                .attr("cy", yPos) // Posición en Y
                .attr("r", 5) // Radio del punto
                .attr("fill", "white");

            // Agregar etiqueta del sector (S1, S2, S3)
            svg.append("text")
                .attr("x", xPos + 10) // Posición ligeramente a la derecha del punto
                .attr("y", yPos + 5) // Alinear verticalmente con el punto
                .attr("fill", "white")
                .attr("font-size", "12px")
                .attr("font-family", "Arial")
                .text(sectorLabels[index]); // Etiqueta del sector
        }
    });
}



// Actualizar y dibujar el gráfico
async function updateCharts() {
    if (!selectedDriver || !selectedLap) {
        console.log("No hay conductor o vuelta seleccionada.");
        return;
    }

    try {
        console.log(`Cargando datos para el conductor: ${selectedDriver} y la vuelta: ${selectedLap}`);
        showLoadingSpinner();
        if (!cachedTelemetry) {
            const response = await fetch(`http://127.0.0.1:5000/get_sectors`);
            cachedTelemetry = await response.json();
            console.log("Datos de telemetría recibidos:", cachedTelemetry);
        } else {
            console.log("Usando datos en caché");
        }

        const x_vals = cachedTelemetry.x.filter(x => !isNaN(x));
        const y_vals = cachedTelemetry.y.filter(y => !isNaN(y));
        const speeds = cachedTelemetry.speed.filter(s => !isNaN(s));
        const brake_vals = cachedTelemetry.brake.filter(b => !isNaN(b));
        const throttle_vals = cachedTelemetry.throttle.filter(t => !isNaN(t));
        const distance_vals = cachedTelemetry.distance.filter(d => !isNaN(d));

        hideLoadingSpinner();
        const svg = createSVG("#mainChart");

        const xScale = d3.scaleLinear()
            .domain([d3.min(x_vals), d3.max(x_vals)])
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(y_vals), d3.max(y_vals)])
            .range([height, 0]);

        const brakeThreshold = 1.0;
        const throttleThreshold = 100;
        const sectors = getSectors(x_vals, y_vals, speeds, brake_vals, throttle_vals, brakeThreshold, throttleThreshold, distance_vals);

        // Llama a la función de cálculo de índices de rendimiento
        // Llama a la función de cálculo de índices de rendimiento
        const sectorWinners = await calculatePerformanceIndex(sectors, selectedDriver, selectedLap);


        // Dibujar sectores con el color del mejor piloto
        sectors.forEach((sector, index) => {
            const points = [];
            for (let i = 0; i < sector.x.length; i++) {
                points.push([xScale(sector.x[i]), yScale(sector.y[i])]);
            }

            const line = d3.line()
                .x(d => d[0])
                .y(d => d[1]);

            svg.append("g")
                .selectAll("path")
                .data([points])
                .enter()
                .append("path")
                .attr("d", line)
                .attr("stroke", getDriverColor(sectorWinners[index]?.bestDriver)) // Asegurarse de no acceder null
                .attr("stroke-width", 10)
                .attr("fill", "none")
                .style("cursor", "pointer")
                .on("mouseover", function () {
                    d3.select(this).attr("stroke-width", 15);
                })
                .on("mouseout", function () {
                    d3.select(this).attr("stroke-width", 10);
                })
                .on("click", function () {
                    const sectorSelectedEvent = new CustomEvent("sectorSelected", { detail: sector });
                    document.dispatchEvent(sectorSelectedEvent);
                    //console.log(`Sector seleccionado: begin = ${sector.begin}, end = ${sector.end}`);
                })
                .append("title") // Agregar un título para el hover
                .text(`Piloto: ${sectorWinners[index]?.bestDriver || "Desconocido"}`);
        });


        // Coordenadas de los sectores desde el servidor
        const sectorCoords = [
            cachedTelemetry.sector1_coords,
            cachedTelemetry.sector2_coords,
            cachedTelemetry.sector3_coords,
        ];

        // Etiquetas de los sectores
        const sectorLabels = ["S1", "S2", "S3"];

        // Dibujar las líneas para los sectores
        drawSectorPoints(sectorCoords, svg, xScale, yScale, sectorLabels);
    } catch (error) {
        console.error("Error al cargar los datos del sector:", error);
    }
}


// Importar y usar d3-fetch para leer el CSV
async function loadDriverStats(filePath) {
    try {
        const data = await d3.csv(filePath, d => ({
            DriverNumber: +d.DriverNumber,
            Driver: d.Driver,
            AvgLapTime: +d.AvgLapTime,
            LapTimeSTD: +d.LapTimeSTD,
        }));
        return data;
    } catch (error) {
        console.error("Error al cargar el archivo CSV:", error);
        return [];
    }
}

// Calcular MinMax normalizado
function normalizeMinMax(value, min, max) {
    if (max === min) return 0.5; // Evitar divisiones por cero
    return (value - min) / (max - min);
}

// Calcular índice de rendimiento para cada sector y piloto
async function calculatePerformanceIndex(sectors, selectedDrivers, selectedLap) {
    if (!selectedDrivers || !selectedLap) {
        console.error("Pilotos o vuelta no especificados.");
        return;
    }

    try {
        // Cargar estadísticas desde el archivo CSV
        const driverStats = await loadDriverStats(`../../2024/calculated_variables/${currentRaceFile}`);

        // Obtener datos de telemetría de los pilotos seleccionados
        const dataPromises = selectedDrivers.map(driver =>
            fetch(`http://127.0.0.1:5000/get_lap_data?driver=${driver}&lap=${selectedLap}`).then(res => res.json())
        );
        const allData = await Promise.all(dataPromises);

        // Estructura para almacenar el mejor piloto por sector
        const sectorWinners = Array(sectors.length).fill(null).map(() => ({
            bestDriver: null,
            bestIndex: -Infinity,
        }));

        // Procesar cada piloto
        selectedDrivers.forEach((driver, index) => {
            const driverData = allData[index];
            const performanceMetrics = [];
            // Buscar estadísticas del piloto en el CSV
            const driverStatsData = driverStats.find(d => d.Driver === driver);
            const avgLapTime = driverStatsData ? driverStatsData.AvgLapTime : NaN;
            const lapTimeSTD = driverStatsData ? driverStatsData.LapTimeSTD : NaN;

            // Calcular métricas por sector y recolectar valores para normalización
            sectors.forEach((sector, sectorIndex) => {
                const sectorData = driverData.filter(d =>
                    d.Distance >= sector.begin && d.Distance <= sector.end
                );

                if (sectorData.length > 0) {
                    const avgRPM = d3.mean(sectorData, d => d.RPM);
                    const avgSpeed = d3.mean(sectorData, d => d.Speed);
                    const avgThrottle = d3.mean(sectorData, d => d.Throttle);
                    const avgBrake = d3.mean(sectorData, d => d.Brake);
                    const avgDRS = d3.mean(sectorData, d => d.DRS);

                    const startTime = sectorData[0].Time;
                    const endTime = sectorData[sectorData.length - 1].Time;
                    const timeSpent = endTime - startTime;

                    performanceMetrics.push({
                        sector: sectorIndex + 1,
                        avgRPM,
                        avgSpeed,
                        avgThrottle,
                        avgBrake,
                        avgDRS,
                        timeSpent,
                    });
                }
            });

            // Normalizar valores globales
            //const globalMinMax = (key) => {
            //    const values = allValues[key];
            //    return { min: d3.min(values), max: d3.max(values) };
            //};

            const normalizedMetrics = performanceMetrics.map(metric => {
                //const rpmScale = globalMinMax("rpm");
                //const speedScale = globalMinMax("speed");
                //const throttleScale = globalMinMax("throttle");
                //const brakeScale = globalMinMax("brake");
                //const drsScale = globalMinMax("drs");
                //const timeScale = globalMinMax("time");

                return {
                    sector: metric.sector,
                    rpm: metric.avgRPM,
                    speed: metric.avgSpeed,
                    throttle: metric.avgThrottle,
                    brake: metric.avgBrake,
                    drs: metric.avgDRS,
                    time: metric.timeSpent,
                    

                    //sector: metric.sector,
                    //rpm: normalizeMinMax(metric.avgRPM, rpmScale.min, rpmScale.max),
                    //speed: normalizeMinMax(metric.avgSpeed, speedScale.min, speedScale.max),
                    //throttle: normalizeMinMax(metric.avgThrottle, throttleScale.min, throttleScale.max),
                    //brake: normalizeMinMax(metric.avgBrake, brakeScale.min, brakeScale.max),
                    //drs: normalizeMinMax(metric.avgDRS, drsScale.min, drsScale.max),
                    //time: normalizeMinMax(metric.timeSpent, timeScale.min, timeScale.max),
                };
            });

            // Normalizar valores globales (AvgLapTime y LapTimeSTD)
            const lapTimeScale = d3.extent(driverStats, d => d.AvgLapTime);
            const lapTimeSTDScale = d3.extent(driverStats, d => d.LapTimeSTD);
            //const normalizedAvgLapTime = normalizeMinMax(avgLapTime, lapTimeScale[0], lapTimeScale[1]);
            //const normalizedLapTimeSTD = normalizeMinMax(lapTimeSTD, lapTimeSTDScale[0], lapTimeSTDScale[1]);

            // Pesos
            const weights = {
                drs: -10,
                speed: 1,
                brake: -20,
                time: -500,
                throttle: 1,
                rpm: 0.001,
                avgLapTime: -1,
                lapTimeSTD: -5,
            };

            // Calcular índice de rendimiento para cada sector
            normalizedMetrics.forEach((metric, sectorIndex) => {
                console.log(sectorIndex);
                //console.log("DRS:", metric.drs, "* Weight:", weights.drs, "=", metric.drs * weights.drs);
                //console.log("Speed:", metric.speed, "* Weight:", weights.speed, "=", metric.speed * weights.speed);
                //console.log("Brake:", metric.brake, "* Weight:", weights.brake, "=", metric.brake * weights.brake);
                //console.log("Time:", metric.time, "* Weight:", weights.time, "=", metric.time * weights.time);
                //console.log("Throttle:", metric.throttle, "* Weight:", weights.throttle, "=", metric.throttle * weights.throttle);
                //console.log("RPM:", metric.rpm, "* Weight:", weights.rpm, "=", metric.rpm * weights.rpm);
                //console.log("Avg Lap Time:", driverStatsData.AvgLapTime, "* Weight:", weights.avgLapTime, "=", driverStatsData.AvgLapTime * weights.avgLapTime);
                //console.log("Lap Time STD:", driverStatsData.LapTimeSTD, "* Weight:", weights.lapTimeSTD, "=", driverStatsData.LapTimeSTD * weights.lapTimeSTD);

                const performanceIndex =
                    metric.drs * weights.drs +
                    metric.speed * weights.speed +
                    metric.brake * weights.brake +
                    metric.time * weights.time +
                    metric.throttle * weights.throttle +
                    metric.rpm * weights.rpm +
                    driverStatsData.AvgLapTime * weights.avgLapTime +
                    driverStatsData.LapTimeSTD * weights.lapTimeSTD;

                console.log("Performance Index:", performanceIndex);

                // Verificar si es el mejor índice para este sector
                if (performanceIndex > sectorWinners[sectorIndex].bestIndex) {
                    sectorWinners[sectorIndex] = {
                        bestDriver: driver,
                        bestIndex: performanceIndex,
                    };
                }

                //console.log(`Piloto: ${driver}, Sector ${metric.sector}, Índice de rendimiento: ${performanceIndex.toFixed(3)}`);
            });
        });

        // Imprimir resultados del mejor piloto por sector
        /*sectorWinners.forEach((winner, index) => {
            console.log(`Sector ${index + 1}: Mejor piloto = ${winner.bestDriver}, Índice = ${winner.bestIndex.toFixed(3)}`);
        });*/
        return sectorWinners;

    } catch (error) {
        console.error("Error al calcular el índice de rendimiento:", error);
    }
}
