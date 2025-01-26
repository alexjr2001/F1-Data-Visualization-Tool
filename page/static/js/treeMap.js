document.addEventListener('DOMContentLoaded', function () {
    let selectedDrivers = [];
    let selectedLap = null;
    const margin = { top: 20, right: 20, bottom: 60, left: 50 };
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Función para crear SVG y grupo transformado
    function createSVG(containerId) {
        d3.select(containerId).select("svg").remove();  // Elimina el SVG previo
        return d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }

    // Función para actualizar el gráfico cuando cambian los pilotos o la vuelta
    async function updateCharts() {
        if (!selectedDrivers.length || !selectedLap) return;

        // Limpiar contenedor de gráficos antes de cargar nuevos datos
        d3.select("#barplots").selectAll(".chart-container").remove();

        try {
            const dataPromises = selectedDrivers.map(driver =>
                fetch(`http://127.0.0.1:5000/get_lap_data?driver=${driver}&lap=${selectedLap}`)
                    .then(res => res.json())
            );
            const allData = await Promise.all(dataPromises);

            // Crear gráfico para cada piloto
            selectedDrivers.forEach((driver, i) => {
                // Obtener los datos específicos para cada piloto
                const driverData = allData[i];

                // Contar las ocurrencias de cada marcha para este piloto
                const gearCounts = {};
                driverData.forEach(d => {
                    if (d.nGear !== 0) {  // Excluimos la marcha 0
                        gearCounts[d.nGear] = (gearCounts[d.nGear] || 0) + 1;
                    }
                });

                // Preparar los datos para el gráfico de barras
                const gearData = Object.keys(gearCounts).map(gear => ({
                    name: `Gear ${gear}`,
                    value: gearCounts[gear]
                }));

                // Crear un contenedor para cada gráfico de piloto
                const chartContainer = d3.select("#barplots")
                    .append("div")
                    .attr("class", "chart-container")
                    .style("display", "inline-block")
                    .style("margin-right", "20px")
                    .style("padding", "20px")
                    .style("border-radius", "8px")
                    .style("width", `${width + margin.left + margin.right}px`);

                // Título del piloto
                chartContainer.append("h3")
                    .text(driver)
                    .style("text-align", "center")
                    .style("color", getDriverColor(driver));

                // Crear y agregar el gráfico SVG
                const svg = createSVG(chartContainer.node());

                // Definir la escala de color
                const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

                // Definir las escalas para el gráfico de barras
                const xScale = d3.scaleBand()
                    .domain(gearData.map(d => d.name))
                    .range([0, width])
                    .padding(0.1);

                const yScale = d3.scaleLinear()
                    .domain([0, d3.max(gearData, d => d.value)])
                    .nice()
                    .range([height, 0]);

                // Agregar las barras al gráfico
                svg.selectAll("rect")
                    .data(gearData)
                    .enter()
                    .append("rect")
                    .attr("x", d => xScale(d.name))
                    .attr("y", d => yScale(d.value))
                    .attr("width", xScale.bandwidth())
                    .attr("height", d => height - yScale(d.value))
                    .attr("fill",getDriverColor(driver))
                    .attr("stroke", "white")
                    .attr("stroke-width", 1);

                // Agregar los ejes
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

                // Agregar las etiquetas en la parte superior de las barras
                svg.selectAll("text.value")
                    .data(gearData)
                    .enter()
                    .append("text")
                    .attr("class", "value")
                    .attr("x", d => xScale(d.name) + xScale.bandwidth() / 2)
                    .attr("y", d => yScale(d.value) - 5)
                    .attr("text-anchor", "middle")
                    .style("fill", "white")
                    .style("font-size", "12px")
                    .text(d => d.value);
            });
        } catch (error) {
            console.error("Error al cargar los datos:", error);
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
