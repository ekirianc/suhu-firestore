import json
from datetime import timedelta
from collections import defaultdict
import numpy as np
import Utils
from matplotlib import pyplot as plt
from tqdm import tqdm


# minimum amount of daily data to execute calculation process
DATA_THRESHOLD = 230


def group_temp_by_hour(data):
    """
    group temp entry by hour for each day

    @param data: data dari file json
                {"data": [ { "time": 1685711810, "temp": 31.6, "humid": 80.0 },  {...}, ....  ]}
    @return: dictionary dengan struktur seperti berikut:
            { 'YYYY-MM-DD': {
                0: [t1, t2, ...], # list of temperatures for hour 0 (midnight)
                1: [t1, t2, ...], # list of temperatures for hour 1 (one am)
    """
    temp_grouped_by_hour = defaultdict(lambda: defaultdict(list))
    for entry_index, entry in tqdm(enumerate(data['data']), desc='Processing Data', total=len(data['data'])):
        temperature = entry['temp']
        timestamp = entry['time']

        dt_local = Utils.get_local_datetime(timestamp)
        date = dt_local.strftime('%Y-%m-%d')
        hour = dt_local.hour

        temp_grouped_by_hour[date][hour].append(temperature)
    return temp_grouped_by_hour


def group_humid_by_hour(data):
    humid_grouped_by_hour = defaultdict(lambda: defaultdict(list))

    for entry_index, entry in tqdm(enumerate(data['data']), desc='Processing Data', total=len(data['data'])):
        humidity = entry['humid']
        timestamp = entry['time']

        dt_local = Utils.get_local_datetime(timestamp)
        date = dt_local.strftime('%Y-%m-%d')
        hour = dt_local.hour

        humid_grouped_by_hour[date][hour].append(humidity)

    return humid_grouped_by_hour


def calculate_daily_data(data):
    """
    json file to daily_data dictionary

    @param data: json file
    @return: daily_data dictionary
    """
    # Create a dictionary
    daily_data = defaultdict(lambda: {
        'highest_temp': float('-inf'),
        'lowest_temp': float('inf'),
        'highest_time': "",
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

        'hourly_highest_temp': {},
        'hourly_low_temp': {},

        'temp_std_dev': {},
        'humid_std_dev': {},
    })

    # iterate each json entry
    for entry_index, entry in tqdm(enumerate(data['data']), desc='Processing Data', total=len(data['data'])):
        timestamp = entry['time']
        temperature = entry['temp']
        humidity = entry['humid']

        dt_local = Utils.get_local_datetime(timestamp)
        date = Utils.format_date(dt_local)

        # bulatkan waktu ke 5 menit terdekat
        rounded_time = int(5 * round(float(dt_local.minute) / 5))
        rounded_dt_local = dt_local.replace(minute=0, second=0, microsecond=0) + timedelta(minutes=rounded_time)

        # store daily data entries
        if rounded_dt_local.hour != 0 or rounded_dt_local.minute != 0:
            daily_data[date]['time_entries'].append(Utils.format_time(rounded_dt_local))
            daily_data[date]['temp_entries'].append(temperature)
            daily_data[date]['humid_entries'].append(humidity)

        # daily peak/low temp
        if temperature > daily_data[date]['highest_temp']:
            daily_data[date]['highest_temp'] = temperature
            daily_data[date]['highest_time'] = Utils.format_time(dt_local)
        if temperature < daily_data[date]['lowest_temp']:
            daily_data[date]['lowest_temp'] = temperature
            daily_data[date]['lowest_time'] = Utils.format_time(dt_local)

        # is valid
        daily_data[date]['data_point_count'] += 1
        daily_data[date]['is_valid'] = daily_data[date]['data_point_count'] >= DATA_THRESHOLD

        # sum of daily temp and humid
        daily_data[date]['total_temp'] += temperature
        daily_data[date]['total_humidity'] += humidity

        # heat index
        heat_index = Utils.get_heat_index(temperature, humidity)
        daily_data[date]['heat_index_entries'].append(heat_index)

        # standard deviation and high low correlation
        if daily_data[date]['is_valid']:
            daily_data[date]['temp_std_dev'] = np.std(daily_data[date]['temp_entries'])
            daily_data[date]['humid_std_dev'] = np.std(daily_data[date]['humid_entries'])
        else:
            daily_data[date]['temp_std_dev'] = None
            daily_data[date]['humid_std_dev'] = None

    grouped_temp_by_hour = group_temp_by_hour(data)
    for date, hourly_temps in grouped_temp_by_hour.items():
        # get peak and low each hour
        daily_data[date]['hourly_highest_temp'] = {hour: max(temps) for hour, temps in hourly_temps.items()}
        daily_data[date]['hourly_low_temp'] = {hour: min(temps) for hour, temps in hourly_temps.items()}

        # hourly average temperatures
        daily_data[date]['hourly_avg_temps'] = {hour: round(sum(temps) / len(temps), 2) if temps else 0 for hour, temps
                                                in hourly_temps.items()}

        # hourly temp
        daily_data[date]['hourly_temp_slope'] = Utils.calculate_slope(hourly_temps)
        daily_data[date]['representative_hourly_temp'] = {
            hour: daily_data[date]['hourly_highest_temp'][hour] if slope > 0 else (
                daily_data[date]['hourly_low_temp'][hour] if slope < 0 else np.median(temps)
            )
            for hour, slope, temps in zip(
                daily_data[date]['hourly_temp_slope'].keys(),
                daily_data[date]['hourly_temp_slope'].values(),
                hourly_temps.values()
            )
        }

    grouped_humid_by_hour = group_humid_by_hour(data)
    for date, hourly_humid in grouped_humid_by_hour.items():
        # get peak and low each hour
        daily_data[date]['hourly_peak_humid'] = {hour: max(humid) for hour, humid in hourly_humid.items()}
        daily_data[date]['hourly_low_humid'] = {hour: min(humid) for hour, humid in hourly_humid.items()}

        # hourly average humid
        daily_data[date]['hourly_avg_humid'] = {hour: round(sum(humid) / len(humid), 2) if humid else 0 for hour, humid
                                                in hourly_humid.items()}

        # hourly humid
        daily_data[date]['hourly_humid_slope'] = Utils.calculate_slope(hourly_humid)
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


