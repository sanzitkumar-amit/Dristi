import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from routers import projects, alerts, transparency, data_sync
from seed_data import seed_initial_data
from ml_engine import train_ml_models

app = FastAPI(
    title="DRISHTI - Early Risk Detection System & Civic Transparency Platform API",
    description="Backend API powering ML-driven early project risk monitoring and transparent civic procurement.",
    version="1.0.0"
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_db_and_ml():
    # 1. Create Tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Ensure ML Models are trained
    train_ml_models()
    
    # 3. Seed Initial Sample Projects if empty
    db = SessionLocal()
    try:
        seed_initial_data(db)
    finally:
        db.close()

# Include Routers
app.include_router(projects.router)
app.include_router(alerts.router)
app.include_router(transparency.router)
app.include_router(data_sync.router)

@app.get("/")
def root():
    return {
        "system": "DRISHTI - Early Risk Detection System for Project Monitoring",
        "status": "Operational",
        "version": "1.0.0",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8008, reload=True)
