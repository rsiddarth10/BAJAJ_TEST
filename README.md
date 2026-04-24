# 🌳 BFHL Architecture Parser

> **SRM Full Stack Engineering Challenge — Round 1**  
> REST API + React Frontend for processing hierarchical node relationships

---

## 📋 Overview

A production-grade full-stack application that:
- Accepts an array of node strings (e.g. `"A->B"`, `"X->Y"`)
- Processes hierarchical relationships, detects cycles, and resolves multi-parent conflicts
- Returns structured tree insights with depth calculations and summary statistics
- Visualizes results through an interactive React frontend

---

## 🏗️ Project Structure

```
├── backend/
│   ├── index.js                       # Express app (CORS, morgan, rate-limit, Swagger)
│   ├── routes/bfhlRoutes.js           # POST /bfhl route definition
│   ├── controllers/bfhlController.js  # Request orchestration + identity fields
│   ├── services/graphService.js       # Core graph logic (DFS cycle detection, tree builder)
│   ├── utils/validators.js            # Input validation (regex, self-loop, payload checks)
│   ├── middleware/errorHandler.js      # Centralized 404/500 error handling
│   └── tests/bfhl.test.js             # Jest + Supertest (13 test cases)
│
├── frontend/
│   ├── src/App.jsx                    # React UI with recursive tree visualization
│   └── src/index.css                  # Dark-mode responsive styling
│
└── README.md
```

---

## 🚀 Quick Start

### Backend
```bash
cd backend
npm install
npm start         # Starts on http://localhost:3000
npm test          # Runs 13 automated tests
```

### Frontend
```bash
cd frontend
npm install
npm run dev       # Starts on http://localhost:5173
```

---

## 🔌 API Documentation

### `POST /bfhl`

Interactive Swagger documentation available at `/api-docs` when the server is running.

**Request:**
```json
{
  "data": [
    "A->B", "A->C", "B->D", "C->E", "E->F",
    "X->Y", "Y->Z", "Z->X",
    "P->Q", "Q->R",
    "G->H", "G->H", "G->I",
    "hello", "1->2", "A->"
  ]
}
```

**Response:**
```json
{
  "user_id": "peddireddirajeevsiddarth_16062005",
  "email_id": "rs6820@srmist.edu.in",
  "college_roll_number": "RA2311003010860",
  "hierarchies": [
    {
      "root": "A",
      "tree": { "A": { "B": { "D": {} }, "C": { "E": { "F": {} } } } },
      "depth": 4
    },
    {
      "root": "X",
      "tree": {},
      "has_cycle": true
    },
    {
      "root": "P",
      "tree": { "P": { "Q": { "R": {} } } },
      "depth": 3
    },
    {
      "root": "G",
      "tree": { "G": { "H": {}, "I": {} } },
      "depth": 2
    }
  ],
  "invalid_entries": ["hello", "1->2", "A->"],
  "duplicate_edges": ["G->H"],
  "summary": {
    "total_trees": 3,
    "total_cycles": 1,
    "largest_tree_root": "A"
  }
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | string | Format: `fullname_ddmmyyyy` |
| `email_id` | string | College email address |
| `college_roll_number` | string | College roll number |
| `hierarchies` | array | Array of hierarchy objects |
| `invalid_entries` | string[] | Entries that failed validation |
| `duplicate_edges` | string[] | Repeated edges (listed once each) |
| `summary` | object | `total_trees`, `total_cycles`, `largest_tree_root` |

---

## ⚙️ Processing Rules

### Input Validation
- Valid format: `X->Y` where X and Y are single uppercase letters (A–Z)
- Self-loops (`A->A`) are treated as invalid
- Whitespace is trimmed before validation
- Max input: 50 entries

### Duplicate Handling
- First occurrence used for tree construction
- Subsequent duplicates pushed to `duplicate_edges` **once**, regardless of repeat count

### Multi-Parent Resolution
- If a child has multiple parents, the first-encountered parent wins
- Subsequent parent edges are silently discarded

### Cycle Detection
- Uses **DFS white-gray-black** algorithm to detect back-edges
- Cyclic groups return `has_cycle: true`, `tree: {}`, and no `depth` field
- Non-cyclic trees omit `has_cycle` entirely

### Depth & Tie-Breaking
- Depth = node count on the longest root-to-leaf path
- `largest_tree_root` tie-break: lexicographically smaller root wins

---

## 🧪 Test Coverage

13 automated tests covering:

| # | Test Case | Status |
|---|-----------|--------|
| 1 | Valid single tree | ✅ |
| 2 | Duplicate edges (pushed once only) | ✅ |
| 3 | Invalid entries (7 types) | ✅ |
| 4 | Self-loop rejection | ✅ |
| 5 | Pure cycle detection | ✅ |
| 6 | Multi-parent (first parent wins) | ✅ |
| 7 | Tie-break (equal depth → smaller root) | ✅ |
| 8 | Whitespace trimming | ✅ |
| 9 | Missing `data` field → 400 | ✅ |
| 10 | Non-array `data` → 400 | ✅ |
| 11 | Full PDF example | ✅ |
| 12 | GET /bfhl → 404 | ✅ |
| 13 | Unknown route → 404 | ✅ |

---

## 📊 Complexity Analysis

| Operation | Time Complexity |
|-----------|----------------|
| Input validation & dedup | O(N) |
| Graph construction | O(N) |
| Connected components (BFS) | O(V + E) |
| DFS cycle detection | O(V + E) |
| Tree construction | O(V) |
| Depth calculation | O(V) |
| **Overall** | **O(V + E)** |

Responds in **< 3 seconds** for inputs up to 50 nodes.

---

## 🛡️ Production Features

- **CORS** enabled for cross-origin evaluator access
- **Rate limiting** (100 req / 15 min per IP)
- **Request logging** via morgan
- **Input size validation** (max 50 entries, 10kb body limit)
- **Centralized error handling** (404 fallback + 500 handler)
- **Swagger API docs** at `/api-docs`

---

## 🌐 Deployment

### Backend → Render
- Root Directory: `backend`
- Build Command: `npm install`
- Start Command: `node index.js`

### Frontend → Vercel
- Root Directory: `frontend`
- Framework: Vite
- Update API URL in `App.jsx` before deploying

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express 5 |
| Frontend | React 19, Vite |
| Testing | Jest, Supertest |
| Docs | Swagger UI (CDN) |
| Styling | Vanilla CSS (dark mode) |
