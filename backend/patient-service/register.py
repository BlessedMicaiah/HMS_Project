from app import app, db, User, ROLES
from flask import jsonify, request

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    firstName = data.get('firstName')
    lastName = data.get('lastName')
    email = data.get('email')
    role = data.get('role', 'PATIENT')  # Default to PATIENT role if not specified
    
    # Validate required fields
    if not username or not password or not firstName or not lastName or not email:
        return jsonify({'message': 'All fields are required (username, password, firstName, lastName, email)'}), 400
    
    # Check if username already exists
    existing_user = User.query.filter_by(username=username).first()
    if existing_user:
        return jsonify({'message': 'Username already exists'}), 409
    
    # Check if email already exists
    existing_email = User.query.filter_by(email=email).first()
    if existing_email:
        return jsonify({'message': 'Email already exists'}), 409
    
    # Validate role (must be one of the defined roles)
    if role not in ROLES:
        return jsonify({'message': f'Invalid role. Must be one of: {", ".join(ROLES.keys())}'}), 400
    
    # Create new user
    new_user = User(
        username=username,
        password=password,  # In a real app, should be hashed
        firstName=firstName,
        lastName=lastName,
        email=email,
        role=role
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            'message': 'User registered successfully',
            'user': new_user.to_dict(),
            'token': new_user.id  # In a real app, use JWT or other token mechanism
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating user: {str(e)}'}), 500

# This file is meant to be imported into app.py
# Add the following line to app.py at the end of the file, before the if __name__ == '__main__':
# from register import register

if __name__ == '__main__':
    print("This file is not meant to be run directly. Please import it into app.py")
