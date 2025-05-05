def update_cors():
    # Read app.py file
    with open('app.py', 'r') as file:
        content = file.read()
    
    # Replace basic CORS with configured CORS
    updated_content = content.replace(
        'CORS(app)', 
        'CORS(app, resources={r"/*": {"origins": ["http://localhost:3002", "http://localhost:3000", "http://localhost:3006"]}})'
    )
    
    # Write back to app.py
    with open('app.py', 'w') as file:
        file.write(updated_content)
    
    print("CORS configuration updated successfully!")

if __name__ == "__main__":
    update_cors()
