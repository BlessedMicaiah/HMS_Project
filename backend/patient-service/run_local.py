import os
from app import app, db

if __name__ == '__main__':
    # Force SQLite for local testing
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///patient_service.db'
    
    # Create database tables if they don't exist
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")
        
        # Check if we need to seed the database
        from app import seed_db
        seed_db()
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=3001, debug=True)
