import requests
import json
import pprint

# Base URL for the API
BASE_URL = "http://localhost:3001"
SWAGGER_URL = "http://localhost:5001"

def test_flask_api():
    """Test CRUD operations using the direct Flask API"""
    print("\n--- Testing Flask API CRUD Operations ---")
    
    # Test GET patients - Read operation
    print("\n1. Testing GET /patients")
    response = requests.get(f"{BASE_URL}/patients")
    if response.status_code == 200:
        print(f"✅ Success! Status: {response.status_code}")
        json_data = response.json()
        # Handle different response formats
        if isinstance(json_data, dict) and 'data' in json_data:
            pprint.pprint(json_data['data'][0] if json_data['data'] else "No patients found")
        elif isinstance(json_data, list) and json_data:
            pprint.pprint(json_data[0])
        else:
            print("Response structure:", type(json_data))
            pprint.pprint(json_data)
    else:
        print(f"❌ Failed! Status: {response.status_code}")
        print(response.text)
    
    # Test POST patient - Create operation
    print("\n2. Testing POST /patients")
    test_patient = {
        "firstName": "Test",
        "lastName": "Patient",
        "dateOfBirth": "1990-01-01",
        "gender": "Other",
        "email": f"test{hash('test')}@example.com",  # Use hash to make email unique
        "phone": "123-456-7890",
        "address": "123 Test St, Test City, TS 12345",
        "insuranceId": "TEST123",
        "medicalConditions": ["Test Condition"],
        "allergies": ["Test Allergy"],
        "notes": "Test patient for API testing"
    }
    
    response = requests.post(f"{BASE_URL}/patients", json=test_patient)
    patient_id = None
    if response.status_code in [200, 201]:
        patient_id = response.json().get("id")
        print(f"✅ Success! Status: {response.status_code}, Created patient ID: {patient_id}")
    else:
        print(f"❌ Failed! Status: {response.status_code}")
        print(response.text)
    
    # If creation succeeded, test PUT - Update operation
    if patient_id:
        print(f"\n3. Testing PUT /patients/{patient_id}")
        test_patient["firstName"] = "Updated"
        response = requests.put(f"{BASE_URL}/patients/{patient_id}", json=test_patient)
        if response.status_code in [200, 204]:
            print(f"✅ Success! Status: {response.status_code}")
        else:
            print(f"❌ Failed! Status: {response.status_code}")
            print(response.text)
        
        # Test DELETE - Delete operation
        print(f"\n4. Testing DELETE /patients/{patient_id}")
        response = requests.delete(f"{BASE_URL}/patients/{patient_id}")
        if response.status_code in [200, 204]:
            print(f"✅ Success! Status: {response.status_code}")
        else:
            print(f"❌ Failed! Status: {response.status_code}")
            print(response.text)

def test_swagger_api():
    """Test CRUD operations using the Swagger API"""
    print("\n--- Testing Swagger API CRUD Operations ---")
    
    # Test GET patients - Read operation
    print("\n1. Testing GET /patients via Swagger")
    response = requests.get(f"{SWAGGER_URL}/patients")
    if response.status_code == 200:
        print(f"✅ Success! Status: {response.status_code}")
        json_data = response.json()
        # Handle different response formats
        if isinstance(json_data, dict) and 'data' in json_data:
            pprint.pprint(json_data['data'][0] if json_data['data'] else "No patients found")
        elif isinstance(json_data, list) and json_data:
            pprint.pprint(json_data[0])
        else:
            print("Response structure:", type(json_data))
            pprint.pprint(json_data)
    else:
        print(f"❌ Failed! Status: {response.status_code}")
        print(response.text)
    
    # Test POST patient - Create operation
    print("\n2. Testing POST /patients via Swagger")
    test_patient = {
        "firstName": "Swagger",
        "lastName": "Test",
        "dateOfBirth": "1995-05-05",
        "gender": "Other",
        "email": f"swagger{hash('swagger')}@example.com",  # Use hash to make email unique
        "phone": "987-654-3210",
        "address": "456 Swagger St, API City, TS 54321",
        "insuranceId": "SWAGGER123",
        "medicalConditions": ["Test Condition"],
        "allergies": ["Test Allergy"],
        "notes": "Test patient for Swagger API testing"
    }
    
    response = requests.post(f"{SWAGGER_URL}/patients", json=test_patient)
    patient_id = None
    if response.status_code in [200, 201]:
        patient_id = response.json().get("id")
        print(f"✅ Success! Status: {response.status_code}, Created patient ID: {patient_id}")
    else:
        print(f"❌ Failed! Status: {response.status_code}")
        print(response.text)
    
    # If creation succeeded, test PUT - Update operation
    if patient_id:
        print(f"\n3. Testing PUT /patients/{patient_id} via Swagger")
        test_patient["firstName"] = "UpdatedSwagger"
        response = requests.put(f"{SWAGGER_URL}/patients/{patient_id}", json=test_patient)
        if response.status_code in [200, 204]:
            print(f"✅ Success! Status: {response.status_code}")
        else:
            print(f"❌ Failed! Status: {response.status_code}")
            print(response.text)
        
        # Test DELETE - Delete operation
        print(f"\n4. Testing DELETE /patients/{patient_id} via Swagger")
        response = requests.delete(f"{SWAGGER_URL}/patients/{patient_id}")
        if response.status_code in [200, 204]:
            print(f"✅ Success! Status: {response.status_code}")
        else:
            print(f"❌ Failed! Status: {response.status_code}")
            print(response.text)

if __name__ == "__main__":
    test_flask_api()
    test_swagger_api()
