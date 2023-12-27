import json
from datetime import datetime, timedelta
from collections import defaultdict
import numpy as np
import pytz
from matplotlib import pyplot as plt
from tqdm import tqdm

# minimum amount of daily data to execute calculation process
DATA_THRESHOLD = 230
TIMEZONE = 'Asia/Singapore'
# Heat index (Fischer and Schär 2010)
C = [-8.7847, 1.6114, -0.012308, 2.3385, -0.14612, 2.2117e-3, -0.016425, 7.2546e-4, -3.582e-6]


def get_heat_index(temperature, humidity):
    TC = temperature
    H = humidity

    heat_index_celcius = (C[0] + C[1] * TC + C[2] * TC ** 2 +
                          H * (C[3] + C[4] * TC + C[5] * TC ** 2) +
                          H ** 2 * (C[6] + C[7] * TC + C[8] * TC ** 2))

    return round(heat_index_celcius, 2)


def save_json(data, output_file):
    with open(output_file, 'w') as output:
        json.dump(data, output, indent=2)


def get_local_datetime(timestamp):
    """
    konversi epoch timestamp ke waktu lokal

    :param timestamp: number. epoch timestamp
    :return: datetime. ex: 2023-12-09 21:21:48+08:00
    """
    utc_timezone = pytz.timezone('UTC')
    dt_utc = datetime.utcfromtimestamp(timestamp).replace(tzinfo=utc_timezone)
    return dt_utc.astimezone(pytz.timezone(TIMEZONE))


def format_time(dt):
    return dt.strftime('%I:%M %p')


def format_date(dt):
    return dt.strftime('%Y-%m-%d')


def group_daily_data_by_hour(data):
    """
    mengubah stuktur dari file json untuk dikelompokan per jam setiap harinya

    :param data: data dari file json dengan struktur
           { "data": [{ "time": ..., "temp": ..., "humid": ... }] }
    :return: dictionary dengan struktur seperti berikut:
            {
                'YYYY-MM-DD': {
                    0: [t1, t2, ...], # list of temperatures for hour 0 (midnight) on this date,
                    1: [t1, t2, ...], # list of temperatures for hour 1 (one am) on this date,
    """
    grouped_daily_temps_by_hour = defaultdict(lambda: defaultdict(list))
    for entry_index, entry in tqdm(enumerate(data['data']), desc='Processing Data', total=len(data['data'])):
        temperature = entry['temp']
        timestamp = entry['time']

        dt_local = get_local_datetime(timestamp)
        date = dt_local.strftime('%Y-%m-%d')
        hour = dt_local.hour

        grouped_daily_temps_by_hour[date][hour].append(temperature)
    return grouped_daily_temps_by_hour

def group_daily_humidity_by_hour(data):
    grouped_daily_humidity_by_hour = defaultdict(lambda: defaultdict(list))

    for entry_index, entry in tqdm(enumerate(data['data']), desc='Processing Data', total=len(data['data'])):
        humidity = entry['humid']
        timestamp = entry['time']

        dt_local = get_local_datetime(timestamp)
        date = dt_local.strftime('%Y-%m-%d')
        hour = dt_local.hour

        grouped_daily_humidity_by_hour[date][hour].append(humidity)

    return grouped_daily_humidity_by_hour


