# Intelligent House Design and Construction Assistant
**B.Tech Information Technology Major Project — AI/ML Domain**

An intelligent full-stack architectural planning, geometric floor-plan generation, AI Interior & Exterior design synthesis, ADE20K scene understanding, transparent BOQ cost estimation, Vastu compliance analysis, and construction progress management platform.

---

## Key Features

1. **6-Step Multi-Step Project Wizard**:
   - Project specifications & location (Warangal / Telangana regional defaults supported).
   - Real-time Plot boundary, setback restrictions, and automatically calculated plot area.
   - Comprehensive accommodation requirements (Bedrooms, Bathrooms, Living, Dining, Kitchen, Pooja, Balcony, Staircase, Parking, Study).
   - Architectural styles (Modern Minimalist, Contemporary, Traditional Indian, Modern Luxury) with interior preferences.
   - Vastu Shastra toggles and orientation preferences.
   - Comprehensive pre-flight review, conflict warnings, and database persistence.

2. **Geometric Floor-Plan Generation Engine & Studio**:
   - Generates non-overlapping, setback-compliant 2D architectural floor plans.
   - Multi-floor layout generation (Ground Floor, First Floor) with aligned vertical staircases.
   - Interactive SVG Floor Plan Studio with Pan/Zoom, Layers (Walls, Dimensions, Furniture, Doors, Windows, Labels, North Arrow), and multi-candidate comparison.
   - Exportable as SVG and printable architectural drawings.

3. **AI Interior Design Studio**:
   - Room-by-room customization (Living Room, Master Bedroom, Bedroom, Kitchen, Dining Room, Luxury Bathroom, Pooja Mandir, Staircase Lobby, Balcony).
   - Design styles (Modern, Minimalist, Contemporary, Traditional Indian, Luxury).
   - Finish packages (Basic, Medium, Rich/Premium).
   - Curated architectural color palettes and custom color pickers.
   - Flooring, false ceiling, lighting fixtures, and custom furniture configuration.
   - **ADE20K Scene Understanding**: Upload existing room photos to extract dominant color palettes, detect architectural surfaces, analyze daylight illumination quality, and apply recommendations.
   - **Multi-Alternative Comparison**: Generates multiple design candidates for side-by-side comparison.
   - Save favourites, select final approved concept, and download high-resolution visuals.

4. **AI Exterior Design & Elevation Studio**:
   - Elevation styles (Modern Indian house, Contemporary, Traditional Indian, Minimalist, Premium Luxury).
   - Facade cladding materials (Natural Teak Sandstone, WPC Louvers, Large Porcelain Slabs, Exposed Brickwork, Weatherproof Textured Plaster).
   - Balcony & railing styles (12mm Toughened Glass SS 304, Matte Black MS Louvers, Solid Parapet).
   - Boundary wall & entrance gate concepts (CNC Laser Cut Steel with WPC Inlays, Motorized Teak).
   - Integrated with project plot dimensions and floor plan geometry.
   - Conceptual visualization labeling preserving physical engineering constraints.

5. **Transparent Bill of Quantities (BOQ) & Cost Estimation**:
   - Itemized line items across 28 construction categories including structural materials, finishing, false ceiling, modular kitchen, and exterior finishes.
   - **Synchronized with Interior & Exterior Design Choices**: Changing flooring, false ceiling, or facade cladding automatically updates the project BOQ schedule and budget.
   - Regional rate database for Warangal/Telangana (IS 1200 standards).

6. **3-Tier Package Comparison**:
   - **Basic Tier** (Standard practical finishes, ₹1,550–1,750 / sq.ft).
   - **Medium Tier** (Mid-range premium finishes, ₹1,950–2,250 / sq.ft).
   - **Rich / Premium Tier** (Luxury marble, smart home, veneer woodwork, ₹2,600–3,200 / sq.ft).

7. **Vastu Shastra Expert Engine**:
   - Mathematical coordinate evaluation of rooms against the 8 directional zones (*Ishanya*, *Agneya*, *Niruthi*, *Vayu*, etc.).
   - Compliance scoring (0–100%), detailed conflict explanations, and architectural remedies.

