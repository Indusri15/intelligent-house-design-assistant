from typing import Dict, Any

class RoomTypeClassifier:
    """
    Classifies room polygons and spatial features into architectural functional types.
    """
    @staticmethod
    def classify_room_aspect(area_sqft: float, aspect_ratio: float, has_attached_bath: bool = False) -> Dict[str, Any]:
        if area_sqft >= 160 and has_attached_bath:
            predicted_type = "master_bedroom"
            confidence = 0.92
        elif area_sqft >= 180:
            predicted_type = "living_room"
            confidence = 0.88
        elif area_sqft >= 100 and area_sqft < 160:
            predicted_type = "bedroom"
            confidence = 0.85
        elif area_sqft >= 70 and area_sqft < 100:
            predicted_type = "kitchen"
            confidence = 0.82
        elif area_sqft <= 50:
            predicted_type = "bathroom"
            confidence = 0.90
        else:
            predicted_type = "dining_or_study"
            confidence = 0.75

        return {
            "predictedRoomType": predicted_type,
            "confidence": confidence,
            "areaSqFt": area_sqft,
            "aspectRatio": aspect_ratio
        }
