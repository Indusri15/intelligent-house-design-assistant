# ADE20K Scene Parsing & Semantic Segmentation Dataset Documentation

## Overview
The **ADE20K dataset** is a scene parsing benchmark developed by the MIT Computer Vision and Learning Group (CSAIL). In this project, ADE20K serves as the core computer vision reference dataset for **residential scene understanding, semantic segmentation, architectural element identification, dominant color palette extraction, and interior/exterior layout analysis**.

- **Official Website**: [https://ade20k.csail.mit.edu/](https://ade20k.csail.mit.edu/)
- **GitHub Repository**: [https://github.com/CSAILVision/ADE20K](https://github.com/CSAILVision/ADE20K)
- **Dataset License**: MIT CSAIL Non-Commercial Academic & Educational Research License.

---

## 1. Dataset Characteristics & Annotation Hierarchy
ADE20K contains over **25,000 densely annotated images** across hundreds of complex indoor and outdoor scenes. Each image includes:
1. **Pixel-Level Semantic Segmentation**: 150 standard semantic classes (walls, floors, ceilings, furniture, windows, doors, facades, vegetation, etc.).
2. **Instance-Level Object Masks**: Exact polygonal segmentations distinguishing individual objects.
3. **Part Annotations**: Sub-object breakdowns (e.g., door handle, sofa cushion, window pane).
4. **Scene Categorization**: Comprehensive scene categorization tags (e.g., `living_room`, `bedroom`, `kitchen`, `dining_room`, `bathroom`, `house_exterior`).

---

## 2. Residential Domain Filtering & Scene Taxonomy
While ADE20K is a general-purpose vision benchmark covering diverse natural and urban scenes, this project extracts and maps the **residential architectural subset**:

| Class ID | ADE20K Semantic Label | Architectural Category | Construction / BOQ Material Mapping |
|:---|:---|:---|:---|
| **1** | `wall` | Structural Surface | Interior Acrylic Emulsion / Putty / Textured Wallpaper |
| **2** | `building_facade` | Exterior Elevation | Sandstone Cladding / Weatherproof Plaster / WPC Louvers |
| **3** | `floor` | Flooring Finish | Glazed Vitrified Tiles (GVT) / Italian Marble / Wooden Planks |
| **4** | `tree_greenery` | Landscape | Softscape Garden, Lawn & Planter Beds |
| **5** | `ceiling` | Ceiling Surface | Saint-Gobain Gypsum False Ceiling & Cove Profiles |
| **6** | `road_driveway` | Hardscape | Interlocking Paver Blocks / Concrete Driveway |
| **7** | `door` | Millwork / Access | Teak Wood Main Door / Flush & Veneer Internal Doors |
| **8** | `window` | Fenestration | UPVC 3-Track Sliding Windows / System Glazing |
| **9** | `sofa_couch` | Living Furniture | Fabric Sectional Sofa & Lounge Seating |
| **10** | `bed` | Bedroom Furniture | King/Queen Size Bed Frame & Upholstered Headboard |
| **14** | `wardrobe_cabinet` | Joinery & Storage | Marine Plywood Wardrobes with Soft-Close Hinges |
| **15** | `dining_table` | Dining Furniture | Hardwood 6-Seater Dining Set |
| **25** | `staircase` | Vertical Circulation | Granite / Marble Tread Steps & SS Railing |
| **29** | `balcony_railing` | Safety Barrier | 12mm Toughened Glass with SS 304 Profile |
| **65** | `kitchen_sink` | Plumbing Fixtures | Quartz / Stainless Steel Sink & Quartz Countertop |

---

## 3. Important Architectural Distinction
> [!IMPORTANT]
> **ADE20K is a Scene Understanding and Semantic Segmentation Dataset, NOT a Text-to-Image Generative Model.**
> 
> - **ADE20K's Role**: Scene classification, surface area ratio decomposition, element boundary recognition, lighting quality assessment, and color palette extraction from uploaded user room/site photographs.
> - **Generative Synthesis Role**: Photorealistic 2D conceptual interior and exterior renderings are generated using modern pretrained multi-provider generative image pipelines (OpenAI DALL-E 3, Stability AI, HuggingFace Inference, or Pollinations.ai / Flux AI), keeping strict dimensional engineering plans separated from visual aesthetic renderings.

---

## 4. Environment Configuration
The dataset path is configurable via the environment variable `ADE20K_DATASET_PATH`:
```bash
# In backend/.env or system environment
ADE20K_DATASET_PATH=c:/Users/ADMIN/Desktop/intelligent-house-design-assistant/datasets/ade20k
```

### Dataset Management Scripts
- `datasets/validate_ade20k.py`: Verifies directory structure, manifest, and category mappings.
- `datasets/preprocess_ade20k.py`: Generates the residential architectural taxonomy and color palette references.
- `datasets/download_ade20k.py`: Downloads or verifies the residential sample subset without redownloading multi-gigabyte archives automatically.
