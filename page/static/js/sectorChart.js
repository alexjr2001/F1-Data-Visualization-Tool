document.addEventListener('DOMContentLoaded', function () {
    let selectedDriver = null;
    let selectedLap = null;
    let selectedSector = null;
    const margin = { top: 20, right: 20, bottom: 60, left: 50 };
    const width = 450 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("display", "none");

    function createSVG(containerId) {
        d3.select(containerId).select("svg").remove();
        return d3.select(containerId)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }

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
            .text("Distance (m)");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 10)
            .attr("x", -height / 2)
            .style("text-anchor", "middle")
            .style("fill", "white")
            .text(yLabel);
    }

    function drawLine(svg, data, xScale, yScale, lineFunc, color) {
        svg.append("path")
            .data([data])
            .attr("d", lineFunc)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 2);
    }

    async function updateSectorChart() {
        if (selectedDrivers.length === 0 || !selectedLap || !selectedSector) {
            console.log("No hay conductor(es), vuelta o sector seleccionado.");
            return;
        }

        try {
            const dataPromises = selectedDrivers.map(driver =>
                fetch(`http://127.0.0.1:5000/get_lap_data?driver=${driver}&lap=${selectedLap}`).then(res => res.json())
            );
            const allData = await Promise.all(dataPromises);
            const sectorData = allData.map(lapData =>
                lapData.filter(d => d.Distance >= selectedSector.begin && d.Distance <= selectedSector.end)
            );

            const xScale = d3.scaleLinear().range([0, width])
                .domain(d3.extent(sectorData.flat(), d => d.Distance));

            const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(selectedDrivers);

            const metrics = ['Speed', 'Brake', 'RPM', 'Throttle', 'nGear', 'Time','DRS'];
            const yScales = {};

            metrics.forEach(metric => {
                if (metric === "Time") {
                    // Calcular el rango mínimo y máximo de Time
                    const timeExtent = d3.extent(sectorData.flat(), d => d[metric] || 0);
                    yScales[metric] = d3.scaleLinear()
                        .range([height, 0])
                        .domain([timeExtent[0], timeExtent[1]]); // Rango mínimo a máximo de Time
                } else {
                    // Escala normal para las otras métricas
                    yScales[metric] = d3.scaleLinear()
                        .range([height, 0])
                        .domain([0, d3.max(sectorData.flat(), d => d[metric] || 0)]);
                }
            });


            const lineFuncs = {};
            metrics.forEach(metric => {
                lineFuncs[metric] = d3.line()
                    .x(d => xScale(d.Distance))
                    .y(d => yScales[metric](d[metric] || 0));
            });

            const charts = [
                { id: "#sectorSpeed", label: "Speed", metric: "Speed" },
                { id: "#sectorBrake", label: "Brake", metric: "Brake" },
                { id: "#sectorRPM", label: "RPM", metric: "RPM" },
                { id: "#sectorThrottle", label: "Throttle", metric: "Throttle" },
                { id: "#sectorNgear", label: "nGear", metric: "nGear" },
                { id: "#sectorTime", label: "Time", metric: "Time" },
                { id: "#sectorDRS", label: "DRS", metric: "DRS" },

            ];

            const verticalLines = {};

            charts.forEach(({ id, label, metric }) => {
                const svg = createSVG(id);
                addAxes(svg, xScale, yScales[metric], label);

                sectorData.forEach((data, i) => {
                    const color = getDriverColor(selectedDrivers[i]);
                    drawLine(svg, data, xScale, yScales[metric], lineFuncs[metric], color);
                });

                // Línea vertical sincronizada
                verticalLines[metric] = svg.append("line")
                    .attr("class", "hover-line")
                    .attr("y1", 0)
                    .attr("y2", height)
                    .attr("stroke", "white")
                    .attr("stroke-dasharray", "4")
                    .attr("stroke-width", 1.5)
                    .style("display", "none");

                // Interacción
                svg.append("rect")
                    .attr("width", width)
                    .attr("height", height)
                    .attr("fill", "none")
                    .attr("pointer-events", "all")
                    .on("mousemove", function (event) {
                        const [mouseX] = d3.pointer(event);
                        const distance = xScale.invert(mouseX);

                        // Actualizar línea vertical
                        Object.values(verticalLines).forEach(line => {
                            line.style("display", "block")
                                .attr("x1", mouseX)
                                .attr("x2", mouseX);
                        });

                        // Actualizar tooltip
                        const tooltipData = sectorData.map((data, i) => {
                            const closestPoint = data.reduce((prev, curr) =>
                                Math.abs(curr.Distance - distance) < Math.abs(prev.Distance - distance) ? curr : prev
                            );
                            return {
                                driver: selectedDrivers[i],
                                metric: closestPoint[metric]?.toFixed(2) || "N/A",
                                color: getDriverColor(selectedDrivers[i])
                            };
                        });

                        tooltip.style("display", "block")
                            .style("left", `${event.pageX + 15}px`)
                            .style("top", `${event.pageY}px`)
                            .html(` 
                                <strong>${label}</strong><br>
                                ${tooltipData.map(d => `
                                    <span style="color:${d.color}">●</span> ${d.driver}: ${d.metric}
                                `).join("<br>")}`
                            );
                    })
                    .on("mouseout", function () {
                        tooltip.style("display", "none");
                        Object.values(verticalLines).forEach(line => line.style("display", "none"));
                    });
            });
        } catch (error) {
            console.error("Error al cargar los datos de la vuelta:", error);
        }
    }

    document.addEventListener('sectorSelected', (event) => {
        selectedSector = event.detail;
        updateSectorChart();
    });

    document.addEventListener('driverChanged', (event) => {
        selectedDriver = event.detail;
        updateSectorChart();
    });

    document.addEventListener('lapChanged', (event) => {
        selectedLap = event.detail;
        updateSectorChart();
    });
});
