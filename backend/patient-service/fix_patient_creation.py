def fix_patient_create():
    with open('app.py', 'r') as file:
        content = file.readlines()
    
    create_patient_start = -1
    create_patient_end = -1
    
    # Find the create_patient function
    for i, line in enumerate(content):
        if '@app.route(\'/api/patients\', methods=[\'POST\'])' in line:
            create_patient_start = i
        elif create_patient_start != -1 and line.strip() == '':
            if create_patient_end == -1 and i > create_patient_start + 10:  # Make sure we're past the function definition
                create_patient_end = i
    
    if create_patient_start != -1 and create_patient_end != -1:
        # Updated create_patient function with better error handling and debugging
        new_create_patient = [
            "@app.route('/api/patients', methods=['POST'])\n",
            "@authorize('write')\n",
            "def create_patient():\n",
            "    try:\n",
            "        data = request.get_json()\n",
            "        if not data:\n",
            "            return jsonify({'error': 'No data provided'}), 400\n",
            "        \n",
            "        # Log the incoming data for debugging\n",
            "        app.logger.info(f\"Creating patient with data: {json.dumps(data)}\")\n",
            "        \n",
            "        # Validate required fields\n",
            "        required_fields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'email', 'phone', 'address']\n",
            "        missing_fields = [field for field in required_fields if field not in data or not data.get(field)]\n",
            "        if missing_fields:\n",
            "            return jsonify({'error': f'Missing required fields: {missing_fields}'}), 400\n",
            "        \n",
            "        # Convert string arrays to lists if they are strings\n",
            "        if 'medicalConditions' in data:\n",
            "            if isinstance(data['medicalConditions'], str):\n",
            "                data['medicalConditions'] = [condition.strip() for condition in data['medicalConditions'].split(',') if condition.strip()]\n",
            "            elif not isinstance(data['medicalConditions'], list):\n",
            "                data['medicalConditions'] = []\n",
            "        else:\n",
            "            data['medicalConditions'] = []\n",
            "        \n",
            "        if 'allergies' in data:\n",
            "            if isinstance(data['allergies'], str):\n",
            "                data['allergies'] = [allergy.strip() for allergy in data['allergies'].split(',') if allergy.strip()]\n",
            "            elif not isinstance(data['allergies'], list):\n",
            "                data['allergies'] = []\n",
            "        else:\n",
            "            data['allergies'] = []\n",
            "        \n",
            "        app.logger.info(f\"Processed medical conditions: {data.get('medicalConditions')}\")\n",
            "        app.logger.info(f\"Processed allergies: {data.get('allergies')}\")\n",
            "        \n",
            "        # Process profile image if provided\n",
            "        profile_image_url = None\n",
            "        if 'profileImage' in data and data['profileImage']:\n",
            "            try:\n",
            "                profile_image_url = upload_base64_to_s3(data['profileImage'])\n",
            "            except Exception as e:\n",
            "                app.logger.error(f\"Error uploading profile image: {str(e)}\")\n",
            "        \n",
            "        # Determine the creator ID - use authenticated user if available\n",
            "        creator_id = None\n",
            "        if hasattr(request, 'user') and request.user:\n",
            "            creator_id = request.user.id\n",
            "        elif 'createdBy' in data and data['createdBy']:\n",
            "            creator_id = data['createdBy']\n",
            "        \n",
            "        # Create new patient\n",
            "        new_patient = Patient(\n",
            "            firstName=data.get('firstName'),\n",
            "            lastName=data.get('lastName'),\n",
            "            dateOfBirth=data.get('dateOfBirth'),\n",
            "            gender=data.get('gender'),\n",
            "            email=data.get('email'),\n",
            "            phone=data.get('phone'),\n",
            "            address=data.get('address'),\n",
            "            insuranceId=data.get('insuranceId'),\n",
            "            medicalConditions=data.get('medicalConditions', []),\n",
            "            allergies=data.get('allergies', []),\n",
            "            notes=data.get('notes', ''),\n",
            "            profileImageUrl=profile_image_url,\n",
            "            createdBy=creator_id\n",
            "        )\n",
            "        \n",
            "        db.session.add(new_patient)\n",
            "        db.session.commit()\n",
            "        \n",
            "        return jsonify(new_patient.to_dict()), 201\n",
            "    except Exception as e:\n",
            "        db.session.rollback()\n",
            "        app.logger.error(f\"Error creating patient: {str(e)}\")\n",
            "        return jsonify({'error': f'Error creating patient: {str(e)}'}), 500\n",
            "\n"
        ]
        
        # Replace the old function with the new one
        content[create_patient_start:create_patient_end] = new_create_patient
        
        # Write the updated content back to app.py
        with open('app.py', 'w') as file:
            file.writelines(content)
        
        print("Patient creation function fixed successfully!")
    else:
        print("Could not find the create_patient function in app.py")

if __name__ == "__main__":
    fix_patient_create()