def calculate_daily_data_summaries(data):
    """
    assign JSON data ke daily_data dictionanry
    :param data: json file
    :return: daily_data dictionary
    """
    # Create a dictionary
    daily_data = defaultdict(lambda: {
        'peak_temp': float('-inf'),
        'lowest_temp': float('inf'),
        'peak_time': "",
        'lowest_time': "",
        'data_point_count': 0,
        'is_valid': True,
        'total_temp': 0,
        'total_humidity': 0,

        'temp_entries': [],
        'humid_entries': [],
        'time_entries': [],

        'heat_index_entries': [],
        'hourly_avg_temps': {},

        'hourly_peak_temp': {},
        'hourly_low_temp': {}
    })

    # iterate each json entry
    for entry_index, entry in tqdm(enumerate(data['data']), desc='Processing Data', total=len(data['data'])):
        timestamp = entry['time']
        temperature = entry['temp']
        humidity = entry['humid']

        dt_local = get_local_datetime(timestamp)
        date = format_date(dt_local)

        # bulatkan waktu ke 5 menit terdekat
        rounded_time = int(5 * round(float(dt_local.minute) / 5))
        rounded_dt_local = dt_local.replace(minute=0, second=0, microsecond=0) + timedelta(minutes=rounded_time)

        # Menambahkan data ke entri harian
        if rounded_dt_local.hour != 0 or rounded_dt_local.minute != 0:
            daily_data[date]['temp_entries'].append(temperature)
            daily_data[date]['humid_entries'].append(humidity)
            daily_data[date]['time_entries'].append(format_time(rounded_dt_local))

        daily_data[date]['total_temp'] += temperature
        daily_data[date]['total_humidity'] += humidity

        # search for daily peak/low temp
        if temperature > daily_data[date]['peak_temp']:
            daily_data[date]['peak_temp'] = temperature
            daily_data[date]['peak_time'] = format_time(dt_local)

        if temperature < daily_data[date]['lowest_temp']:
            daily_data[date]['lowest_temp'] = temperature
            daily_data[date]['lowest_time'] = format_time(dt_local)

        daily_data[date]['data_point_count'] += 1
        daily_data[date]['is_valid'] = daily_data[date]['data_point_count'] >= DATA_THRESHOLD

        # Calculate the heat index and add data to daily entries
        heat_index = get_heat_index(temperature, humidity)
        daily_data[date]['heat_index_entries'].append(heat_index)

    # get peak and low each hour
    hourly_temps_by_day = group_daily_data_by_hour(data)
    for date, hourly_temps in hourly_temps_by_day.items():
        daily_data[date]['hourly_peak_temp'] = {hour: max(temps) for hour, temps in hourly_temps.items()}
        daily_data[date]['hourly_low_temp'] = {hour: min(temps) for hour, temps in hourly_temps.items()}
        daily_data[date]['hourly_temp_slope'] = calculate_slope(hourly_temps)

        # Calculate hourly average temperatures and round to 2 decimal places
        daily_data[date]['hourly_avg_temps'] = {hour: round(sum(temps) / len(temps), 2) if temps else 0 for hour, temps
                                                in hourly_temps.items()}

        # Create a new dictionary to store values based on slope direction
        daily_data[date]['representative_hourly_temp'] = {
            hour: daily_data[date]['hourly_peak_temp'][hour] if slope > 0 else (
                daily_data[date]['hourly_low_temp'][hour] if slope < 0 else np.median(temps)
            )
            for hour, slope, temps in zip(
                daily_data[date]['hourly_temp_slope'].keys(),
                daily_data[date]['hourly_temp_slope'].values(),
                hourly_temps.values()
            )
        }

    hourly_humid_by_day = group_daily_humidity_by_hour(data)
    for date, hourly_humid in hourly_humid_by_day.items():
        daily_data[date]['hourly_peak_humid'] = {hour: max(humid) for hour, humid in hourly_humid.items()}
        daily_data[date]['hourly_low_humid'] = {hour: min(humid) for hour, humid in hourly_humid.items()}
        daily_data[date]['hourly_humid_slope'] = calculate_slope(hourly_humid)

        # Calculate hourly average temperatures and round to 2 decimal places
        daily_data[date]['hourly_avg_humid'] = {hour: round(sum(humid) / len(humid), 2) if humid else 0 for hour, humid
                                                in hourly_humid.items()}

        # Create a new dictionary to store values based on slope direction
        daily_data[date]['representative_hourly_humid'] = {
            hour: daily_data[date]['hourly_peak_humid'][hour] if slope > 0 else (
                daily_data[date]['hourly_low_humid'][hour] if slope < 0 else np.median(humid)
            )
            for hour, slope, humid in zip(
                daily_data[date]['hourly_humid_slope'].keys(),
                daily_data[date]['hourly_humid_slope'].values(),
                hourly_humid.values()
            )
        }


    return daily_data

def calculate_slope(hourly_data):
    slopes = {}

    for hour, data in hourly_data.items():
        if len(data) >= 2:
            # Calculate slope for each hour
            slope = (data[-1] - data[0]) / len(data)
            slopes[hour] = slope

    return slopes

def calculate_representative_values(hourly_temps, hourly_peak_temp, hourly_low_temp, hourly_median_temps):
    representative_values = {}

    for hour, slope in hourly_temps.items():
        if slope > 0:
            representative_values[hour] = hourly_peak_temp[hour]
        elif slope < 0:
            representative_values[hour] = hourly_low_temp[hour]
        else:
            representative_values[hour] = hourly_median_temps[hour]

    return representative_values

