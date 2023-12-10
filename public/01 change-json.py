import json

# Specify the input and output file paths
input_file_path = r"D:\Code\web\suhu-v2\public\00 readings-export.json"
output_file_path = r"D:\Code\web\suhu-v2\public\01 data-real.json"

# Read input JSON from file
with open(input_file_path, 'r') as file:
    input_json = file.read()

# Load the input JSON
data = json.loads(input_json)

# Convert the structure
output_data = {
    "statusCode": 200,
    "message": "Last data fetched successfully",
    "data": [
        {"time": int(entry["timestamp"]), "temp": float(entry["temperature"]), "humid": float(entry["humidity"])}
        for entry in data.values()
    ]
}

# Convert to JSON
output_json = json.dumps(output_data, indent=2)

# Save the output to the specified file path
with open(output_file_path, 'w') as output_file:
    output_file.write(output_json)

print(f"Output saved to '{output_file_path}'")
