import os
import sqlite3

# Connect to the database
db_path = os.path.join('instance', 'patient_service.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Add missing columns to patients table
try:
    print("Adding missing columns to patients table...")
    cursor.execute("ALTER TABLE patients ADD COLUMN createdAt DATETIME")
    cursor.execute("ALTER TABLE patients ADD COLUMN updatedAt DATETIME")
    cursor.execute("ALTER TABLE patients ADD COLUMN createdBy VARCHAR(36)")
    print("Columns added successfully!")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print(f"Column already exists: {e}")
    else:
        print(f"Error adding columns: {e}")

# Commit changes and close connection
conn.commit()
conn.close()

print("Database schema update completed.")
