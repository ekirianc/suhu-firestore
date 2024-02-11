import json
from google.cloud import firestore

# Set the path to your service account key JSON file
service_account_key_path = r"D:\Code\Temperature data\credentials.json"

# Initialize Firestore client
db = firestore.Client.from_service_account_json(service_account_key_path)

# Path to the Firestore document
doc_path = "overall/daily"

# Read JSON data from file
with open(".\\02c data-daily_list.json", "r") as json_file:
    data = json.load(json_file)

# Upload data to Firestore
doc_ref = db.document(doc_path)
doc_ref.set(data)

print("Data uploaded to Firestore successfully.")
