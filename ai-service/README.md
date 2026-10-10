# AI & Computer Vision Microservice

FastAPI-powered Python microservice providing:
1. **Deterministic 2D Geometric Layout Solver & SVG Renderer**
2. **Parametric Vastu Shastra Orientation Evaluator**
3. **OpenCV Site Boundary & Survey Drawing Analyzer**
4. **CubiCasa5K Floorplan Semantic Segmentation Engine**

---

## Installation & Running

```powershell
# From project root:
cd ai-service
..\.python\python.exe -m pip install -r requirements.txt
..\.python\python.exe app/main.py
```
*Microservice starts on `http://localhost:8000`*
*Interactive OpenAPI documentation at `http://localhost:8000/docs`*

---

## Dataset & Training Pipeline Scripts

- `scripts/download_cubicasa5k.py`: Downloads sample or full CubiCasa5K floor-plan data.
- `scripts/preprocess_dataset.py`: Converts SVG annotations into 10-class PNG segmentation masks.
- `scripts/train_segmentor.py`: Trains UNet segmentation model with ResNet-34 backbone.
- `scripts/evaluate_model.py`: Evaluates mIoU and per-class metrics on held-out test splits.
