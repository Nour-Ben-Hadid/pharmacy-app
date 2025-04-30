from fastapi import FastAPI
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import patient, medication, prescription, doctor, pharmacist, auth

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Pharmacy Management API",
    description="API for managing pharmacy operations, prescriptions, and inventory",
    version="1.0.0",
    # Configure swagger with multiple security schemes
    openapi_tags=[
        {"name": "authentication", "description": "Authentication operations"},
        {"name": "prescriptions", "description": "Prescription management"},
        {"name": "medications", "description": "Medication inventory management"},
        {"name": "patients", "description": "Patient management"},
        {"name": "doctors", "description": "Doctor management"},
        {"name": "pharmacists", "description": "Pharmacist management"}
    ]
)

# Add CORS middleware to allow frontend connections
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes de chaque ressource
app.include_router(auth.router)  # Authentication routes
app.include_router(patient.router)
app.include_router(medication.router)
app.include_router(prescription.router)
app.include_router(doctor.router)
app.include_router(pharmacist.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Pharmacy !!! "}

# Customize the OpenAPI schema to support multiple security schemes
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Define the security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "pharmacistAuth": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "auth/token",
                    "scopes": {}
                }
            }
        },
        "doctorAuth": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "auth/doctor-token",
                    "scopes": {}
                }
            }
        },
        "patientAuth": {
            "type": "oauth2",
            "flows": {
                "password": {
                    "tokenUrl": "auth/patient-token",
                    "scopes": {}
                }
            }
        }
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi