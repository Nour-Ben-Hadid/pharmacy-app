import pytest
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy import event
from pathlib import Path
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base , get_db


# In-memory with aggressive cleanup
TEST_DB_URL = "sqlite:///:memory:"
engine = create_engine(TEST_DB_URL)

# Critical for SQLite foreign key support
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

@pytest.fixture(scope="function")
def db():
    # Force fresh metadata state
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    
    db = sessionmaker(autocommit=False, autoflush=False, bind=engine)()
    try:
        yield db
    finally:
        db.rollback()
        db.close()
        engine.dispose()  # Nuclear cleanup

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            db.rollback()
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()