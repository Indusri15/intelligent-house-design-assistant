# ADE20K Dataset Pipeline & Scene Understanding Documentation

## 1. Dataset Overview
- **Dataset Name**: ADE20K (MIT Scene Parsing Benchmark)
- **Official Portal**: [https://ade20k.csail.mit.edu/](https://ade20k.csail.mit.edu/)
- **GitHub Repository**: [https://github.com/CSAILVision/ADE20K](https://github.com/CSAILVision/ADE20K)
- **Research Citation**: Zhou et al., *"Scene Parsing through ADE20K Dataset"*, CVPR 2017 / TPAMI 2018.
- **License & Usage Restrictions**: Permitted strictly for **non-commercial research, academic, and educational use** (B.Tech IT Major Project).

---

## 2. Dataset Composition & Class Taxonomies
ADE20K contains over **25,000 images** densely annotated with **150 semantic categories**, spanning both indoor living spaces and outdoor architectural elevations.

### Key Indoor Semantic Classes:
| Class ID | Semantic Class | Architectural Utility in Project |
|---|---|---|
| `1` | `wall` | Room boundary extraction, wall paint & paneling area estimation |
| `3` | `floor` | Floor tiling, marble, and wooden plank surface detection |
| `5` | `ceiling` | False ceiling, cove lighting, and chandelier layout parsing |
| `7` | `door` | Internal circulation and door frame detection |
| `8` | `window` | Natural daylight and ventilation assessment |
| `9` | `sofa / armchair` | Living room seating & circulation clearance |
| `10` | `bed` | Master bedroom & guest bedroom layout placement |
| `14` | `cabinet / cupboard` | Modular kitchen overhead units & bedroom wardrobes |
| `15` | `table / desk` | Dining table and study room furniture verification |
| `23` | `curtain / drape` | Window treatment specifications |
| `45` | `refrigerator` | Kitchen utility placement |
| `65` | `sink` | Kitchen countertop and bathroom vanity detection |

### Key Outdoor Architecture Classes:
| Class ID | Semantic Class | Architectural Utility in Project |
|---|---|---|
| `2` | `building / facade` | Front elevation structure and massing |
| `4` | `tree / foliage` | Site landscaping and setback greenery |
| `6` | `road / street` | Front municipal road access verification |
| `12` | `sidewalk / path` | Paved driveway and pedestrian entry walk |
| `13` | `earth / ground` | Plot boundary and unbuilt setback areas |
| `16` | `fence / boundary wall` | Compound wall and perimeter security |
| `25` | `grand staircase` | External porch and elevation steps |
| `29` | `balcony / railing` | Cantilevered balcony and facade profile |

---

## 3. Dataset Preprocessing & Ingestion Pipeline

### Directory Organization:
```text
datasets/
├── ade20k/
│   ├── annotations/
│   │   ├── training/
│   │   └── validation/
│   ├── images/
│   │   ├── training/
│   │   └── validation/
│   └── scene_categories.json
```

### Preprocessing Steps (`datasets/preprocess_ade20k.py`):
1. **Annotation Filtering**: Isolates residential scene categories (`living_room`, `bedroom`, `kitchen`, `bathroom`, `house_exterior`).
2. **Dimension Normalization**: Resizes input photographs to standard $512 \times 512$ with preserved aspect ratios.
3. **Color Palette Extraction**: Uses k-means clustering in HSV/RGB space to discover dominant finish color palettes.
4. **Scene Object Area Ratios**: Calculates surface-area percentages for walls, floors, and ceilings to inform BOQ material estimates.

---

## 4. Distinction Between Scene Understanding and Generative AI
- **ADE20K Role**: Semantic segmentation, object classification, visual scene understanding, and spatial layout verification of uploaded room/elevation photos.
- **Generative Design Role**: High-resolution photorealistic conceptual image synthesis conditioned on geometric floor plans, budget tier, and Vastu orientation (implemented via modular neural generator engine & provider APIs).
