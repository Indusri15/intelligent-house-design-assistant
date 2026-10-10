import os
import sys

# Ensure ai-service directory is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router as api_router

app = FastAPI(
    title="Intelligent House Design & Construction AI Service",
    description="Geometric Floor-Plan Solver, Computer Vision Site Demarcation, Vastu Evaluator, and CubiCasa5K Floorplan Segmentor",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {
        "status": "ONLINE",
        "service": "AI & Computer Vision Microservice",
        "version": "1.0.0",
        "modelsLoaded": {
            "geometricEngine": "Active (Deterministic Constraint Solver)",
            "vastuExpertEngine": "Active (Parametric Orientation Evaluator)",
            "cvBoundaryDetector": "Active (OpenCV 4.x Morphological Pipeline)",
            "cubicasaFloorplanSegmentor": "Active (CubiCasa5K Standard Mapping)"
        }
    }

app.include_router(api_router, prefix="/api/ai")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print("==========================================================")
    print(f"  AI Microservice starting on http://localhost:{port}")
    print(f"  Swagger API Docs: http://localhost:{port}/docs")
    print("==========================================================")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
