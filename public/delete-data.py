import json
from google.cloud import firestore

def delete_all_data(credentials_path, collection_name):
    # Load Firestore credentials from JSON file
    with open(credentials_path, 'r') as file:
        credentials_dict = json.load(file)

    # Initialize Firestore client
    db = firestore.Client.from_service_account_info(credentials_dict)

    # Reference to the collection
    collection_ref = db.collection(collection_name)

    # Delete all documents in the collection
    docs = collection_ref.stream()
    for doc in docs:
        doc.reference.delete()
        print(f'Deleted document {doc.id}')

if __name__ == "__main__":
    credentials_path = r"D:\Code\Temperature data\credentials.json"
    collection_name = 'temperature'
    # collection_name = 'overall'

    delete_all_data(credentials_path, collection_name)
