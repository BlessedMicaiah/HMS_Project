from app import app, db, seed_db
import os

if __name__ == "__main__":
    # Ensure instance directory exists
    os.makedirs('instance', exist_ok=True)
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/patient_service.db'
    with app.app_context():
        print(f"DB URI: {app.config['SQLALCHEMY_DATABASE_URI']}")
        db.create_all()
        print("Tables created!")
        seed_db()
        print("Seed data added!")