def store_daily_data(daily_data, grouped_temp_by_hour):
    """
    make a data array to be inserted into a json file

    @param daily_data: daily_data dictionary
    @param grouped_temp_by_hour: temperature yang telah dikelompokan per-jam
    @return: {'date': ..., 'highest_temp': ..., ..... entries{ ... } }
    """
    today_data = []
    high_low_temperature_values = []

    for date, day_data in daily_data.items():
        overall_avg_temps_each_hour = Utils.calculate_overall_avg_temps_each_hour(grouped_temp_by_hour)
        hourly_temp_differences = Utils.calculate_hourly_temp_differences([day_data], overall_avg_temps_each_hour)

        highest_temp = day_data['highest_temp']
        lowest_temp = day_data['lowest_temp']
        highest_time = day_data['highest_time']
        lowest_time = day_data['lowest_time']
        data_point_count = day_data['data_point_count']

        if day_data['is_valid']:
            hourly_temp_diff_sum = 0

            # sum temperature difference
            for hour, temp_difference in hourly_temp_differences.items():
                hourly_temp_diff_sum += temp_difference

            # highest low correlation # accumulated for each day
            high_low_temperature_values.append((day_data['highest_temp'], day_data['lowest_temp']))
            if len(high_low_temperature_values) > 1:
                high_low_daily_correlation = np.corrcoef(*zip(*high_low_temperature_values))[0, 1]
            else:
                high_low_daily_correlation = None
        else:
            high_low_daily_correlation = None
            hourly_temp_diff_sum = None

        today_data.append({
            'today_date': date,
            'today_highest_temp': {
                'value': highest_temp,
                'time': highest_time
            },
            'today_lowest_temp': {
                'value': lowest_temp,
                'time': lowest_time,
            },
            'today_total': {
                'temp': day_data['total_temp'],
                'humid': day_data['total_humidity'],
            },
            'today_average': {
                'temp': day_data['total_temp'] / data_point_count,
                'humid': day_data['total_humidity'] / data_point_count,
            },
            'today_data_point_count': data_point_count,
            'today_is_valid': day_data['is_valid'],
            'today_statistics': {
                'correlation_peak_low': high_low_daily_correlation,
                'temp_deviation': day_data['temp_std_dev'],
                'humid_deviation': day_data['humid_std_dev'],
                'temp_diff_sum': hourly_temp_diff_sum
            },
            'today_entries': {
                'temp': day_data['temp_entries'],
                'humid': day_data['humid_entries'],
                'heat_index': day_data['heat_index_entries'],
                'time': day_data['time_entries'],
            },
            'today_hourly': {
                'temp': day_data['representative_hourly_temp'],
                'humid': day_data['representative_hourly_humid'],
                'temp_diff': hourly_temp_differences,
                'average': day_data['hourly_avg_temps']
            }
        })
    return today_data


