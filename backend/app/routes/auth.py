from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.utils import verify_password
from app.models.pharmacist import Pharmacist
from app.models.doctor import Doctor
from app.models.patient import Patient
from app.auth.jwt import create_access_token, Token, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login for pharmacists, get an access token for future requests
    """
    # Find pharmacist by email
    pharmacist = db.query(Pharmacist).filter(Pharmacist.email == form_data.username).first()
    
    # Verify pharmacist exists and password is correct
    if not pharmacist or not verify_password(form_data.password, pharmacist.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if pharmacist account is active
    if not pharmacist.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive pharmacist account"
        )
    
    # Create access token with sub claim containing pharmacist's email
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": pharmacist.email, "user_type": "pharmacist"}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/doctor-token", response_model=Token)
async def doctor_login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login for doctors, get an access token for future requests
    """
    # Find doctor by email
    doctor = db.query(Doctor).filter(Doctor.email == form_data.username).first()
    
    # Verify doctor exists and password is correct
    if not doctor or not verify_password(form_data.password, doctor.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if doctor account is active
    if not doctor.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive doctor account"
        )
    
    # Create access token with sub claim containing doctor's email
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": doctor.email, "user_type": "doctor"}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/patient-token", response_model=Token)
async def patient_login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    OAuth2 compatible token login for patients, get an access token for future requests
    """
    # Find patient by email
    patient = db.query(Patient).filter(Patient.email == form_data.username).first()
    
    # Verify patient exists and password is correct
    if not patient or not verify_password(form_data.password, patient.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if patient account is active
    if not patient.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive patient account"
        )
    
    # Create access token with sub claim containing patient's email
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": patient.email, "user_type": "patient"}, 
        expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}