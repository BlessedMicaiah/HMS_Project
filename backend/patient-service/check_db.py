import os
import sqlite3

# Connect to the database
db_path = os.path.join('instance', 'patient_service.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get list of tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables in the database:")
for table in tables:
    print(f"- {table[0]}")

# For each table, show its schema
print("\nTable schemas:")
for table in tables:
    cursor.execute(f"PRAGMA table_info({table[0]})")
    columns = cursor.fetchall()
    print(f"\nSchema for {table[0]}:")
    for col in columns:
        print(f"  {col[1]} ({col[2]})")

# For each table, count the number of rows
print("\nRow counts:")
for table in tables:
    cursor.execute(f"SELECT COUNT(*) FROM {table[0]}")
    count = cursor.fetchone()[0]
    print(f"- {table[0]}: {count} rows")

# Close the connection
conn.close()
