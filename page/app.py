from flask import Flask, jsonify, request
from flask_cors import CORS
import fastf1

app = Flask(__name__)
CORS(app, resources={r"/get_lap_data": {"origins": "http://127.0.0.1:5500"},
                     r"/get_circuit": {"origins": "http://127.0.0.1:5500"},
                     r"/get_sectors": {"origins": "http://127.0.0.1:5500"},
                     r"/load_race_data": {"origins": "http://127.0.0.1:5500"}
                     })

# Habilitar caché de FastF1
fastf1.Cache.enable_cache('cache')

race = None
cur_name=None
cur_year=0

@app.route('/load_race_data', methods=['GET'])
def load_race_data():
    try:
        year = request.args.get('year')
        race_name = request.args.get('race')

        # Validate the input
        if not year or not race_name:
            return jsonify({"error": "Missing parameters"}), 400
        
        global race
        global cur_year
        global cur_name

        # Verificar si la carrera ya está cargada para el año y la carrera especificados
        if race and cur_year == int(year) and cur_name == race_name:
            return jsonify({"message": f"Race data for {race_name} {year} is already loaded."}), 200
        # Load the race session
        cur_name = race_name
        cur_year = int(year)
        race = fastf1.get_session(int(year), race_name, 'R')
        race.load()

        return jsonify({"message": f"Race data for {race_name} {year} loaded successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# Cargar los datos de la sesión solo una vez
def load_race_data_check():
    global race
    if race is None:
        race = fastf1.get_session(2024, 'Bahrain', 'R')
        race.load()


@app.route('/get_lap_data', methods=['GET'])
def get_lap_data():             #Just one driver
    driver = request.args.get('driver')
    lap_number = request.args.get('lap')

    if not driver or not lap_number:
        return jsonify({"error": "Missing parameters"}), 400

    try:
        #load_race_data_check()  # Cargar la carrera solo una vez

        lap_data = race.laps.pick_driver(driver).pick_lap(int(lap_number))
        lap_data = lap_data.get_car_data().add_distance()
        lap_data['Time'] = lap_data['Time'].dt.total_seconds()
        lap_data['DifferentialDist'] = lap_data["Distance"].diff()


        if lap_data.empty:
            return jsonify({"error": "No data found"}), 404

        lap_data['DifferentialDist'] = lap_data['DifferentialDist'].fillna(0)
        result = lap_data[['RPM', 'Speed', 'nGear', 'Throttle', 'Brake', 'DRS', 'Time', 'Distance','DifferentialDist']].to_dict(orient='records')
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/get_circuit', methods=['GET'])
def get_circuit():
    driver = request.args.get('driver')
    lap_number = request.args.get('lap')

    if not driver or not lap_number:
        return jsonify({"error": "Missing parameters"}), 400

    try:
        #load_race_data_check()  # Cargar la carrera solo una vez

        # Obtención de datos de telemetría del piloto y vuelta seleccionada
        lap_data = race.laps.pick_driver(driver).pick_lap(int(lap_number))
        telemetry = lap_data.get_telemetry()
        # Asegurar que las longitudes de X, Y, Speed, Brake y Throttle sean consistentes
        if len(telemetry['X'].values) == len(telemetry['Y'].values) == len(telemetry['Speed'].values) == len(telemetry['Brake'].values) == len(telemetry['Throttle'].values):
            # Convertir los datos a listas de Python
            x_vals = telemetry['X'].values.tolist()
            y_vals = telemetry['Y'].values.tolist()
            speed_vals = telemetry['Speed'].values.tolist()
            brake_vals = telemetry['Brake'].values.tolist()  # Extraer los valores de freno
            throttle_vals = telemetry['Throttle'].values.tolist()  # Extraer los valores de acelerador
        else:
            return jsonify({"error": "Inconsistent telemetry data for this lap."}), 500

        # Devolver los datos en formato JSON
        result = {
            'x': x_vals,
            'y': y_vals,
            'speed': speed_vals,
            'brake': brake_vals,  # Incluir freno
            'throttle': throttle_vals  # Incluir acelerador
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500



def get_coordinates_for_time(target_time, time_vals, x_vals, y_vals):
    if target_time is None:
        print(f"Tiempo objetivo no válido: {target_time}")
        return None, None

    for i in range(len(time_vals) - 1):
        # Verificar si el tiempo objetivo está en el intervalo actual
        if time_vals[i] <= target_time <= time_vals[i + 1]:
            # Interpolación lineal
            ratio = (target_time - time_vals[i]) / (time_vals[i + 1] - time_vals[i])
            x = x_vals[i] + ratio * (x_vals[i + 1] - x_vals[i])
            y = y_vals[i] + ratio * (y_vals[i + 1] - y_vals[i])
            return x, y

    # Si no se encuentra un intervalo válido, retornar None
    print(f"No se encontró un intervalo para el tiempo: {target_time}")
    return None, None



@app.route('/get_sectors', methods=['GET'])
def get_sectors():

    try:

        # Obtención de datos de telemetría del piloto y vuelta seleccionada
        lap_data = race.laps.pick_fastest()
        telemetry = lap_data.get_telemetry()
        # Asegurar que las longitudes de X, Y, Speed, Brake y Throttle sean consistentes
        if len(telemetry['X'].values) == len(telemetry['Y'].values) == len(telemetry['Speed'].values) == len(telemetry['Brake'].values) == len(telemetry['Throttle'].values):
            # Convertir los datos a listas de Python
            x_vals = telemetry['X'].values.tolist()
            y_vals = telemetry['Y'].values.tolist()
            speed_vals = telemetry['Speed'].values.tolist()
            brake_vals = telemetry['Brake'].values.tolist()  # Extraer los valores de freno
            throttle_vals = telemetry['Throttle'].values.tolist()  # Extraer los valores de acelerador
            distance_vals = telemetry['Distance'].values.tolist()  # Extraer los valores de acelerador
            time_vals = [t / 1_000_000_000 for t in telemetry['Time'].values.tolist()]
        else:
            return jsonify({"error": "Inconsistent telemetry data for this lap."}), 500

        # Convertir tiempos de sectores a segundos directamente
        sector1_time = lap_data["Sector1Time"].total_seconds() if lap_data["Sector1Time"] else None
        sector2_time = lap_data["Sector2Time"].total_seconds() if lap_data["Sector2Time"] else None
        sector3_time = lap_data["Sector3Time"].total_seconds() if lap_data["Sector3Time"] else None
        
        sector1_end_time = sector1_time
        sector2_end_time = sector1_time + sector2_time
        sector3_end_time = sector2_end_time + sector3_time

        # Calcular coordenadas de los sectores
        sector1_coords = get_coordinates_for_time(sector1_end_time, time_vals, x_vals, y_vals) if sector1_end_time else (None, None)
        sector2_coords = get_coordinates_for_time(sector2_end_time, time_vals, x_vals, y_vals) if sector2_end_time else (None, None)
        sector3_coords = get_coordinates_for_time(sector3_end_time, time_vals, x_vals, y_vals) if sector3_end_time else (None, None)


        # Devolver los datos en formato JSON
        result = {
            'x': x_vals,
            'y': y_vals,
            'speed': speed_vals,
            'brake': brake_vals,
            'throttle': throttle_vals,
            'distance': distance_vals,
            'sector1_coords': {'x': sector1_coords[0], 'y': sector1_coords[1]},
            'sector2_coords': {'x': sector2_coords[0], 'y': sector2_coords[1]},
            'sector3_coords': {'x': sector3_coords[0], 'y': sector3_coords[1]},
        }

        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    

if __name__ == '__main__':
    app.run(debug=True)
