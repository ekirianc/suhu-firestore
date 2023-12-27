import json
from google.cloud import firestore

# Set PATH ke file JSON credential
credentials_path = r"D:\Code\Temperature data\credentials.json"

# Inisialisasi Firestore client
db = firestore.Client.from_service_account_json(credentials_path)

# Replace 'path/to/your/data.json' with the actual path to your JSON file
json_file_path = '.\\02a data-daily-calculated.json'

# Load JSON data
with open(json_file_path, 'r') as file:
    data = json.load(file)

# Specify the number of entries to upload
num_entries_to_upload = 7

# Define Firestore collection and document ID
collection_name = 'temperature'

# Upload specified number of entries to Firestore
for entry in data[-num_entries_to_upload:]:
    date_value = entry['date']
    doc_ref = db.collection(collection_name).document(date_value)
    doc_ref.set(entry)
    print(f"Data uploaded to Firestore with document ID: {date_value}")

print(f"{num_entries_to_upload} entries uploaded to Firestore.")
