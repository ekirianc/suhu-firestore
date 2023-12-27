import json
import requests
import os
from dotenv import load_dotenv
from tqdm import tqdm

# Load environment variables from .env file
load_dotenv()

# Access the Firebase URL
firebase_url = os.getenv("FIREBASE_URL")

# Mendapatkan data dari URL Firebase dengan tambahan bar progres
response = requests.get(firebase_url, stream=True)
total_size = int(response.headers.get('content-length', 0))
block_size = 1024  # 1 Kibibyte

# Inisialisasi bar progres
progress_bar = tqdm(total=total_size, unit='iB', unit_scale=True)

# Membaca data dari respons dengan bar progres
data = b""
for data_block in response.iter_content(block_size):
    progress_bar.update(len(data_block))
    data += data_block

# Tutup bar progres setelah pemrosesan selesai
progress_bar.close()

# Convert the structure
output_data = {
    "statusCode": 200,
    "message": "Last data fetched successfully",
    "data": [
        {"time": int(entry["timestamp"]), "temp": float(entry["temperature"]), "humid": float(entry["humidity"])}
        for entry in json.loads(data).values()
    ]
}

# Convert to JSON
output_json = json.dumps(output_data, indent=2)

# Save the output to the specified file path
output_file_path = ".\\01 data-real.json"
with open(output_file_path, 'w') as output_file:
    output_file.write(output_json)

print(f"Output saved to '{output_file_path}'")
