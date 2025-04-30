from datetime import datetime, timedelta
from typing import Optional, Union
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel
import os
from dotenv import load_dotenv

# Loading environment variables from .env file
load_dotenv()

from app.schemas.pharmacist import PharmacistResponse
from app.models.pharmacist import Pharmacist
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.database import get_db

# JWT configuration
# Using environment variable for security, with a fallback for development
SECRET_KEY = os.environ.get("JWT_SECRET_KEY","secretttt")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Token URLs - where clients will send username/password to get token
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/token", 
    auto_error=False,
    scheme_name="pharmacistAuth"  # Same name as in main.py securitySchemes
)
doctor_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/doctor-token", 
    auto_error=False,
    scheme_name="doctorAuth"  # Same name as in main.py securitySchemes
)
patient_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="auth/patient-token", 
    auto_error=False,
    scheme_name="patientAuth"  # Same name as in main.py securitySchemes
)

class TokenData(BaseModel):
    email: Optional[str] = None
    user_type: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class UserInfo(BaseModel):
    id: int
    email: str
    user_type: str
    is_active: bool

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Unified authentication - can handle any user type
async def get_current_user(
    pharmacist_token: str = Depends(oauth2_scheme),
    doctor_token: str = Depends(doctor_oauth2_scheme),
    patient_token: str = Depends(patient_oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Try to authenticate as any user type and return user info with type"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Try pharmacist token first
    if pharmacist_token:
        try:
            payload = jwt.decode(pharmacist_token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            user_type: str = payload.get("user_type")
            if email and user_type == "pharmacist":
                pharmacist = db.query(Pharmacist).filter(Pharmacist.email == email).first()
                if pharmacist and pharmacist.is_active:
                    return UserInfo(
                        id=pharmacist.id,
                        email=pharmacist.email,
                        user_type="pharmacist",
                        is_active=pharmacist.is_active
                    )
        except JWTError:
            pass
    
    # Try doctor token
    if doctor_token:
        try:
            payload = jwt.decode(doctor_token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            user_type: str = payload.get("user_type")
            if email and user_type == "doctor":
                doctor = db.query(Doctor).filter(Doctor.email == email).first()
                if doctor and doctor.is_active:
                    return UserInfo(
                        id=doctor.id,
                        email=doctor.email,
                        user_type="doctor",
                        is_active=doctor.is_active
                    )
        except JWTError:
            pass
    
    # Try patient token
    if patient_token:
        try:
            payload = jwt.decode(patient_token, SECRET_KEY, algorithms=[ALGORITHM])
            email: str = payload.get("sub")
            user_type: str = payload.get("user_type")
            if email and user_type == "patient":
                patient = db.query(Patient).filter(Patient.email == email).first()
                if patient and patient.is_active:
                    return UserInfo(
                        id=patient.id,
                        email=patient.email,
                        user_type="patient",
                        is_active=patient.is_active
                    )
        except JWTError:
            pass
    
    raise credentials_exception

# Pharmacist authentication - original implementation
async def get_current_pharmacist(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Validate token and return current pharmacist"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check if token exists before trying to decode it
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        if email is None or user_type != "pharmacist":
            raise credentials_exception
        token_data = TokenData(email=email, user_type=user_type)
    except JWTError:
        raise credentials_exception
        
    pharmacist = db.query(Pharmacist).filter(Pharmacist.email == token_data.email).first()
    if pharmacist is None:
        raise credentials_exception
    if not pharmacist.is_active:
        raise HTTPException(status_code=400, detail="Inactive pharmacist")
        
    return pharmacist

async def get_current_active_pharmacist(current_pharmacist: Pharmacist = Depends(get_current_pharmacist)):
    """Check if current pharmacist is active"""
    if not current_pharmacist.is_active:
        raise HTTPException(status_code=400, detail="Inactive pharmacist")
    return current_pharmacist

# Doctor authentication - original implementation
async def get_current_doctor(token: str = Depends(doctor_oauth2_scheme), db: Session = Depends(get_db)):
    """Validate token and return current doctor"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check if token exists before trying to decode it
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        if email is None or user_type != "doctor":
            raise credentials_exception
        token_data = TokenData(email=email, user_type=user_type)
    except JWTError:
        raise credentials_exception
        
    doctor = db.query(Doctor).filter(Doctor.email == token_data.email).first()
    if doctor is None:
        raise credentials_exception
    if not doctor.is_active:
        raise HTTPException(status_code=400, detail="Inactive doctor")
        
    return doctor

async def get_current_active_doctor(current_doctor: Doctor = Depends(get_current_doctor)):
    """Check if current doctor is active"""
    if not current_doctor.is_active:
        raise HTTPException(status_code=400, detail="Inactive doctor")
    return current_doctor

# Patient authentication - original implementation
async def get_current_patient(token: str = Depends(patient_oauth2_scheme), db: Session = Depends(get_db)):
    """Validate token and return current patient"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check if token exists before trying to decode it
    if not token:
        raise credentials_exception
        
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_type: str = payload.get("user_type")
        if email is None or user_type != "patient":
            raise credentials_exception
        token_data = TokenData(email=email, user_type=user_type)
    except JWTError:
        raise credentials_exception
        
    patient = db.query(Patient).filter(Patient.email == token_data.email).first()
    if patient is None:
        raise credentials_exception
    if not patient.is_active:
        raise HTTPException(status_code=400, detail="Inactive patient")
        
    return patient

async def get_current_active_patient(current_patient: Patient = Depends(get_current_patient)):
    """Check if current patient is active"""
    if not current_patient.is_active:
        raise HTTPException(status_code=400, detail="Inactive patient")
    return current_patient