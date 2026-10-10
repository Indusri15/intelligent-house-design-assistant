# API Documentation

This document describes all REST API endpoints provided by the Node.js Express backend and Python FastAPI AI Service.

---

## Authentication Endpoints (`/api/auth`)

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new user account (`name`, `email`, `password`) | No |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile and roles | Yes |

---

## Project Endpoints (`/api/projects`)

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/projects` | List all projects belonging to the logged-in user | Yes |
| `POST` | `/api/projects` | Create a new house design project with wizard data | Yes |
| `GET` | `/api/projects/:id` | Get full project details by ID | Yes |
| `PUT` | `/api/projects/:id` | Update project parameters, accommodation, or styles | Yes |
| `DELETE` | `/api/projects/:id` | Delete project and associated records | Yes |

---

## Floor Plan Endpoints (`/api/floor-plans`)

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/floor-plans/generate/:projectId` | Generate geometric floor plans (multiple alternatives) | Yes |
| `GET` | `/api/floor-plans/:projectId` | Fetch current and alternative floor-plan layouts | Yes |
| `POST` | `/api/floor-plans/select/:projectId` | Select and set the primary layout candidate | Yes |
| `POST` | `/api/floor-plans/save-revision/:projectId` | Commit a layout revision to project history | Yes |

---

## Vastu Analysis Endpoints (`/api/vastu`)

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/vastu/:projectId` | Get Vastu compliance report for active floor plan | Yes |
| `POST` | `/api/vastu/evaluate/:projectId` | Run Vastu evaluation rule catalogue against layout | Yes |

---

## Estimation & BOQ Endpoints (`/api/estimation`)

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/estimation/:projectId` | Get detailed BOQ line items and cost breakdown | Yes |
| `POST` | `/api/estimation/recalculate/:projectId` | Recalculate BOQ based on updated dimensions or package | Yes |
| `GET` | `/api/estimation/packages/:projectId` | Retrieve 3-tier package comparison (Basic, Medium, Rich) | Yes |
| `POST` | `/api/estimation/select-package/:projectId` | Select active package tier for project | Yes |
| `GET` | `/api/estimation/rates` | List material and labour regional rate catalogue | Yes |
| `PUT` | `/api/estimation/rates` | Admin: update unit rates for materials or labour | Yes (Admin) |

---

## Construction Progress Endpoints (`/api/progress`)

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/progress/:projectId` | Retrieve all 21 construction stages with dependency graph | Yes |
| `PUT` | `/api/progress/:projectId/stages/:stageId` | Update stage status, progress %, contractor, notes | Yes |
| `POST` | `/api/progress/:projectId/stages/:stageId/complete`| Mark stage complete, recalculate overall progress & eligible next tasks | Yes |
| `POST` | `/api/progress/:projectId/stages/:stageId/exception`| Record justified dependency override exception | Yes |

---

## Expense Tracker Endpoints (`/api/expenses`)

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/expenses/:projectId` | List all logged expenses, summaries, and budget variance | Yes |
| `POST` | `/api/expenses/:projectId` | Log a new material or labour expenditure | Yes |
| `PUT` | `/api/expenses/:projectId/:expenseId` | Update an existing expense entry | Yes |
| `DELETE` | `/api/expenses/:projectId/:expenseId` | Delete or void an expense record | Yes |

---

## Report & Document Endpoints (`/api/reports`)

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/reports/:projectId/pdf` | Generate and download comprehensive architectural project PDF | Yes |
| `GET` | `/api/reports/:projectId/excel` | Generate and download project BOQ & progress Excel workbook | Yes |

---

## AI Assistant Chatbot Endpoints (`/api/chatbot`)

| Method | Route | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/chatbot/message` | Query the context-aware house planning assistant | Yes |

---

## AI Service Endpoints (FastAPI `:8000`)

| Method | Route | Description |
|---|---|---|
| `GET` | `/health` | AI service health check and active model status |
| `POST` | `/api/ai/generate-layout` | Geometric constraint solver for 2D room layouts |
| `POST` | `/api/ai/evaluate-vastu` | Rule-based Vastu orientation matrix analyzer |
| `POST` | `/api/ai/analyze-site-image`| Computer vision site survey perspective & boundary detector |
| `POST` | `/api/ai/segment-floorplan` | CubiCasa5K trained neural floorplan segmentor inference |
