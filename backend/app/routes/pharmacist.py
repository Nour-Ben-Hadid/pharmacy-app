from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.pharmacist import Pharmacist
from app.schemas.pharmacist import PharmacistCreate, PharmacistResponse
from app.crud.pharmacist import (
    create_pharmacist, 
    get_pharmacist, 
    get_pharmacist_by_license,
    update_pharmacist,
    delete_pharmacist
)

router = APIRouter(prefix="/pharmacists", tags=["pharmacists"])

@router.post("/", response_model=PharmacistResponse)
def register_pharmacist(pharmacist: PharmacistCreate, db: Session = Depends(get_db)):
    if get_pharmacist_by_license(db, pharmacist.license_number):
        raise HTTPException(status_code=400, detail="License number already registered")
    return create_pharmacist(db, pharmacist)

@router.get("/", response_model=List[PharmacistResponse])
def list_pharmacists(db: Session = Depends(get_db)):
    return db.query(Pharmacist).all()

@router.get("/{pharmacist_id}", response_model=PharmacistResponse)
def read_pharmacist(pharmacist_id: int, db: Session = Depends(get_db)):
    db_pharmacist = get_pharmacist(db, pharmacist_id)
    if not db_pharmacist:
        raise HTTPException(status_code=404, detail="pharmacist not found")
    return db_pharmacist

@router.get("/by-license/{license_number}", response_model=PharmacistResponse)
def read_pharmacist_by_license(license_number: str, db: Session = Depends(get_db)):
    db_pharmacist = get_pharmacist_by_license(db, license_number)
    if not db_pharmacist:
        raise HTTPException(status_code=404, detail="pharmacist not found")
    return db_pharmacist

@router.patch("/{pharmacist_id}", response_model=PharmacistResponse)
def edit_pharmacist(pharmacist_id: int, pharmacist_update: dict, db: Session = Depends(get_db)):
    db_pharmacist = update_pharmacist(db, pharmacist_id, pharmacist_update)
    if not db_pharmacist:
        raise HTTPException(status_code=404, detail="pharmacist not found")
    return db_pharmacist

@router.delete("/{pharmacist_id}")
def remove_pharmacist(pharmacist_id: int, db: Session = Depends(get_db)):
    if not delete_pharmacist(db, pharmacist_id):
        raise HTTPException(status_code=404, detail="pharmacist not found")
    return {"message": "pharmacist deleted"}