def store_overall_data(data, daily_data, overall_avg_temps_each_hour, overall_avg_temps_each_hour_by_slope):
    overall_highest_temp = float('-inf')
    overall_low_temp = float('inf')
    max_temp_datetime = None
    low_temp_datetime = None

    for entry_index, entry in tqdm(enumerate(data['data']), desc='Processing Data', total=len(data['data'])):
        timestamp = entry['time']

        dt_local = Utils.get_local_datetime(timestamp)
        date = Utils.format_date(dt_local)

        # overall peak/low temp
        if daily_data[date]['highest_temp'] > overall_highest_temp:
            overall_highest_temp = daily_data[date]['highest_temp']
            max_temp_datetime = dt_local.isoformat()
        if daily_data[date]['lowest_temp'] < overall_low_temp:
            overall_low_temp = daily_data[date]['lowest_temp']
            low_temp_datetime = dt_local.isoformat()

    total_valid_data_points = 0
    total_valid_days = 0
    overall_total_valid_temp = 0
    overall_total_valid_humidity = 0
    daily_highest_temp_entries = []
    daily_low_temp_entries = []
    total_recorded_days = len(daily_data)

    for date, day_data in daily_data.items():
        highest_temp = day_data['highest_temp']
        lowest_temp = day_data['lowest_temp']
        data_point_count = day_data['data_point_count']
        is_valid = data_point_count >= DATA_THRESHOLD
        total_valid_data_points += data_point_count if is_valid else 0
        total_valid_days += 1 if is_valid else 0

        # accumulate entries
        daily_highest_temp_entries.append(highest_temp)
        daily_low_temp_entries.append(lowest_temp)

        if is_valid:
            overall_total_valid_temp += day_data['total_temp']
            overall_total_valid_humidity += day_data['total_humidity']

    output_overall_data = {}
    output_overall_data.update({
        'total_valid_data_points': total_valid_data_points,

        'highest_temp_record': {'value': overall_highest_temp, 'datetime': max_temp_datetime},
        'low_temp_record': {'value': overall_low_temp, 'datetime': low_temp_datetime},

        'overall_average': {
            'temp': overall_total_valid_temp / max(total_valid_data_points, 1),
            'humidity': overall_total_valid_humidity / max(total_valid_data_points, 1),
        },

        'total_recorded_days': total_recorded_days,
        'total_valid_days': total_valid_days,
        'sum_valid_temp': overall_total_valid_temp,
        'sum_valid_humid': overall_total_valid_humidity,

        'overall_hourly_average': {
            'by_entries': overall_avg_temps_each_hour,
            'by_slope': overall_avg_temps_each_hour_by_slope,
        }
    })

    # overall correlation high low temperature
    temperature_values_highest_low = Utils.get_temperature_values_highest_low(daily_data)
    correlation_highest_low = np.corrcoef(*zip(*temperature_values_highest_low))[0, 1]
    output_overall_data['correlation_high_low_temp'] = correlation_highest_low

    return output_overall_data


