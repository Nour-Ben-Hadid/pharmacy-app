from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_create_patient():
    response = client.post("/patients/", json={
        "name": "AliceTest",
        "age": 30,
        "contact_info": "alice@example.com"
    })
    assert response.status_code == 200
    assert response.json()["name"] == "AliceTest"
    patient_id=response.json()["id"]

    #deleting after testing
    client.delete(f"/patients/{patient_id}")


def test_duplicate_patient():
    create_response1 = client.post("/patients/", json={
        "name": "BoobTest",
        "age": 28,
        "contact_info": "bob@example.com"
    })
    create_response2 = client.post("/patients/", json={
        "name": "BoobTest",
        "age": 28,
        "contact_info": "bob@example.com"
    })
    
    patient_id=create_response1.json()["id"]
    assert create_response1.status_code == 200
    assert create_response2.status_code == 400
    assert create_response2.json()["detail"] == "Patient already exists"

    #deleting after testing
    client.delete(f"/patients/{patient_id}")

def test_get_patient():
    # First, create a patient to make sure one exists
    create_response = client.post("/patients/", json={
        "name": "BobTest",
        "age": 28,
        "contact_info": "bob@example.com"
    })
    patient_id = create_response.json()["id"]

    # Then test the get endpoint
    get_response = client.get(f"/patients/{patient_id}")
    assert get_response.status_code == 200
    assert get_response.json()["name"] == "BobTest"

    #deleting after testing
    client.delete(f"/patients/{patient_id}")

def test_update_patient():
    create_response = client.post("/patients/", json={
        "name": "CharlieTest",
        "age": 40,
        "contact_info": "charlie@example.com"
    })
    patient_id = create_response.json()["id"]

    update_response = client.put(f"/patients/{patient_id}", json={
        "name": "CharlesTest",
        "age": 41,
        "contact_info": "charles@example.com"
    })
    assert update_response.status_code == 200
    assert update_response.json()["name"] == "CharlesTest"

    #deleting after testing
    client.delete(f"/patients/{patient_id}")

def test_delete_patient():
    create_response = client.post("/patients/", json={
        "name": "Dave",
        "age": 35,
        "contact_info": "dave@example.com"
    })
    patient_id = create_response.json()["id"]

    delete_response = client.delete(f"/patients/{patient_id}")
    assert delete_response.status_code == 200
