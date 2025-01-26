document.addEventListener('DOMContentLoaded', function () {
    let selectedDrivers = [];
    let selectedLap = null;
    const margin = { top: 20, right: 20, bottom: 60, left: 50 };
    const width = 450 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Función para crear SVG y agregar el grupo transformado
    function createSVG(containerId) {
        d3.select(containerId).select("svg").remove();  // Elimina solo el SVG previo
        return d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }
    // Función para configurar y dibujar un eje
    function addAxes(svg, xScale, yScale, yLabel) {
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .style("fill", "white");

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .style("fill", "white");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .style("text-anchor", "middle")
            .style("fill", "white")
            .text("Distance");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 10)
            .attr("x", -height / 2)
            .style("text-anchor", "middle")
            .style("fill", "white")
            .text(yLabel);
    }

    // Función para dibujar la línea en el gráfico
    function drawLine(svg, data, xScale, yScale, lineFunc, color) {
        svg.append("path")
            .data([data])
            .attr("d", lineFunc)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2);
    }

    async function updateCharts() {
        if (selectedDrivers.length === 0 || selectedLap === null) return;

        try {
            const dataPromises = selectedDrivers.map(driver =>
                fetch(`http://127.0.0.1:5000/get_lap_data?driver=${driver}&lap=${selectedLap}`).then(res => res.json())
            );
            const allData = await Promise.all(dataPromises);
            const combinedData = allData.flat();

            const xScale = d3.scaleLinear().range([0, width]).domain(d3.extent(combinedData, d => d.Distance));
            const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(selectedDrivers);

            // Configurar las escalas para cada métrica
            const yScales = {
                Speed: d3.scaleLinear().range([height, 0]).domain(d3.extent(combinedData, d => d.Speed)),
                Brake: d3.scaleLinear().range([height, 0]).domain(d3.extent(combinedData, d => d.Brake)),
                RPM: d3.scaleLinear().range([height, 0]).domain(d3.extent(combinedData, d => d.RPM)),
                Throttle: d3.scaleLinear().range([height, 0]).domain(d3.extent(combinedData, d => d.Throttle)),
                nGear: d3.scaleLinear().range([height, 0]).domain(d3.extent(combinedData, d => d.nGear)),
                diffDis: d3.scaleLinear().range([height, 0]).domain(d3.extent(combinedData, d => d.DifferentialDist || 0))

            };

            // Crear líneas para cada métrica
            const lineFuncs = {
                Speed: d3.line().x(d => xScale(d.Distance)).y(d => yScales.Speed(d.Speed || 0)),
                Brake: d3.line().x(d => xScale(d.Distance)).y(d => yScales.Brake(d.Brake || 0)),
                RPM: d3.line().x(d => xScale(d.Distance)).y(d => yScales.RPM(d.RPM || 0)),
                Throttle: d3.line().x(d => xScale(d.Distance)).y(d => yScales.Throttle(d.Throttle || 0)),
                nGear: d3.line().x(d => xScale(d.Distance)).y(d => yScales.nGear(d.nGear || 0)),
                diffDis: d3.line().x(d => xScale(d.Distance)).y(d => yScales.diffDis(d.DifferentialDist || 0))

            };

            // Mapear contenedores con sus etiquetas de ejes
            const charts = [
                { id: "#chartSpeed", label: "Speed", yScale: yScales.Speed, lineFunc: lineFuncs.Speed },
                { id: "#chartBrake", label: "Brake", yScale: yScales.Brake, lineFunc: lineFuncs.Brake },
                { id: "#chartRPM", label: "RPM", yScale: yScales.RPM, lineFunc: lineFuncs.RPM },
                { id: "#chartThrottle", label: "Throttle", yScale: yScales.Throttle, lineFunc: lineFuncs.Throttle },
                { id: "#chartNgear", label: "nGear", yScale: yScales.nGear, lineFunc: lineFuncs.nGear },
                { id: "#chartDiffDist", label: "DiffDist", yScale: yScales.diffDis, lineFunc: lineFuncs.diffDis }
            ];

            charts.forEach(({ id, label, yScale, lineFunc }) => {
                const svg = createSVG(id);
                addAxes(svg, xScale, yScale, label);

                allData.forEach((data, i) => {
                    const color = getDriverColor(selectedDrivers[i]);
                    drawLine(svg, data, xScale, yScale, lineFunc, color);
                });
            });

        } catch (error) {
            console.error("Error al cargar los datos de la API:", error);
        }
    }

    // Escuchar eventos de selección de pilotos y vuelta
    document.addEventListener('driverChanged', (event) => {
        selectedDrivers = event.detail;
        updateCharts();
    });

    document.addEventListener('lapChanged', (event) => {
        selectedLap = event.detail;
        updateCharts();
    });
});
