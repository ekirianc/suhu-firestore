from collections import defaultdict
from datetime import datetime

import numpy as np
import pytz

# Heat index (Fischer and Schär 2010)
C = [-8.7847, 1.6114, -0.012308, 2.3385, -0.14612, 2.2117e-3, -0.016425, 7.2546e-4, -3.582e-6]
TIMEZONE = 'Asia/Singapore'


def get_heat_index(temperature, humidity):
    tc = temperature
    h = humidity

    heat_index_celcius = (C[0] + C[1] * tc + C[2] * tc ** 2 +
                          h * (C[3] + C[4] * tc + C[5] * tc ** 2) +
                          h ** 2 * (C[6] + C[7] * tc + C[8] * tc ** 2))

    return round(heat_index_celcius, 2)


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


def calculate_slope(hourly_data):
    slopes = {}

    for hour, data in hourly_data.items():
        if len(data) >= 2:
            # Calculate slope for each hour
            slope = (data[-1] - data[0]) / len(data)
            slopes[hour] = slope

    return slopes


def get_temperature_values_highest_low(data):
    """
    dapatkan nilai peak dan low dari semua hari dan dijadikan satu

    :param data: daily_data dictionary
    :return: nilai peak dan low dari semua hari
             [(high, low), (high, low), .....]
    """
    temperature_values_peak_low = []
    for date, day_data in data.items():
        if day_data['is_valid']:
            temperature_values_peak_low.append((day_data['highest_temp'], day_data['lowest_temp']))

    return temperature_values_peak_low


def calculate_hourly_temp_differences(day_data_list, overall_avg_temps_each_hour):
    hourly_temp_differences = {}

    for day_data in day_data_list:
        hourly_temps = day_data.get('representative_hourly_temp', {})

        for hour, temp in hourly_temps.items():
            if hour not in hourly_temp_differences:
                hourly_temp_differences[hour] = temp - overall_avg_temps_each_hour.get(hour, 0)
            else:
                hourly_temp_differences[hour] += temp - overall_avg_temps_each_hour.get(hour, 0)

    return hourly_temp_differences



def calculate_overall_avg_temps_each_hour(grouped_temp_by_hour):
    """
    hitung rata-rata temperature dari semua data untuk setiap jamnya

    @param grouped_temp_by_hour: hasil return dari group_temp_by_hour(data) dengan format seperti berikut
            {'YYYY-MM-DD': { 0: [t1, t2, ...], 1: [t1, t2,...], ...}
            'YYYY-MM-DD': { 0: [t1, t2, ...], 1: [t1, t2,...], ...}
            ....}
    @return: {'0': average, '1': average, ... '23': average }
    """
    overall_avg_temps_by_hour = defaultdict(float)
    valid_hour_count = defaultdict(int)

    for day, day_data in grouped_temp_by_hour.items():  # { 'YYYY-MM-DD': { 0: [t, ...]
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

    # make sure it start at hour 0. sort it
    return dict(sorted(overall_avg_temps_by_hour.items()))


def calculate_overall_avg_representative_temps(grouped_temp_by_hour):
    """
    Hitung rata-rata representative hourly temperature dari semua data untuk setiap jamnya.

    @param grouped_temp_by_hour: hasil return dari group_temp_by_hour(data) dengan format seperti berikut
            {'YYYY-MM-DD': { 0: [t1, t2, ...], 1: [t1, t2,...], ...}
            'YYYY-MM-DD': { 0: [t1, t2, ...], 1: [t1, t2,...], ...}
            ....}
    @return: {'0': average, '1': average, ... '23': average }
    """
    overall_avg_representative_temps_by_hour = defaultdict(float)
    valid_hour_count = defaultdict(int)

    for date, hourly_temps in grouped_temp_by_hour.items():
        # Calculate hourly temperature slope
        hourly_temp_slope = calculate_slope(hourly_temps)

        for hour, slope, temps in zip(hourly_temp_slope.keys(), hourly_temp_slope.values(), hourly_temps.values()):
            # Calculate representative hourly temperature
            representative_temp = (
                max(temps) if slope > 0 else
                min(temps) if slope < 0 else
                np.median(temps) if temps else 0
            )

            # Accumulate representative hourly temperature and valid hour count
            overall_avg_representative_temps_by_hour[hour] += representative_temp
            valid_hour_count[hour] += 1

    # Calculate the overall average for each representative hourly temperature across all dates
    for hour in overall_avg_representative_temps_by_hour:
        overall_avg_representative_temps_by_hour[hour] /= max(valid_hour_count[hour], 1)

    # Sort and return the result
    return dict(sorted(overall_avg_representative_temps_by_hour.items()))