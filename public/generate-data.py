import json
import math
import random
from datetime import datetime, timedelta

def generate_shifted_data(start_time, end_time, interval_minutes, smoothing_factor):
    data = []
    current_time = start_time

    while current_time <= end_time:
        timestamp = int(current_time.timestamp())
        time_in_hours = current_time.hour + current_time.minute / 60

        # Fungsi sinusoidal dengan frekuensi dan amplitudo yang bervariasi
        frequency = random.uniform(0.9, 1.1)
        amplitude_temp = random.uniform(2.5, 4.5)
        amplitude_humid = random.uniform(10, 30)

        # Geser puncak ke pukul 1:00 PM
        phase_shift = -math.pi / 2  # 90 derajat

        temperature = max(27, amplitude_temp * math.sin(frequency * ((time_in_hours - 13) % 24) / 24 * 2 * math.pi + phase_shift) + 31.5)

        # Kelembapan dikaitkan dengan suhu secara berlawanan
        humidity = round(100 - amplitude_humid * math.sin(frequency * ((time_in_hours - 13) % 24) / 24 * 2 * math.pi + phase_shift), 2)

        data_point = {
            "time": timestamp,
            "temp": "{:.2f}".format(temperature),
            "humid": "{:.2f}".format(humidity)
        }

        data.append(data_point)
        current_time += timedelta(minutes=interval_minutes)

    # Proses smoothing menggunakan moving average
    smoothed_data = []
    for i in range(len(data)):
        temp_sum = 0
        humid_sum = 0
        count = 0

        for j in range(max(0, i - smoothing_factor), min(len(data), i + smoothing_factor + 1)):
            temp_sum += float(data[j]["temp"])
            humid_sum += float(data[j]["humid"])
            count += 1

        temp_avg = temp_sum / count
        humid_avg = humid_sum / count

        smoothed_data.append({
            "time": data[i]["time"],
            "temp": "{:.2f}".format(temp_avg),
            "humid": "{:.2f}".format(humid_avg)
        })

    return smoothed_data

def main():
    end_time = datetime.now()
    start_time = end_time - timedelta(days=7)
    interval_minutes = 5
    smoothing_factor = 4  # Anda dapat menyesuaikan faktor smoothing di sini

    data = generate_shifted_data(start_time, end_time, interval_minutes, smoothing_factor)

    result = {
        "statusCode": 200,
        "message": "Last data fetched successfully",
        "data": data
    }

    output_file_path = r"D:\Code\web\suhu-v2\public\data-generated.json"

    with open(output_file_path, 'w') as output_file:
        json.dump(result, output_file, indent=2)

    print(f"Data has been generated and saved to {output_file_path}")

if __name__ == "__main__":
    main()
