let highlightDrivers = [];
document.addEventListener("raceFileChanged", function (event) {
    const raceFile = event.detail.raceFile; // Obtener el archivo seleccionado

    d3.csv(`../../2024/calculated_variables/${raceFile}`).then(data => {
        // Convertir datos numéricos
        data.forEach(d => {
            d.InitialPosition = +d.InitialPosition;
            d.AvgLapTime = +d.AvgLapTime;
            d.AvgSector1 = +d.AvgSector1;
            d.AvgSector2 = +d.AvgSector2;
            d.AvgSector3 = +d.AvgSector3;
            d.LapTimeSTD = +d.LapTimeSTD;
            d.FinalPosition = +d.FinalPosition;
        });

        const dimensions = ['InitialPosition', 'AvgLapTime', 'AvgSector1', 'AvgSector2', 'AvgSector3', 'LapTimeSTD', 'FinalPosition'];
        const colorScale = d3.scaleOrdinal()
            .domain(data.map(d => d.Driver))
            .range(d3.schemeCategory10);

        const margin = { top: 50, right: 50, bottom: 50, left: 50 };
        const width = 960 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Limpiar el gráfico existente
        d3.select("#chart2").selectAll("*").remove();

        const svg = d3.select("#chart2")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        const y = {};
        dimensions.forEach(dim => {
            y[dim] = d3.scaleLinear()
                .domain(d3.extent(data, d => d[dim]))
                .range([height, 0]);
        });

        const x = d3.scalePoint()
            .range([0, width])
            .domain(dimensions);

        function path(d) {
            return d3.line()(dimensions.map(dim => [x(dim), y[dim](d[dim])]));
        }

        const tooltip = d3.select("#chart2")
            .append("div")
            .style("position", "absolute")
            .style("background", "black")
            .style("border", "1px solid #ccc")
            .style("padding", "5px")
            .style("border-radius", "5px")
            .style("visibility", "hidden")
            .style("pointer-events", "none")
            .style("font-size", "12px");

        const lines = svg.selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", path)
            .attr("class", "line")
            .style("fill", "none")
            .style("stroke", d => getDriverColor(d.Driver))
            .style("stroke-width", 1.5)
            .style("opacity", 0.3)
            .on("mouseover", function (event, d) {
                tooltip.style("visibility", "visible").html(`Driver: ${d.Driver}`);
                d3.select(this).style("stroke-width", 3).style("opacity", 1);
            })
            .on("mousemove", function (event) {
                const containerRect = d3.select("#chart2").node().getBoundingClientRect();
                tooltip.style("top", (event.clientY - containerRect.top - 10) + "px")
                    .style("left", (event.clientX - containerRect.left + 10) + "px");
            })
            .on("mouseout", function (event, d) {
                // Restaurar los estilos al hacer mouseout
                tooltip.style("visibility", "hidden");
                // Restaurar los estilos al valor original si el piloto no está seleccionado
                if(!highlightDrivers.includes(d.Driver)){
                    d3.select(this)
                        .style("stroke-width", 1.5)
                        .style("opacity", 0.3);
                }
            });
        

        dimensions.forEach(dim => {
            svg.append("g")
                .attr("transform", `translate(${x(dim)},0)`)
                .each(function () { d3.select(this).call(d3.axisLeft().scale(y[dim])); })
                .append("text")
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .attr("fill", "#f0f0f0")
                .text(dim)
                .style("font-size", "12px")
                .style("font-weight", "bold");
        });

        const driverSelect = d3.select("#driverSelect");

        // Limpiar el dropdown antes de llenarlo
        driverSelect.html("");

        // Añadir la opción por defecto
        
        // Llenar el dropdown con los nombres de los pilotos
        driverSelect.selectAll("option")
        .data(data.map(d => d.Driver))
        .enter().append("option")
        .text(d => d)
        .attr("value", d => d);
        
        driverSelect.append("option")
            .text("Select Driver")
            .attr("value", "")
            .attr("disabled", true)
            .attr("selected", true);
        // Escuchar cambios en los pilotos seleccionados
        document.addEventListener('driverChanged', function (event) {
            const selectedDrivers = event.detail;
            highlightDrivers = selectedDrivers;

            lines.style("stroke", d => selectedDrivers.includes(d.Driver) ? getDriverColor(d.Driver) : getDriverColor(d.Driver))
                .style("opacity", d => selectedDrivers.includes(d.Driver) ? 1 : 0.3)
                .style("stroke-width", d => selectedDrivers.includes(d.Driver) ? 3 : 1);
        });

    }).catch(error => {
        console.error(`Error cargando datos de la carrera ${raceFile}:`, error);
    });
});
