document.addEventListener("DOMContentLoaded", function () {
    const margin = { top: 20, right: 100, bottom: 70, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select("#boxPlot")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleBand().range([0, width]).padding(0.4); // Más delgado
    const yScale = d3.scaleLinear().range([height, 0]);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    // Renderizar los ejes vacíos una vez
    svg.append("g").attr("class", "x-axis").attr("transform", `translate(0,${height})`);
    svg.append("g").attr("class", "y-axis");

    function updateBoxPlot(data, selectedDrivers) {
        if (!selectedDrivers || selectedDrivers.length === 0) {
            // Eliminar solo los elementos de datos (cajas, whiskers, etc.)
            svg.selectAll(".box, .whisker, .median, .driver-label, .median-label").remove();
            return;
        }

        // Filtrar datos por los pilotos seleccionados
        const filteredData = data.filter(d => selectedDrivers.includes(d.Driver) && d.LapTime !== "")
            .map(d => ({
                Driver: d.Driver,
                LapTime: +d.LapTime,
            }));

        if (filteredData.length === 0) {
            console.warn(`No hay datos disponibles para los pilotos seleccionados: ${selectedDrivers}`);
            return;
        }

        const driverData = d3.group(filteredData, d => d.Driver);

        const boxData = Array.from(driverData, ([Driver, laps]) => {
            const lapTimes = laps.map(d => d.LapTime).sort(d3.ascending);
            const q1 = d3.quantile(lapTimes, 0.25);
            const median = d3.quantile(lapTimes, 0.5);
            const q3 = d3.quantile(lapTimes, 0.75);
            const iqr = q3 - q1;

            const lowerWhisker = Math.max(d3.min(lapTimes), q1 - 1.5 * iqr);
            const upperWhisker = Math.min(d3.max(lapTimes), q3 + 1.5 * iqr);

            const mean = d3.mean(lapTimes);
            const std = d3.deviation(lapTimes);

            return { Driver, q1, median, q3, lowerWhisker, upperWhisker, mean, std };
        });

        xScale.domain(boxData.map(d => d.Driver));
        yScale.domain([d3.min(boxData, d => d.lowerWhisker), d3.max(boxData, d => d.upperWhisker)]);

        // Actualizar los ejes
        svg.select(".x-axis").call(xAxis)
            .selectAll("text")
            .attr("transform", "translate(0, 5)")
            .style("font-size", "12px")
            .attr("fill", "white");

        svg.select(".y-axis").call(yAxis).selectAll("text").attr("fill", "white");
        svg.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 10)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "white")
        .style("font-size", "14px")
        .text("LapTime (s)");


        // Renderizar cajas
        const boxes = svg.selectAll(".box").data(boxData);

        boxes.enter()
            .append("rect")
            .attr("class", "box")
            .merge(boxes)
            .attr("x", d => xScale(d.Driver) + xScale.bandwidth() / 4)
            .attr("y", d => yScale(d.q3))
            .attr("width", xScale.bandwidth() / 2)
            .attr("height", d => yScale(d.q1) - yScale(d.q3))
            .attr("fill", d => getDriverColor(d.Driver))
            .attr("stroke", "white");

        boxes.exit().remove();

        // Renderizar whiskers
        const whiskers = svg.selectAll(".whisker").data(boxData);

        whiskers.enter()
            .append("line")
            .attr("class", "whisker")
            .merge(whiskers)
            .attr("x1", d => xScale(d.Driver) + xScale.bandwidth() / 2)
            .attr("x2", d => xScale(d.Driver) + xScale.bandwidth() / 2)
            .attr("y1", d => yScale(d.lowerWhisker))
            .attr("y2", d => yScale(d.upperWhisker))
            .attr("stroke", "white");

        whiskers.exit().remove();

        // Renderizar mediana
        const medians = svg.selectAll(".median").data(boxData);

        medians.enter()
            .append("line")
            .attr("class", "median")
            .merge(medians)
            .attr("x1", d => xScale(d.Driver) + xScale.bandwidth() / 4)
            .attr("x2", d => xScale(d.Driver) + 3 * xScale.bandwidth() / 4)
            .attr("y1", d => yScale(d.median))
            .attr("y2", d => yScale(d.median))
            .attr("stroke", "white");

        medians.exit().remove();

        // Renderizar etiquetas con información adicional (media y desviación estándar)
        const labels = svg.selectAll(".driver-label").data(boxData);

        labels.enter()
            .append("text")
            .attr("class", "driver-label")
            .merge(labels)
            .attr("x", d => xScale(d.Driver) + xScale.bandwidth() / 2)
            .attr("y", height + 35) // Posición debajo del eje X
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("fill", "white")
            .text(d => `μ=${d.mean.toFixed(2)}, σ=${d.std.toFixed(2)}`);

        labels.exit().remove();

        // Renderizar etiquetas con la mediana
        const medianLabels = svg.selectAll(".median-label").data(boxData);

        medianLabels.enter()
            .append("text")
            .attr("class", "median-label")
            .merge(medianLabels)
            .attr("x", d => xScale(d.Driver) + xScale.bandwidth() / 2)
            .attr("y", height + 50) // Posición debajo de las etiquetas de media
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .attr("fill", "white")
            .text(d => `Median=${d.median.toFixed(2)}`);

        medianLabels.exit().remove();
    }

    let raceFile = "";

    document.addEventListener("raceFileChanged", function (event) {
        raceFile = event.detail.raceFile;

        if (raceFile) {
            d3.csv(`../../2024/LapData/${raceFile}`).then(data => {
                const drivers = [...new Set(data.map(d => d.Driver))];

                // Escuchar cambios en los pilotos seleccionados
                document.addEventListener("driverChanged", function (event) {
                    const selectedDrivers = event.detail;
                    updateBoxPlot(data, selectedDrivers);
                });
            });
        }
    });
});
