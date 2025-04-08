import os
import sqlite3
from datetime import datetime
import uuid

# Connect to the database
db_path = os.path.join('instance', 'patient_service.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get current timestamp for default values
current_time = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')

# Create a test admin user
try:
    print("Adding test admin user...")
    user_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO users (id, username, password, firstName, lastName, email, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        'admin',
        'password123',  # In a real app, this would be hashed
        'Admin',
        'User',
        'admin@example.com',
        'ADMIN',
        current_time,
        current_time
    ))
    print(f"Added admin user with ID: {user_id}")
    print("Login credentials:")
    print("Username: admin")
    print("Password: password123")
    
    # Create a test doctor user
    user_id = str(uuid.uuid4())
    cursor.execute('''
        INSERT INTO users (id, username, password, firstName, lastName, email, role, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        'doctor',
        'password123',  # In a real app, this would be hashed
        'John',
        'Smith',
        'doctor@example.com',
        'DOCTOR',
        current_time,
        current_time
    ))
    print(f"Added doctor user with ID: {user_id}")
    print("Login credentials:")
    print("Username: doctor")
    print("Password: password123")
    
except sqlite3.Error as e:
    print(f"Error adding test users: {e}")

# Commit changes and close connection
conn.commit()
conn.close()

print("Test users added successfully.")
