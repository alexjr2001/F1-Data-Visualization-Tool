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

    // Función para agregar ejes
    function addAxes(svg, xScale, yScale) {
        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).ticks(5))
            .selectAll("text")
            .style("fill", "white");

        svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale).ticks(8))
            .selectAll("text")
            .style("fill", "white");

        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .style("text-anchor", "middle")
            .style("fill", "white")
            .text("RPM");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 10)
            .attr("x", -height / 2)
            .style("text-anchor", "middle")
            .style("fill", "white")
            .text("Gear");
    }

    // Función para dibujar burbujas
    function drawBubbles(svg, data, xScale, yScale, radiusScale, color) {
        svg.selectAll("circle")
            .data(data.filter(d => d.nGear !== 0))
            .enter()
            .append("circle")
            .attr("cx", d => xScale(d.RPM))
            .attr("cy", d => yScale(d.nGear))
            .attr("r", d => radiusScale(d.DifferentialDist || 1))
            .attr("fill", color)
            .attr("opacity", 0.7)
            .append("title")
            .text(d => `RPM: ${d.RPM}\nGear: ${d.nGear}\nDist: ${d.DifferentialDist}`);
    }

    // Función principal para actualizar el gráfico cuando cambian los pilotos o la vuelta
    async function updateCharts() {
        if (!selectedDrivers.length || !selectedLap) return;

        // Limpiar contenedor de gráficos antes de cargar nuevos datos
        d3.select("#bubbleChart").selectAll(".chart-container").remove();

        try {
            const dataPromises = selectedDrivers.map(driver =>
                fetch(`http://127.0.0.1:5000/get_lap_data?driver=${driver}&lap=${selectedLap}`)
                    .then(res => res.json())
            );
            const allData = await Promise.all(dataPromises);

            // Configuración de escalas
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(allData.flat(), d => d.RPM)])
                .range([0, width]);

            const yScale = d3.scaleLinear()
                .domain([1, 8])  // Rango de marchas (1 a 8)
                .range([height, 0]);

            const radiusScale = d3.scaleSqrt()
                .domain([0, d3.max(allData.flat(), d => d.DifferentialDist || 1)])
                .range([3, 15]);

            const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(selectedDrivers);

            // Crear gráfico para cada piloto
            selectedDrivers.forEach((driver, i) => {
                // Crear un contenedor para cada gráfico de piloto
                const chartContainer = d3.select("#bubbleChart")
                    .append("div")
                    .attr("class", "chart-container")
                    .style("display", "inline-block")
                    .style("margin-right", "20px")
                    .style("border-radius", "8px")
                    .style("width", `${width + margin.left + margin.right}px`);

                // Título del piloto
                chartContainer.append("h3")
                    .text(driver)
                    .style("text-align", "center")
                    .style("color", getDriverColor(driver));

                // Crear y agregar el gráfico SVG
                const svg = createSVG(chartContainer.node());

                // Agregar ejes y burbujas
                addAxes(svg, xScale, yScale);
                drawBubbles(svg, allData[i], xScale, yScale, radiusScale,getDriverColor(driver));
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
