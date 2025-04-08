import os
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

# Initialize Flask app
app = Flask(__name__)

# Configure database from environment variable (will use PostgreSQL on Render)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///patient_service.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Define User model (same as in app.py)
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(50), nullable=False, unique=True)
    password = db.Column(db.String(100), nullable=False)  # In a real app, this would be hashed
    firstName = db.Column(db.String(50), nullable=False)
    lastName = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), nullable=False, unique=True)
    role = db.Column(db.String(20), nullable=False)  # One of the ROLES keys
    createdAt = db.Column(db.DateTime, default=datetime.utcnow)
    updatedAt = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Initialize database and create test users
def init_db():
    with app.app_context():
        # Create all tables
        db.create_all()
        
        # Check if admin user already exists
        admin_exists = User.query.filter_by(username='admin').first() is not None
        
        if not admin_exists:
            print("Creating admin user...")
            admin_user = User(
                id=str(uuid.uuid4()),
                username='admin',
                password='password123',  # In a real app, this would be hashed
                firstName='Admin',
                lastName='User',
                email='admin@example.com',
                role='ADMIN'
            )
            db.session.add(admin_user)
            
            # Create a test doctor user
            doctor_user = User(
                id=str(uuid.uuid4()),
                username='doctor',
                password='password123',  # In a real app, this would be hashed
                firstName='John',
                lastName='Smith',
                email='doctor@example.com',
                role='DOCTOR'
            )
            db.session.add(doctor_user)
            
            # Commit the changes
            db.session.commit()
            print("Test users created successfully!")
        else:
            print("Admin user already exists, skipping user creation.")

if __name__ == '__main__':
    init_db()
