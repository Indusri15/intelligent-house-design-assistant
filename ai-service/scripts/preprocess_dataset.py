import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from app.ml.cubicasa_processor import CubiCasaDataProcessor
from PIL import Image

def preprocess_cubicasa_dataset():
    print("==========================================================")
    print("  Preprocessing CubiCasa5K Vector Polygons to 512x512 Masks")
    print("==========================================================")
    
    data_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../datasets/cubicasa5k/data'))
    processed_count = 0

    for root, dirs, files in os.walk(data_dir):
        for f in files:
            if f.endswith('.svg'):
                svg_path = os.path.join(root, f)
                mask = CubiCasaDataProcessor.svg_to_raster_mask(svg_path, (512, 512))
                mask_png_path = os.path.splitext(svg_path)[0] + '_mask.png'
                Image.fromarray(mask).save(mask_png_path)
                processed_count += 1

    print(f"[OK] Successfully converted {processed_count} vector floor-plan SVGs to 10-class segmentation masks.")

if __name__ == '__main__':
    preprocess_cubicasa_dataset()