8. **Construction Milestone & Dependency Tracker**:
   - 21 standardized construction stages with topological dependency enforcement.
   - Next eligible task recommendation, stage completion logging, contractor assignments, and photos.

9. **Project Expense & Invoice Tracker**:
   - Logs actual material purchases, labour payments, contractor bills, and invoices.
   - Real-time comparison of estimated vs actual expenditures, budget burn rate, and overrun warnings.

10. **AI Chatbot House Planning Assistant**:
    - Context-aware virtual assistant with access to project accommodation, active floor plans, Vastu scores, and BOQ breakdown.

11. **Comprehensive PDF & Excel Exporters**:
    - Generates downloadable, beautifully styled PDF project portfolios and detailed Excel workbooks.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Axios, Recharts, Lucide Icons.
- **Backend**: Node.js v24, Express.js, MongoDB / Mongoose, JWT Authentication, Multer, bcryptjs, PDFKit, ExcelJS, robust persistent fallback store.
- **AI Service**: Python 3.11, FastAPI, Pydantic, NumPy, Pillow, OpenCV, PyTorch.
- **Datasets**:
  - **ADE20K**: MIT Scene Parsing Benchmark for residential scene understanding, semantic segmentation, and surface element parsing.
  - **CubiCasa5K**: Architectural floor-plan segmentation pipeline.

---

## Environment Variables Configuration

### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@housedesign.zpjq5tj.mongodb.net/houseDesign?retryWrites=true&w=majority&appName=houseDesign
JWT_SECRET=super_secure_jwt_secret_key_house_design_major_project_2026
JWT_EXPIRE=30d
AI_SERVICE_URL=http://127.0.0.1:8000
CLIENT_URL=http://localhost:5173

# AI Image Generation Provider Configuration
# Supported providers: 'pollinations' (keyless direct AI), 'openai', 'stability', 'huggingface', 'fallback'
IMAGE_GENERATION_PROVIDER=pollinations
OPENAI_API_KEY=
STABILITY_API_KEY=
HUGGINGFACE_API_KEY=

# ADE20K Dataset Path (configurable)
ADE20K_DATASET_PATH=../datasets/ade20k
```

### AI Service (`ai-service/.env`):
```env
PORT=8000
HOST=0.0.0.0
CORS_ORIGINS=*
ADE20K_DATASET_PATH=../datasets/ade20k
CUBICASA_DATASET_DIR=../datasets/cubicasa5k/data
MODEL_CHECKPOINT_DIR=../models/checkpoints
```

---

## Quick Start Guide (Windows / PowerShell)

### 1. Launch All Services Simultaneously
You can launch Backend, AI Service, and Frontend with one command:
```powershell
.\start-all.ps1
```
Or via Batch file:
```cmd
start-all.bat
```

### 2. Manual Step-by-Step Setup

#### A. Backend Setup
```powershell
cd backend
npm install
npm run dev
```
*Backend runs on `http://localhost:5000`*

#### B. AI Service Setup (Python)
```powershell
cd ai-service
# Use system python or the included portable python
..\.python\python.exe -m pip install -r requirements.txt
..\.python\python.exe app/main.py
```
*AI Service runs on `http://localhost:8000` (Swagger docs at `/docs`)*

#### C. Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*

---

## Running Automated Test Suites

### Backend Unit & Integration Tests:
```powershell
cd backend
npm test
```

### Full-Stack 10-Step End-to-End Verification:
```powershell
cd backend
node src/tests/e2eVerification.js
```

### ADE20K Dataset Validation:
```powershell
.\.python\python.exe datasets/validate_ade20k.py
```

---

## Default Admin & Demo Credentials
- **Admin Email**: `admin@housedesign.ai`
- **Password**: `Admin@12345`
- **Demo User Email**: `user@housedesign.ai`
- **Password**: `User@12345`
*(Or register any new account freely on the registration page)*