def store_daily_data_list(daily_data, overall_avg_temps_each_hour):
    output_daily_data_list = {}
    high_low_temperature_values = []

    for date, day_data in daily_data.items():
        hourly_temp_differences = Utils.calculate_hourly_temp_differences([day_data], overall_avg_temps_each_hour)

        if day_data['is_valid']:
            hourly_temp_diff_sum = 0

            # sum temperature difference
            for hour, temp_difference in hourly_temp_differences.items():
                hourly_temp_diff_sum += temp_difference

            # highest low correlation # accumulated for each day
            high_low_temperature_values.append((day_data['highest_temp'], day_data['lowest_temp']))
            if len(high_low_temperature_values) > 1:
                high_low_daily_correlation = np.corrcoef(*zip(*high_low_temperature_values))[0, 1]
            else:
                high_low_daily_correlation = None
        else:
            high_low_daily_correlation = None
            hourly_temp_diff_sum = None

        output_daily_data_list[date] = {
            'is_valid': day_data['is_valid'],
            'today_total_data': day_data['data_point_count'],
            'highest_temp': day_data['highest_temp'],
            'lowest_temp': day_data['lowest_temp'],
            'correlation_high_low': high_low_daily_correlation,
            'deviation': {
                'temp': day_data['temp_std_dev'],
                'humid': day_data['humid_std_dev']
            },
            'sum': {
                'temp_diff_sum': hourly_temp_diff_sum,
                'temp_sum': sum(day_data['temp_entries']),
                'humid_sum': sum(day_data['humid_entries'])
            },
            'average': {
                'temp': day_data['total_temp'] / day_data['data_point_count'],
                'humid': day_data['total_humidity'] / day_data['data_point_count'],
            },

        }

    return output_daily_data_list


def plot_overall_hourly_average(data1, data2):
    """
    plot rata-rata temperatur perjam secara keseluruhan

    :param data1: list nilai rata-rata {"0": avg, "1": avg, ....}
    :param data2: list nilai rata-rata {"0": avg, "1": avg, ....}
    :return: A line plot of the average temperature for each hour across all days
    """
    hours = list(data1.keys())
    avg_temps1 = list(data1.values())
    avg_temps2 = list(data2.values())

    plt.plot(hours, avg_temps1, marker='o', label='avg entry')
    plt.plot(hours, avg_temps2, marker='o', label='avg slope')

    plt.xlabel('Hour')
    plt.ylabel('Average Temperature')
    plt.title('Average Temperature for Each Hour Across Days')
    plt.grid(True)
    plt.legend()  # Add legend to differentiate between Data 1 and Data 2

    plt.xticks(range(24))

    plt.show()


def save_json(data, output_file):
    with open(output_file, 'w') as output:
        json.dump(data, output, indent=2)


def main(input_file, output_file_daily, output_file_calculated, output_file_daily_list):
    # Read data from JSON
    with open(input_file, 'r') as file:
        data = json.load(file)

    daily_data = calculate_daily_data(data)
    grouped_temp_by_hour = group_temp_by_hour(data)

    output_daily_data = store_daily_data(daily_data, grouped_temp_by_hour)

    overall_avg_temps_each_hour = Utils.calculate_overall_avg_temps_each_hour(grouped_temp_by_hour)
    overall_avg_temps_each_hour_by_slope = Utils.calculate_overall_avg_representative_temps(grouped_temp_by_hour)

    output_overall_data = store_overall_data(data, daily_data, overall_avg_temps_each_hour, overall_avg_temps_each_hour_by_slope)
    output_daily_data_list = store_daily_data_list(daily_data, overall_avg_temps_each_hour)

    save_json(output_daily_data, output_file_daily)
    save_json(output_overall_data, output_file_calculated)
    save_json(output_daily_data_list, output_file_daily_list)

    print(f"Process successful. Results saved to '{output_file_daily}'.")
    print(f"Process successful. Results saved to '{output_file_calculated}'.")
    print(f"Process successful. Results saved to '{output_file_daily_list}'.")

    # plot_overall_hourly_average(overall_avg_temps_each_hour, overall_avg_temps_each_hour_by_slope)


if __name__ == "__main__":
    # Set input and output file names
    input_file_path = ".\\01 data-real.json"
    output_file_main_path = ".\\02a data-daily-calculated.json"
    output_file_calculated_path = ".\\02b data-overall-calculated.json"
    output_file_daily_list = ".\\02c data-daily_list.json"

    # Process data and save the results in separate files
    main(input_file_path, output_file_main_path, output_file_calculated_path, output_file_daily_list)
