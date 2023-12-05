from google.cloud import firestore
import requests

# Setelah menginstal 'google-cloud-firestore', Anda perlu mengatur credential
# dari Google Cloud Console dan menentukan PATH ke file JSON credential di bawah.
# Dalam contoh ini, diasumsikan bahwa credential file disimpan dalam folder 'credentials'.
# Ganti 'path/to/your/credentials.json' dengan PATH sesuai kebutuhan Anda.

# Set PATH ke file JSON credential
credentials_path = r"D:\Code\Temperature data\credentials.json"

# Inisialisasi Firestore client
db = firestore.Client.from_service_account_json(credentials_path)

# URL API Anda
api_url = 'http://localhost:3000/api/temperature/test-query?timeRange=3days'

try:
    # Mengambil data dari API
    response = requests.get(api_url)
    response.raise_for_status()

    # Mendapatkan JSON dari respons
    json_data = response.json()

    # Mendapatkan 100 data terakhir dari array 'data'
    last_100_data = json_data['data'][-100:]

    # Menambahkan data ke Firestore
    for data in last_100_data:
        doc_ref = db.collection('temperature').add({
            'time': data['time'],
            'temp': str(data['temp']),
            'humid': str(data['humid'])
        })
        print(f'Data added with ID: {doc_ref[1].id}')  # Mengakses ID dari elemen pertama tuple

except requests.exceptions.RequestException as err:
    print(f"Error fetching data: {err}")