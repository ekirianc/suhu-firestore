import subprocess

# List of Python scripts to run in sequence
script_list = [
    '01 change-json.py',
    '02 daily-calculation.py',
    'delete-data.py',
    'upload-data-daily.py'
]

# Run each script in sequence
for script in script_list:
    subprocess.run(['python', script])
