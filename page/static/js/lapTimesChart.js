document.addEventListener("DOMContentLoaded", function () {
    const margin = { top: 20, right: 100, bottom: 50, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#laptimesChart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLinear().range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);

    const xAxis = d3.axisBottom(xScale).tickFormat(d3.format("d"));
    const yAxis = d3.axisLeft(yScale);

    svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
    svg.append("g").attr("class", "y-axis");

    // Etiqueta para el eje Y (LapTime (s))
    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "white") // Cambiar a blanco si el fondo es oscuro
        .text("LapTime (s)");

    // Etiqueta para el eje X (Number of Lap)
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "white") // Cambiar a blanco si el fondo es oscuro
        .text("Number of Lap");


    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("background", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("pointer-events", "none")
        .style("display", "none");

    const hoverLine = svg.append("line")
        .attr("class", "hover-line")
        .attr("stroke", "white")
        .attr("stroke-dasharray", "4")
        .attr("stroke-width", 1)
        .style("display", "none");

    function updateLineChart(data, selectedDrivers) {
        if (!selectedDrivers || selectedDrivers.length === 0) {
            // Ocultar el gráfico si no hay pilotos seleccionados
            svg.selectAll(".line").remove();
            svg.selectAll(".hover-area").remove();
            hoverLine.style("display", "none");
            tooltip.style("display", "none");
            return;
        }

        const filteredData = data.filter(d => selectedDrivers.includes(d.Driver) && d.LapTime !== "")
            .map(d => ({
                Driver: d.Driver,
                LapNumber: +d.LapNumber,
                LapTime: +d.LapTime
            }));

        if (filteredData.length === 0) {
            console.warn(`No data available for the selected drivers: ${selectedDrivers}`);
            return;
        }

        const driverData = d3.group(filteredData, d => d.Driver);

        const allLapNumbers = filteredData.map(d => d.LapNumber);
        const allLapTimes = filteredData.map(d => d.LapTime);

        const lowerPercentile = d3.quantile(allLapTimes, 0.00);
        const upperPercentile = d3.quantile(allLapTimes, 1.00);

        xScale.domain([d3.min(allLapNumbers), d3.max(allLapNumbers)]);
        yScale.domain([lowerPercentile, upperPercentile]);

        svg.select(".x-axis").call(xAxis);
        svg.select(".y-axis").call(yAxis);
        
        const line = d3.line()
            .x(d => xScale(d.LapNumber))
            .y(d => yScale(d.LapTime));

        const lines = svg.selectAll(".line")
            .data(Array.from(driverData.entries()), d => d[0]);

        lines.enter()
            .append("path")
            .attr("class", "line")
            .merge(lines)
            .attr("d", d => line(d[1]))
            .attr("fill", "none")
            .attr("stroke", d => getDriverColor(d[0]))
            .attr("stroke-width", 2);

        lines.exit().remove();

        svg.append("rect")
            .attr("class", "hover-area")
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("mousemove", function (event) {
                const [mouseX] = d3.pointer(event);
                const lapNumber = Math.round(xScale.invert(mouseX));

                hoverLine
                    .attr("x1", xScale(lapNumber))
                    .attr("x2", xScale(lapNumber))
                    .attr("y1", 0)
                    .attr("y2", height)
                    .style("display", null);

                const tooltipData = Array.from(driverData.entries()).map(([driver, laps]) => {
                    const lap = laps.find(d => d.LapNumber === lapNumber);
                    return {
                        driver,
                        lapTime: lap ? lap.LapTime.toFixed(3) : "N/A",
                        color: getDriverColor(driver)
                    };
                });

                tooltip
                    .html(`<strong>Lap ${lapNumber}</strong><br>
                        ${tooltipData.map(d => `<div style="color:${d.color}">${d.driver}: ${d.lapTime}s</div>`).join("")}`)
                    .style("left", `${event.pageX + 15}px`)
                    .style("top", `${event.pageY}px`)
                    .style("display", "block");
            })
            .on("mouseout", function () {
                hoverLine.style("display", "none");
                tooltip.style("display", "none");
            });
    }

    let raceFile = "";

    document.addEventListener("raceFileChanged", function (event) {
        raceFile = event.detail.raceFile;

        if (raceFile) {
            d3.csv(`../../2024/LapData/${raceFile}`).then(data => {
                document.addEventListener("driverChanged", function (event) {
                    const selectedDrivers = event.detail;
                    updateLineChart(data, selectedDrivers);
                });
            });
        }
    });
});
