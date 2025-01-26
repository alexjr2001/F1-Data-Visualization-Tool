// Cargar los datos
d3.csv("../../2024/LapData/Bahrain_Grand_Prix.csv").then(data => {
    console.log(data);

    // Preprocesar los datos
    data.forEach(d => {
        d.LapNumber = +d.LapNumber;
        d.TyreLife = +d.TyreLife;
        d.Sector1Time = +d.Sector1Time;
        d.Sector2Time = +d.Sector2Time;
        d.Sector3Time = +d.Sector3Time;
        d.LapTime = +d.LapTime;
    });

    // Obtener los pilotos únicos
    const drivers = [...new Set(data.map(d => d.Driver))];

    // Llenar el select con los pilotos
    const driverSelect = d3.select("#driverSelect");
    driverSelect.selectAll("option")
        .data(drivers)
        .enter().append("option")
        .attr("value", d => d)
        .text(d => d);

    console.log(driverSelect);

    // Filtrar datos por piloto seleccionado
    driverSelect.on("change", function() {
        const selectedDriver = this.value;
        const filteredData = data.filter(d => d.Driver === selectedDriver);
        updateChart(filteredData);  // Actualizar el gráfico
    });

    // Configuración del gráfico
    const margin = {top: 30, right: 50, bottom: 10, left: 50};
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const dimensions = ["LapNumber", "TyreLife", "Sector1Time", "Sector2Time", "Sector3Time", "LapTime"];
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

    // Función para actualizar el gráfico
    function updateChart(filteredData) {
        // Limpiar el gráfico antes de dibujar el nuevo
        svg.selectAll("*").remove();

        // Dibujar las líneas del gráfico
        svg.selectAll("path.line")
            .data(filteredData)
            .enter().append("path")
            .attr("class", "line")
            .attr("d", path)
            .style("stroke", "#007acc")
            .style("stroke-width", 1.5)
            .style("opacity", 0.7);

        // Añadir los ejes para cada dimensión
        svg.selectAll(".dimension")
            .data(dimensions)
            .enter().append("g")
            .attr("class", "dimension")
            .attr("transform", d => `translate(${x(d)})`)
            .each(function(d) {
                d3.select(this).call(d3.axisLeft().scale(y[d]));
            })
            .append("text")
            .style("text-anchor", "middle")
            .attr("y", -20)
            .attr("fill", "#f0f0f0")
            .style("font-size", "14px")
            .style("font-weight", "bold")
            .text(d => d);
    }

    // Cargar el gráfico por defecto con el primer piloto
    updateChart(data.filter(d => d.Driver === drivers[0]));
});