def get_temperature_values_peak_low(data):
    """
    dapatkan nilai peak dan low dari semua hari dan dijadikan satu

    :param data: daily_data dictionary
    :return: nilai peak dan low dari semua hari
             [(high, low), (high, low), .....]
    """
    temperature_values_peak_low = []
    for date, day_data in data.items():
        if day_data['is_valid']:
            temperature_values_peak_low.append((day_data['peak_temp'], day_data['lowest_temp']))

    return temperature_values_peak_low


def store_daily_data_summaries(daily_data):
    """
    assign data dari daily_data[] untuk nantinya disimpan dalam bentuk file

    :param daily_data: kelompok data daily yang berisi peak temp, lowest temp, data count etc
    :return: data daily yang sudah disusun dan siap dimasukan ke dalam file baru
            {'date': ..., 'peak_temp': ..., ..... entries{ ... } }
    """
    daily_data_list = []
    temperature_values_peak_low = []

    # Process daily data
    for date, day_data in daily_data.items():
        peak_temp = day_data['peak_temp']
        lowest_temp = day_data['lowest_temp']
        peak_time = day_data['peak_time']
        lowest_time = day_data['lowest_time']
        data_point_count = day_data['data_point_count']

        if day_data['is_valid']:
            temperature_values_peak_low.append((day_data['peak_temp'], day_data['lowest_temp']))
            if len(temperature_values_peak_low) > 1:
                daily_correlation_peak_low = np.corrcoef(*zip(*temperature_values_peak_low))[0, 1]
            else:
                daily_correlation_peak_low = None
        else:
            daily_correlation_peak_low = None

        daily_data_list.append({
            'date': date,
            'peak_temp': {
                'value': peak_temp,
                'time': peak_time
            },
            'lowest_temp': {
                'value': lowest_temp,
                'time': lowest_time,
            },
            'total': {
                'temp': day_data['total_temp'],
                'humidity': day_data['total_humidity'],
            },
            'avg': {
                'temperature': day_data['total_temp'] / data_point_count,
                'humidity': day_data['total_humidity'] / data_point_count,
            },
            'data_point_count': data_point_count,
            'daily_correlation_peak_low': daily_correlation_peak_low,
            'is_valid': day_data['is_valid'],
            'entries': {
                'temp': day_data['temp_entries'],
                'humid': day_data['humid_entries'],
                'heat_index': day_data['heat_index_entries'],
                'time': day_data['time_entries'],
            },
            'hourly_temp': day_data['representative_hourly_temp'],
            'hourly_humid': day_data['representative_hourly_humid'],
        })
    return daily_data_list


def store_overall_data(data, daily_data, overall_avg_temps_each_hour):
    overall_peak_temp = float('-inf')
    overall_low_temp = float('inf')
    max_temp_time = None
    low_temp_time = None
    max_temp_date = None
    low_temp_date = None

    for entry_index, entry in tqdm(enumerate(data['data']), desc='Processing Data', total=len(data['data'])):
        timestamp = entry['time']

        dt_local = get_local_datetime(timestamp)
        date = format_date(dt_local)

        # search for overall peak/low temp
        if daily_data[date]['peak_temp'] > overall_peak_temp:
            overall_peak_temp = daily_data[date]['peak_temp']
            max_temp_date = format_date(dt_local)
            max_temp_time = format_time(dt_local)

        if daily_data[date]['lowest_temp'] < overall_low_temp:
            overall_low_temp = daily_data[date]['lowest_temp']
            low_temp_date = format_date(dt_local)
            low_temp_time = format_time(dt_local)

    total_valid_data_points = 0
    total_valid_days = 0
    overall_total_valid_temp = 0
    overall_total_valid_humidity = 0
    daily_peak_temp_entries = []
    daily_low_temp_entries = []

    # Process daily data
    for date, day_data in daily_data.items():
        peak_temp = day_data['peak_temp']
        lowest_temp = day_data['lowest_temp']
        data_point_count = day_data['data_point_count']
        is_valid = data_point_count >= DATA_THRESHOLD
        total_valid_data_points += data_point_count if is_valid else 0
        total_valid_days += 1 if is_valid else 0

        daily_peak_temp_entries.append(peak_temp)
        daily_low_temp_entries.append(lowest_temp)

        if is_valid:
            overall_total_valid_temp += day_data['total_temp']
            overall_total_valid_humidity += day_data['total_humidity']

    total_recorded_days = len(daily_data)
    output_overall_data = {}
    output_overall_data.update({
        'total_valid_data_points': total_valid_data_points,

        'overall_peak_temperature': {'value': overall_peak_temp, 'date': max_temp_date, 'time': max_temp_time},
        'overall_low_temperature': {'value': overall_low_temp, 'date': low_temp_date, 'time': low_temp_time},

        'overall_avg_temp': overall_total_valid_temp / max(total_valid_data_points, 1),
        'overall_avg_humidity': overall_total_valid_humidity / max(total_valid_data_points, 1),

        'total_recorded_days': total_recorded_days,
        'total_valid_days': total_valid_days,
        'overall_total_valid_temp': overall_total_valid_temp,
        'overall_total_valid_humidity': overall_total_valid_humidity,

        'daily_peak_temp_entries': daily_peak_temp_entries,
        'daily_low_temp_entries': daily_low_temp_entries,
        'overall_hourly_average': overall_avg_temps_each_hour,
    })

    temperature_values_peak_low = get_temperature_values_peak_low(daily_data)
    correlation_peak_low = np.corrcoef(*zip(*temperature_values_peak_low))[0, 1]

    output_overall_data['correlation_peak_low_temperature'] = correlation_peak_low

    return output_overall_data


