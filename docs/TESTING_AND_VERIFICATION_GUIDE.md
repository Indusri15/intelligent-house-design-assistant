# Testing and Verification Guide

## Purpose
This document provides guidelines for running unit tests, integration tests, mathematical validation tests, and full-stack end-to-end verification.

---

## Test Suites

### 1. Geometric Floor-Plan Engine Tests (`backend/src/tests/geometry.test.js`)
- **Boundary Containment**: Validates that all allocated rooms strictly fit inside the computed plot building footprint (accounting for setbacks).
- **Non-Overlap Invariant**: Evaluates intersection of bounding boxes and polygon unions to guarantee zero room overlaps ($A \cap B = \emptyset$).
- **Multi-Floor Vertical Continuity**: Asserts staircase alignment between Ground Floor ($Z=0$) and First Floor ($Z=1$).
- **Requested Room Count**: Verifies that generated room counts match requested accommodations.

### 2. Vastu Shastra Orientation Tests (`backend/src/tests/vastu.test.js`)
- Tests compliance scoring for North, South, East, and West facing plots.
- Validates that Kitchen placement in South-East yields maximum score (100%), and North-East triggers high priority conflict.
- Verifies that Master Bedroom in South-West yields optimal rating.

### 3. Bill of Quantities (BOQ) Mathematical Tests (`backend/src/tests/boq.test.js`)
- Verifies that steel quantities match the structural benchmark of ~3.8 kg/sq.ft ($\pm 10\%$).
- Asserts that cement bag count matches $\approx 0.42$ bags/sq.ft.
- Validates tile calculations: $(\text{Net Area} \times (1 + \text{Wastage})) \times \text{Material Rate} + \text{Net Area} \times \text{Labour Rate}$.
- Verifies that package tiers satisfy $\text{Basic Cost} < \text{Medium Cost} < \text{Rich Cost}$.

### 4. Construction Stage Dependency Tests (`backend/src/tests/dependency.test.js`)
- Asserts that Plastering stage cannot be marked "Completed" if Brickwork is "Not Started" (unless an authorized exception note is recorded).
- Asserts that Foundation completion unlocks Structural Frame stage.
- Asserts that overall project progress recalculates dynamically.

---

## Running the Automated Tests

### Backend Unit Tests
```powershell
cd backend
npm test
```

### Full-Stack Verification Workflow
1. Start backend: `npm run dev` in `backend/`
2. Start AI service: `python app/main.py` in `ai-service/`
3. Start frontend: `npm run dev` in `frontend/`
4. Register a user at `http://localhost:5173/register`
5. Complete the 6-Step Project Wizard.
6. Verify interactive SVG floor plan generation, 3-tier package comparison, Vastu compass, progress updates, expense logging, and PDF/Excel report downloads.
