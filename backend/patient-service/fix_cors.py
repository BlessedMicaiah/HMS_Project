from flask import Flask, jsonify
from flask_cors import CORS

def apply_cors_fix():
    with open('app.py', 'r') as file:
        content = file.readlines()
    
    # Find the Flask app initialization
    app_line_index = -1
    cors_line_index = -1
    
    for i, line in enumerate(content):
        if 'app = Flask(__name__)' in line:
            app_line_index = i
        if 'CORS(app' in line:
            cors_line_index = i
    
    if cors_line_index != -1:
        # Replace existing CORS line with new configuration
        content[cors_line_index] = "CORS(app, origins=['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3006', 'https://hms-frontend-pd89.onrender.com', 'https://hms-api-gateway.onrender.com', 'https://hms-patient-service-vq8x.onrender.com'], supports_credentials=True, allow_headers=['Content-Type', 'X-User-ID', 'Authorization'])\n"
    
    # Write the updated content back to app.py
    with open('app.py', 'w') as file:
        file.writelines(content)
    
    print("CORS fix applied successfully!")
    
if __name__ == "__main__":
    apply_cors_fix()
