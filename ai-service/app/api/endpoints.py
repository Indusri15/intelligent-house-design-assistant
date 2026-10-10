from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Dict, Any

from app.api.models import (
    LayoutGenerationRequest,
    VastuEvaluationRequest,
    SiteAnalysisResponse,
    FloorplanSegmentationResponse
)
from app.core.geometric_engine import GeometricFloorPlanEngine
from app.core.vastu_evaluator import VastuEvaluator
from app.core.cv_boundary_detector import SiteBoundaryDetector
from app.ml.floorplan_segmentor import FloorplanSegmentor
from app.ml.ade20k_processor import ADE20KSceneProcessor

router = APIRouter()
segmentor = FloorplanSegmentor()
ade20k_processor = ADE20KSceneProcessor()

@router.post("/generate-layout")
async def generate_layout_endpoint(req: LayoutGenerationRequest) -> Dict[str, Any]:
    try:
        engine = GeometricFloorPlanEngine(
            plot_length=req.plot.length,
            plot_width=req.plot.width,
            setbacks=req.plot.setbacks.dict(),
            facing=req.plot.facingDirection
        )
        layout = engine.generate_layout(
            accommodation=req.accommodation.dict(),
            floors_count=req.accommodation.floors
        )
        return {"success": True, "data": layout}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Layout generation failed: {str(e)}")

@router.post("/evaluate-vastu")
async def evaluate_vastu_endpoint(req: VastuEvaluationRequest) -> Dict[str, Any]:
    try:
        result = VastuEvaluator.evaluate(rooms=req.rooms, facing=req.facingDirection)
        return {"success": True, "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Vastu evaluation failed: {str(e)}")

@router.post("/analyze-site-image")
async def analyze_site_image_endpoint(file: UploadFile = File(...)) -> Dict[str, Any]:
    try:
        contents = await file.read()
        analysis = SiteBoundaryDetector.analyze_site_image(contents)
        return {"success": True, "data": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Site image analysis failed: {str(e)}")

@router.post("/segment-floorplan")
async def segment_floorplan_endpoint(file: UploadFile = File(...)) -> Dict[str, Any]:
    try:
        contents = await file.read()
        seg_result = segmentor.segment_image(contents)
        return {"success": True, "data": seg_result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Floorplan segmentation failed: {str(e)}")

@router.post("/analyze-room-scene")
async def analyze_room_scene_endpoint(file: UploadFile = File(...), scene_hint: str = "living_room") -> Dict[str, Any]:
    try:
        contents = await file.read()
        analysis = ade20k_processor.analyze_scene_image(contents, scene_hint=scene_hint)
        return {"success": True, "data": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"ADE20K scene analysis failed: {str(e)}")

@router.get("/ade20k/info")
def ade20k_info_endpoint() -> Dict[str, Any]:
    return {
        "success": True,
        "dataset": "ADE20K MIT Scene Parsing Benchmark",
        "officialUrl": "https://ade20k.csail.mit.edu/",
        "githubUrl": "https://github.com/CSAILVision/ADE20K",
        "license": "Non-Commercial Research and Educational Use Only",
        "mappedClasses": ade20k_processor.classes,
        "supportedScenes": [
            "living_room", "master_bedroom", "bedroom", "kitchen",
            "dining_room", "bathroom", "pooja_room", "staircase",
            "balcony", "house_exterior"
        ]
    }

