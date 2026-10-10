import cv2
import numpy as np
from typing import Dict, Any, List

class SiteBoundaryDetector:
    @staticmethod
    def analyze_site_image(image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyzes an uploaded site survey image or photograph using OpenCV.
        Detects primary rectangular or polygonal boundaries, aspect ratio, and perspective distortion.
        """
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            return {
                "isValidImage": False,
                "aspectRatio": 0.0,
                "detectedBoundaryPolygon": [],
                "confidenceScore": 0.0,
                "notes": ["Could not decode image file format."]
            }

        h, w = img.shape[:2]
        aspect_ratio = round(w / float(h), 3)

        # Grayscale & Preprocessing
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)

        # Morphological Closing
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

        # Find Contours
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        boundary_poly = []
        confidence = 0.85
        notes = []

        if contours:
            # Sort contours by area descending
            largest_contour = max(contours, key=cv2.contourArea)
            peri = cv2.arcLength(largest_contour, True)
            approx = cv2.approxPolyDP(largest_contour, 0.02 * peri, True)

            if len(approx) == 4:
                notes.append("Detected clean 4-corner quadrilateral boundary.")
                confidence = 0.92
            else:
                notes.append(f"Detected complex polygon with {len(approx)} vertices.")
                confidence = 0.78

            # Normalize coordinates to 0..1 range
            for pt in approx:
                x_norm = round(float(pt[0][0]) / w, 4)
                y_norm = round(float(pt[0][1]) / h, 4)
                boundary_poly.append([x_norm, y_norm])
        else:
            notes.append("No distinct closed survey boundary detected; default bounding rectangle used.")
            boundary_poly = [[0.05, 0.05], [0.95, 0.05], [0.95, 0.95], [0.05, 0.95]]
            confidence = 0.60

        # Perspective Distortion Check
        if aspect_ratio < 0.3 or aspect_ratio > 3.0:
            perspective_warning = f"High perspective distortion / unusual aspect ratio ({aspect_ratio}). Please verify physical survey tape measurements."
        else:
            perspective_warning = None

        notes.append("Survey photographic processing provides preliminary visual approximation only. Final legal demarcation requires registered surveyor verification.")

        return {
            "isValidImage": True,
            "aspectRatio": aspect_ratio,
            "detectedBoundaryPolygon": boundary_poly,
            "perspectiveWarning": perspective_warning,
            "confidenceScore": confidence,
            "notes": notes
        }