def process_overall_avg_temps_each_hour(hourly_temps_data):
    """
    hitung rata-rata temperature dari semua data untuk setiap jamnya

    :param hourly_temps_data: hasil return dari group_daily_temps_by_hour(data) dengan format seperti berikut
            {'YYYY-MM-DD': { 0: [t1, t2, ...], 1: [t1, t2,...], ...}
            'YYYY-MM-DD': { 0: [t1, t2, ...], 1: [t1, t2,...], ...}
            ....}
    :return: {'0': average, '1': average, ... '23': average }
    """
    overall_avg_temps_by_hour = defaultdict(float)
    valid_hour_count = defaultdict(int)

    for day, day_data in hourly_temps_data.items():  # { 'YYYY-MM-DD': { 0: [t, ...]
        for hour in range(24):  # iterate each hour
            temp_entries = day_data[hour]  # [t, t, ...]
            data_count = len(temp_entries)
            is_valid = data_count == 12  # count of data point each hour (once per 5 minutes)

            if is_valid:
                avg_temps_per_hour = sum(temp_entries) / max(data_count, 1)  # average for each hour (12 entries)
                overall_avg_temps_by_hour[hour] += avg_temps_per_hour  # accumulate average result
                valid_hour_count[hour] += 1  # accumulate each valid hour

    # Calculate the average for each hour across all days
    for hour in overall_avg_temps_by_hour:
        overall_avg_temps_by_hour[hour] /= max(valid_hour_count[hour], 1)

    # Sort overall_avg_temps_by_hour
    return dict(sorted(overall_avg_temps_by_hour.items()))


def plot_overall_hourly_average(hourly_avg_data):
    """
    plot rata-rata temperatur perjam secara keseluruhan

    :param hourly_avg_data: list nilai rata-rata {"0": avg, "1": avg, ....}
    :return: A line plot of the average temperature for each hour across all days
    """
    hours = list(hourly_avg_data.keys())
    avg_temps = list(hourly_avg_data.values())

    plt.plot(hours, avg_temps, marker='o')
    plt.xlabel('Hour')
    plt.ylabel('Average Temperature')
    plt.title('Average Temperature for Each Hour Across Days')
    plt.grid(True)

    plt.xticks(range(24))

    plt.show()


def main(input_file, output_file_daily, output_file_calculated):
    # Read data from JSON
    with open(input_file, 'r') as file:
        data = json.load(file)

    daily_data = calculate_daily_data_summaries(data)
    grouped_daily_temps_by_hour = group_daily_data_by_hour(data)

    daily_data_list = store_daily_data_summaries(daily_data)

    overall_avg_temps_each_hour = process_overall_avg_temps_each_hour(grouped_daily_temps_by_hour)
    output_overall_data = store_overall_data(data, daily_data, overall_avg_temps_each_hour)

    save_json(daily_data_list, output_file_daily)
    save_json(output_overall_data, output_file_calculated)

    print(f"Process successful. Results saved to '{output_file_daily}'.")
    print(f"Process successful. Results saved to '{output_file_calculated}'.")

    # plot_overall_hourly_average(overall_avg_temps_each_hour)


if __name__ == "__main__":
    # Set input and output file names
    input_file_path = ".\\01 data-real.json"
    output_file_main_path = ".\\02a data-daily-calculated.json"
    output_file_calculated_path = ".\\02b data-overall-calculated.json"

    # Process data and save the results in separate files
    main(input_file_path, output_file_main_path, output_file_calculated_path)
