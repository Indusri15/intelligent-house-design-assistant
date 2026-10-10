# Models Directory

This directory stores neural network model definitions, training scripts, evaluation metrics, and exported weights for the AI/ML major project.

## Structure
- `checkpoints/`: Directory where trained model weights (`.pth`, `.pt`, `.onnx`) are saved.
- `README.md`: Model registry, architectural descriptions, training metrics, and inference benchmarks.

## Model Registry & Baseline Engines

### 1. Geometric Layout Engine (Baseline Core)
- **Type**: Constraint Satisfaction & Poly-Packing Optimization.
- **Role**: Deterministic generation of compliant 2D room boundaries, setbacks, circulation corridors, and multi-floor alignment.
- **Guarantee**: 100% boundary compliance, non-overlapping rooms, and exact dimensional fidelity.

### 2. CubiCasa Room & Wall Segmentor (CV/Deep Learning)
- **Type**: UNet / FCN with ResNet-34 / MobileNet backbone.
- **Input**: 512x512 RGB architectural floor-plan image or site raster.
- **Output**: Multi-class semantic segmentation mask (Background, Walls, Living, Bedroom, Kitchen, Bathroom, Balcony, Corridor, Doors, Windows).
- **Evaluation Metric**: Mean Intersection over Union (mIoU) and Pixel Accuracy.

### 3. Vastu Rule & Orientation Evaluator (Knowledge Graph / Expert System)
- **Type**: Parametric Expert Engine.
- **Role**: Mathematical orientation analysis (0-360 degrees) and compass zone scoring for Indian architectural norms.

### 4. Site Boundary & Survey Analyzer (OpenCV / Computer Vision)
- **Type**: Morphological edge detector and contour approximation.
- **Role**: Extracts approximate plot boundary polygons and checks perspective distortion from user-uploaded survey photos.
