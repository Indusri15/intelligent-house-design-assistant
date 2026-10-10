# CubiCasa5K Dataset Guide

## Reference
- **Citation**: Kalervo et al., *"CubiCasa5k: A Dataset for Floorplan Image Analysis"*, ICIPR / arXiv:1904.01920.
- **Official Repository**: [https://github.com/CubiCasa/CubiCasa5k](https://github.com/CubiCasa/CubiCasa5k)
- **Zenodo DOI**: [https://doi.org/10.5281/zenodo.5142274](https://doi.org/10.5281/zenodo.5142274)

## Dataset Description
CubiCasa5K consists of 5,000 architectural floor plan images with rich multi-level vector annotations, including:
- **Room Polygons & Boundaries** (Living room, Bedroom, Kitchen, Bathroom, Balcony, Corridor, Storage, etc.)
- **Iconic Architectural Elements** (Doors, Windows, Fixed Furniture, Stairs, Sinks, Stoves)
- **Wall Polygons** (External structural walls and interior partition boundaries)

## Directory Layout (Post-Download)
```
datasets/cubicasa5k/
├── data/
│   ├── high_quality/
│   ├── high_quality_architectural/
│   └── colorful/
├── splits/
│   ├── train.txt
│   ├── val.txt
│   └── test.txt
└── README.md
```

## Dataset Tasks Supported in this Project
1. **Floor-Plan Image Understanding**: Automatic vector extraction and wall segment identification.
2. **Room Segmentation**: Semantic labeling of floor polygons into architectural functional types.
3. **Architectural Element Recognition**: Door and window detection for egress and airflow validation.
4. **Benchmark Evaluation**: Intersection-over-Union (IoU) and pixel accuracy metrics.

## Download Instructions
To download and preprocess a verified subset or full dataset, run:
```powershell
python ai-service/scripts/download_cubicasa5k.py --sample-size 50
python ai-service/scripts/preprocess_dataset.py
```
*Note: Full raw downloads (~18 GB) are stored locally in `data/` and excluded from git.*
