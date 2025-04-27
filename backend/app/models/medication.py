from sqlalchemy import Column, Integer, String, Float
from sqlalchemy.orm import relationship
from app.database import Base

class Medication(Base):
    __tablename__ = 'medications'

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  
    description = Column(String)                    
    dosage_form = Column(String)                   
    strength = Column(String)                      
    stock_quantity = Column(Integer)               
    price = Column(Float)        