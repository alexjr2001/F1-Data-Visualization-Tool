document.getElementById('loadDataBtn').addEventListener('click', function(event) {
    event.preventDefault();
    // Obtener los valores de los selectores
    var year = document.getElementById('year').value;
    var race = document.getElementById('race').value;

    // Validar si se han seleccionado ambos valores
    if (!year || !race) {
        document.getElementById('message').textContent = 'Please select both a year and a race.';
        return;
    }
    
    // Mostrar un mensaje mientras se cargan los datos
    document.getElementById('message').textContent = 'Loading data...';

    // Realizar la solicitud GET para cargar los datos de la carrera
    fetch(`http://127.0.0.1:5000/load_race_data?year=${year}&race=${race}`)
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                document.getElementById('message').textContent = data.message;
            } else {
                document.getElementById('message').textContent = 'Error loading data.';
            }
        })
        .catch(error => {
            document.getElementById('message').textContent = 'Error: ' + error;
        });
});
