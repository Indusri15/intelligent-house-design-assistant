import xml.etree.ElementTree as ET
import numpy as np
from PIL import Image, ImageDraw
import os
from typing import Dict, List, Tuple, Any

# CubiCasa5K 10-Class Semantic Mapping
CUBICASA_CLASSES = {
    0: 'Background',
    1: 'Wall',
    2: 'Living Room',
    3: 'Bedroom',
    4: 'Kitchen',
    5: 'Bathroom',
    6: 'Balcony',
    7: 'Corridor / Entry',
    8: 'Door',
    9: 'Window'
}

CLASS_NAME_TO_ID = {
    'background': 0,
    'wall': 1,
    'living': 2,
    'room': 3,
    'bedroom': 3,
    'kitchen': 4,
    'bath': 5,
    'bathroom': 5,
    'wc': 5,
    'balcony': 6,
    'terrace': 6,
    'corridor': 7,
    'hall': 7,
    'entry': 7,
    'door': 8,
    'window': 9
}

class CubiCasaDataProcessor:
    """
    Parses vector SVG annotations from CubiCasa5K dataset into multi-class raster segmentation masks.
    """
    @staticmethod
    def svg_to_raster_mask(svg_path: str, target_size: Tuple[int, int] = (512, 512)) -> np.ndarray:
        mask = Image.new('L', target_size, 0)
        draw = ImageDraw.Draw(mask)

        if not os.path.exists(svg_path):
            # Create synthetic structural sample for pipeline benchmarking
            w, h = target_size
            # Walls
            draw.rectangle([20, 20, w-20, h-20], fill=1)
            # Living
            draw.rectangle([30, 30, int(w*0.5), int(h*0.5)], fill=2)
            # Kitchen
            draw.rectangle([int(w*0.5)+10, 30, w-30, int(h*0.5)], fill=4)
            # Bedroom
            draw.rectangle([30, int(h*0.5)+10, int(w*0.6), h-30], fill=3)
            # Bath
            draw.rectangle([int(w*0.6)+10, int(h*0.5)+10, w-30, h-30], fill=5)
            return np.array(mask, dtype=np.uint8)

        try:
            tree = ET.parse(svg_path)
            root = tree.getroot()
            for elem in root.iter():
                tag = elem.tag.lower()
                class_attr = elem.attrib.get('class', '').lower()
                class_id = CLASS_NAME_TO_ID.get(class_attr, 0)

                if tag.endswith('polygon') or tag.endswith('path'):
                    points_str = elem.attrib.get('points', '')
                    if points_str:
                        pts = []
                        for pair in points_str.strip().split():
                            coords = [float(c) for c in pair.split(',') if c]
                            if len(coords) == 2:
                                pts.append((coords[0], coords[1]))
                        if len(pts) >= 3:
                            draw.polygon(pts, fill=class_id)
        except Exception as e:
            print(f"[CubiCasa Parser Warning] Failed to parse {svg_path}: {e}")

        return np.array(mask, dtype=np.uint8)

    @staticmethod
    def compute_iou(pred_mask: np.ndarray, target_mask: np.ndarray, num_classes: int = 10) -> Dict[str, float]:
        ious = {}
        for c in range(num_classes):
            pred_inds = (pred_mask == c)
            target_inds = (target_mask == c)
            intersection = np.logical_and(pred_inds, target_inds).sum()
            union = np.logical_or(pred_inds, target_inds).sum()

            if union == 0:
                ious[CUBICASA_CLASSES[c]] = float('nan')
            else:
                ious[CUBICASA_CLASSES[c]] = round(float(intersection) / float(union), 4)

        valid_ious = [v for v in ious.values() if not np.isnan(v)]
        mean_iou = round(float(np.mean(valid_ious)), 4) if valid_ious else 0.0
        return {"classIoUs": ious, "meanIoU": mean_iou}
