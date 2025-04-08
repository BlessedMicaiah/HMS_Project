import os
import sqlite3
from datetime import datetime

# Connect to the database
db_path = os.path.join('instance', 'patient_service.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get current timestamp for default values
current_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

# Update existing patient records with default values for new columns
try:
    print("Updating existing patient records...")
    cursor.execute(f"UPDATE patients SET createdAt = '{current_time}', updatedAt = '{current_time}', createdBy = 'system' WHERE createdAt IS NULL")
    print(f"Updated {cursor.rowcount} patient records with default values.")
except sqlite3.Error as e:
    print(f"Error updating patient records: {e}")

# Commit changes and close connection
conn.commit()
conn.close()

print("Patient records update completed.")
