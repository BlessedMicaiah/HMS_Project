import os
from app import app, db

if __name__ == '__main__':
    # Fix for Render PostgreSQL connection strings
    database_url = os.environ.get('DATABASE_URL', 'sqlite:///patient_service.db')
    
    # Render-specific PostgreSQL URL format fix (postgres:// -> postgresql://)
    if database_url and database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql://", 1)
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    
    # Create database tables if they don't exist
    with app.app_context():
        try:
            db.create_all()
            print("Database tables created successfully!")
        except Exception as e:
            print(f"Error creating database tables: {e}")
            # Fallback to SQLite if PostgreSQL connection fails
            app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///patient_service.db'
            db.create_all()
            print("Fallback to SQLite successful!")
    
    # Get port from environment (Render sets this automatically)
    port = int(os.environ.get('PORT', 3001))
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=port, debug=False)
