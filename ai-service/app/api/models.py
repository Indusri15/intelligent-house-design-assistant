from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class SetbacksModel(BaseModel):
    front: float = 5.0
    rear: float = 3.0
    left: float = 3.0
    right: float = 3.0

class PlotInfoModel(BaseModel):
    length: float = Field(..., description="Plot length in feet", ge=10)
    width: float = Field(..., description="Plot width in feet", ge=10)
    shape: str = "RECTANGULAR"
    facingDirection: str = "East"
    setbacks: SetbacksModel = SetbacksModel()

class AccommodationModel(BaseModel):
    floors: int = 1
    bedrooms: int = 3
    bathrooms: int = 2
    livingRoom: bool = True
    diningRoom: bool = True
    kitchen: bool = True
    poojaRoom: bool = True
    utilityArea: bool = True
    parking: bool = True
    balcony: bool = True
    staircase: bool = True
    studyRoom: bool = False
    familyMembers: int = 4

class LayoutGenerationRequest(BaseModel):
    projectId: Optional[str] = None
    projectName: Optional[str] = "Residential Villa"
    plot: PlotInfoModel
    accommodation: AccommodationModel
    preferences: Optional[Dict[str, Any]] = {}
    vastuPreferences: Optional[Dict[str, Any]] = {}

class VastuEvaluationRequest(BaseModel):
    facingDirection: str = "East"
    rooms: List[Dict[str, Any]]

class SiteAnalysisResponse(BaseModel):
    isValidImage: bool
    aspectRatio: float
    detectedBoundaryPolygon: List[List[float]]
    perspectiveWarning: Optional[str] = None
    estimatedAreaSqFt: Optional[float] = None
    confidenceScore: float
    notes: List[str]

class FloorplanSegmentationResponse(BaseModel):
    modelName: str
    classesDetected: List[str]
    roomCounts: Dict[str, int]
    wallCoveragePercentage: float
    segmentationMaskBase64: Optional[str] = None
    meanIoU: float
    notes: str
