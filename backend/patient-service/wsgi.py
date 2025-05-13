import os
from app import app as flask_app
import swagger_api

# Determine which app to run based on environment variable
if os.environ.get('USE_SWAGGER', 'false').lower() == 'true':
    app = swagger_api.flask_app
else:
    app = flask_app
    
# Initialize database on Heroku
if os.environ.get('FLASK_ENV') == 'production':
    # Ensure the database tables exist
    with flask_app.app_context():
        from app import db
        db.create_all()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port)
