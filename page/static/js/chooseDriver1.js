// Escuchar cambios en la carrera seleccionada
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

        // Cambiar la escala de colores a d3.interpolateCool para un fondo oscuro
        const color = d3.scaleSequential(d3.interpolateCool).domain(d3.extent(data, d => d.AvgLapTime));

        const margin = { top: 50, right: 150, bottom: 50, left: 50 };
        const width = 960 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Limpiar SVG existente
        d3.select("#chart1").selectAll("*").remove();

        const svg = d3.select("#chart1")
            .append("svg")
            .attr("width", width + margin.left + margin.right + 100) // Espacio adicional para la leyenda
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Crear una escala para cada dimensión
        const y = {};
        dimensions.forEach(dim => {
            y[dim] = d3.scaleLinear()
                .domain(d3.extent(data, d => d[dim]))
                .range([height, 0]);
        });

        const x = d3.scalePoint()
            .range([0, width])
            .domain(dimensions);

        // Función para dibujar líneas
        function path(d) {
            return d3.line()(dimensions.map(dim => [x(dim), y[dim](d[dim])]));
        }

        // Crear el contenedor del tooltip (fuera del gráfico)
        const tooltip = svg.append("text")
            .attr("id", "tooltip")
            .style("visibility", "hidden")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .style("fill", "#ffffff");

        // Dibujar las líneas con hover para mostrar acrónimo del piloto
        svg.selectAll("path")
            .data(data)
            .enter().append("path")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", d => color(d.AvgLapTime))
            .style("stroke-width", 1.5)
            .style("opacity", 0.7)
            .on("mouseover", function (event, d) {
                d3.select(this)
                    .style("stroke-width", 3)
                    .style("opacity", 1);
                // Mostrar el nombre del piloto con el prefijo "Driver: "
                tooltip.style("visibility", "visible")
                    .text("Driver: " + d.Driver) // Formato de texto
                    .attr("x", width + 20) // Colocar al costado del gráfico
                    .attr("y", 20)
                    .attr("text-anchor", "start");
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("stroke-width", 1.5)
                    .style("opacity", 0.7);
                tooltip.style("visibility", "hidden"); // Ocultar el texto al salir del hover
            });

        // Añadir ejes y etiquetas
        dimensions.forEach(dim => {
            svg.append("g")
                .attr("transform", `translate(${x(dim)},0)`)
                .each(function () { d3.select(this).call(d3.axisLeft().scale(y[dim])); })
                .append("text")
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .attr("fill", "#ffffff")
                .text(dim)
                .style("font-size", "12px")
                .style("font-weight", "bold");
        });

        // Crear la leyenda de color para AvgLapTime
        const legendHeight = 200;
        const legendWidth = 20;

        const legendScale = d3.scaleLinear()
            .domain(d3.extent(data, d => d.AvgLapTime))
            .range([legendHeight, 0]);

        const legendAxis = d3.axisRight(legendScale)
            .ticks(5)
            .tickSize(6)
            .tickPadding(4)
            .tickFormat(d3.format(".2f"));

        // Añadir la leyenda con el gradiente
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 60},${height / 2 - legendHeight / 2})`);

        // Título de la leyenda
        legend.append("text")
            .attr("x", legendWidth / 2)
            .attr("y", -10)
            .attr("text-anchor", "middle")
            .attr("fill", "#ffffff")
            .text("AvgLapTime")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        // Crear el gradiente de color
        const gradient = svg.append("defs")
            .append("linearGradient")
            .attr("id", "color-gradient")
            .attr("gradientUnits", "userSpaceOnUse")
            .attr("x1", 0).attr("y1", legendHeight)
            .attr("x2", 0).attr("y2", 0);

        gradient.selectAll("stop")
            .data(d3.range(0, 1.1, 0.1))
            .enter().append("stop")
            .attr("offset", d => d)
            .attr("stop-color", d => color(legendScale.invert(d * legendHeight)));

        // Dibujar el rectángulo con el gradiente de color
        legend.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#color-gradient)");

        // Añadir el eje de la leyenda
        legend.append("g")
            .attr("transform", `translate(${legendWidth}, 0)`)
            .call(legendAxis)
            .selectAll("text")
            .style("fill", "#ffffff");

    }).catch(error => {
        console.error(`Error cargando datos de la carrera ${raceFile}:`, error);
    });
});
