import requests
import json

# API endpoint
url = "http://localhost:3001/api/auth/login"

# Login credentials
data = {
    "username": "admin",
    "password": "password123"
}

# Send POST request
try:
    response = requests.post(url, json=data)
    
    # Print response
    print(f"Status Code: {response.status_code}")
    print("Response:")
    print(json.dumps(response.json(), indent=2))
except Exception as e:
    print(f"Error: {e}")
