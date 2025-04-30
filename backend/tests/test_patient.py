def test_create_patient(client):
    response = client.post("/patients/", json={
        "ssn": "103-45-6789",
        "name": "John Doe",
        "date_of_birth":"2001-02-02",
        "contact_info":"email@exepmle.com"
    })
    assert response.status_code == 201
    assert response.json()["ssn"] == "123-45-6789"


'''def test_duplicate_ssn_rejection(client):
    # First creation - should succeed
    response1 = client.post("/patients/", json={
        "ssn": "123-45-6789",
        "name": "John Doe",
        "date_of_birth": "2001-02-02",
        "contact_info": "john@example.com"
    })
    assert response1.status_code == 201
    
    # Second attempt - should fail
    response2 = client.post("/patients/", json={
        "ssn": "123-45-6789",  # Same SSN
        "name": "Jane Doe",
        "date_of_birth": "1990-01-01",
        "contact_info": "jane@example.com"
    })
    assert response2.status_code == 400
    assert "already exists" in response2.json().get("detail", "")'''
