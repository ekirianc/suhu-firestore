import json
from datetime import datetime
from collections import defaultdict
import numpy as np
import pytz


def process_temperature_data(input_file, output_file_daily, output_file_calculated):
    # Membaca data dari JSON
    with open(input_file, 'r') as file:
        data = json.load(file)

    # Set the time zone to UTC
    utc_timezone = pytz.timezone('UTC')

    # Membuat dictionary untuk menyimpan peak, lowest temperature, waktu terjadinya, jumlah data point, status valid,
    # dan total data valid setiap hari
    daily_temperatures = defaultdict(lambda: {
        'peak_temp': float('-inf'),
        'lowest_temp': float('inf'),
        'peak_time': "",
        'lowest_time': "",
        'data_point_count': 0,
        'is_valid': True,
        'total_temp': 0,
        'total_humidity': 0,
    })

    # New variables for storing highest and lowest temperatures for correlation calculation
    daily_highest_temps = []
    daily_lowest_temps = []

    # Mengolah data
    for entry in data['data']:
        timestamp = entry['time']
        temperature = entry['temp']
        humidity = entry['humid']

        # Convert timestamp to datetime with UTC timezone
        dt_utc = datetime.utcfromtimestamp(timestamp).replace(tzinfo=utc_timezone)

        # Convert UTC time to GMT+8
        dt_gmt8 = dt_utc.astimezone(pytz.timezone('Asia/Singapore'))

        # Menghitung hari dari timestamp
        day = dt_gmt8.strftime('%Y-%m-%d')

        # Memperbarui peak, lowest temperature, waktu terjadinya, dan jumlah data point
        daily_temperatures[day]['total_temp'] += temperature
        daily_temperatures[day]['total_humidity'] += humidity

        # Collect highest and lowest temperatures for correlation calculation
        daily_highest_temps.append(daily_temperatures[day]['peak_temp'])
        daily_lowest_temps.append(daily_temperatures[day]['lowest_temp'])

        if temperature > daily_temperatures[day]['peak_temp']:
            daily_temperatures[day]['peak_temp'] = temperature
            daily_temperatures[day]['peak_time'] = dt_gmt8.strftime('%I:%M %p')

        if temperature < daily_temperatures[day]['lowest_temp']:
            daily_temperatures[day]['lowest_temp'] = temperature
            daily_temperatures[day]['lowest_time'] = dt_gmt8.strftime('%I:%M %p')

        daily_temperatures[day]['data_point_count'] += 1
        daily_temperatures[day]['valid'] = daily_temperatures[day]['data_point_count'] >= 230

        # Menambahkan temperatur ke dalam field z_scores_temp
        daily_temperatures[day]['z_scores_temp'].append(temperature)

    # Menyimpan hasil ke file JSON
    daily_temperatures_list = []
    output_data_calculated = {}
    total_valid_data_points = 0  # Menyimpan total data point valid
    max_temp = float('-inf')  # Menyimpan max temperature dari data point valid
    low_temp = float('inf')  # Menyimpan low temperature dari data point valid
    max_temp_time = None  # Menyimpan waktu kapan max temperature terjadi
    low_temp_time = None  # Menyimpan waktu kapan low temperature terjadi
    max_temp_date = None
    low_temp_date = None
    total_recorded_days = len(daily_temperatures)  # Jumlah semua hari yang terekam
    total_valid_days = 0  # Jumlah hari yang valid
    overall_total_valid_temp = 0  # Menyimpan total temperatur dari hari yang valid
    overall_total_valid_humidity = 0  # Menyimpan total humidity dari hari yang valid

    temperature_values_peak_low = []

    # Mengolah data harian
    for day, temperatures in daily_temperatures.items():
        peak_temp = temperatures['peak_temp']
        lowest_temp = temperatures['lowest_temp']
        peak_time = temperatures['peak_time']
        lowest_time = temperatures['lowest_time']
        data_point_count = temperatures['data_point_count']
        is_valid = data_point_count >= 230
        total_valid_data_points += data_point_count if is_valid else 0
        total_valid_days += 1 if is_valid else 0

        if peak_temp > max_temp:
            max_temp = peak_temp
            max_temp_date = dt_gmt8.strftime('%Y-%m-%d')
            max_temp_time = dt_gmt8.strftime('%I:%M %p')

        if lowest_temp < low_temp:
            low_temp = lowest_temp
            low_temp_date = dt_gmt8.strftime('%Y-%m-%d')
            low_temp_time = dt_gmt8.strftime('%I:%M %p')

        if is_valid:
            overall_total_valid_temp += temperatures['total_temp']
            overall_total_valid_humidity += temperatures['total_humidity']

        if temperatures['valid']:
            temperature_values_peak_low.append((temperatures['peak_temp'], temperatures['lowest_temp']))
            if len(temperature_values_peak_low) > 1:  # Check if there are at least two days with valid data
                daily_correlation_peak_low = np.corrcoef(*zip(*temperature_values_peak_low))[0, 1]
            else:
                daily_correlation_peak_low = None
        else:
            daily_correlation_peak_low = None

        # Your existing code to append to daily_temperatures_list
        daily_temperatures_list.append({
            'day': day,
            'peak_temperature': peak_temp,
            'lowest_temperature': lowest_temp,
            'peak_temperature_time': peak_time,
            'lowest_temperature_time': lowest_time,
            'data_point_count': data_point_count,
            'total_temp': temperatures['total_temp'],
            'total_humidity': temperatures['total_humidity'],
            'avg_temperature': temperatures['total_temp'] / data_point_count,
            'is_valid': is_valid,
            'daily_correlation_peak_low': daily_correlation_peak_low,
        })

    # Menambah field total data point valid, max temperature, dan low temperature
    output_data_calculated['total_valid_data_points'] = total_valid_data_points
    output_data_calculated['overall_peak_temperature'] = {'value': max_temp, 'date': max_temp_date, 'time': max_temp_time}
    output_data_calculated['overall_low_temperature'] = {'value': low_temp, 'date': low_temp_date, 'time': low_temp_time}
    output_data_calculated['overall_avg_temp'] = overall_total_valid_temp / total_valid_data_points if total_valid_data_points > 0 else 0  # Menghindari NaN jika tidak ada hari yang valid
    output_data_calculated['overall_avg_humidity'] = overall_total_valid_humidity / total_valid_data_points if total_valid_data_points > 0 else 0
    output_data_calculated['total_recorded_days'] = total_recorded_days
    output_data_calculated['total_valid_days'] = total_valid_days
    output_data_calculated['overall_total_valid_temp'] = overall_total_valid_temp
    output_data_calculated['overall_total_valid_humidity'] = overall_total_valid_humidity

    # Menambahkan nilai korelasi antara temperature dan humidity
    temperature_values = []
    humidity_values = []

    for day, temperatures in daily_temperatures.items():
        temperature_values.append(temperatures['total_temp'] / temperatures['data_point_count'])
        humidity_values.append(temperatures['total_humidity'] / temperatures['data_point_count'])

    correlation = np.corrcoef(temperature_values, humidity_values)[0, 1]
    output_data_calculated['correlation_temperature_humidity'] = correlation

    # Calculate correlation between peak temperature and lowest temperature for each day
    temperature_values_peak_low = []
    for day, temperatures in daily_temperatures.items():
        if temperatures['valid']:
            temperature_values_peak_low.append((temperatures['peak_temp'], temperatures['lowest_temp']))

    correlation_peak_low = np.corrcoef(*zip(*temperature_values_peak_low))[0, 1]
    output_data_calculated['correlation_peak_low_temperature'] = correlation_peak_low

    # Save the main output data (including daily_temperatures) to a file
    with open(output_file_daily, 'w') as output_file_daily:
        json.dump(daily_temperatures_list, output_file_daily, indent=2)

    print(f"Proses berhasil. Hasil disimpan di '{output_file_daily}'.")

    # Save the calculated data to a file
    with open(output_file_calculated, 'w') as output_file_calculated:
        json.dump(output_data_calculated, output_file_calculated, indent=2)

    print(f"Proses berhasil. Hasil disimpan di '{output_file_calculated}'.")


if __name__ == "__main__":
    # Mengatur nama file input dan output
    input_file_path = r"D:\Code\web\suhu-v2\public\01 data-real.json"
    # Set the paths for the output files
    output_file_main_path = r"D:\Code\web\suhu-v2\public\02a data-daily-calculated.json"
    output_file_calculated_path = r"D:\Code\web\suhu-v2\public\02b data-overall-calculated.json"

    # Process data and save the results in separate files
    process_temperature_data(input_file_path, output_file_main_path, output_file_calculated_path)
