# Pathfinding Agent — Intelligent Search Visualizer

A* | BFS | Greedy Best First Search | **Algorithm Race Mode**
React + Vite Frontend and FastAPI Python Backend

---

## Project Structure

```
pathfinder/
├── backend/
│   ├── main.py           ← All algorithms + FastAPI routes
│   └── requirements.txt
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx           ← Main UI entry
        ├── App.module.css    ← Integrated styles
        ├── usePathfinder.js  ← Single-mode state logic
        ├── useRacePathfinder.js ← Multi-grid race logic [NEW]
        ├── pathfinderRunner.js  ← Shared animation & API helpers [NEW]
        └── index.css
```

---

## Setup & Run

### 1. Backend (Python / FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Backend runs at → http://localhost:8000  
API docs at    → http://localhost:8000/docs

---

### 2. Frontend (React / Vite)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at → http://localhost:5173

> Both must be running at the same time.

---

## How to Use

1. **Draw walls** — click and drag on the grid.
2. **Move start/end** — switch mode in sidebar, then click a cell.
3. **Choose algorithm** — A*, BFS, or Greedy (in Single mode).
4. **Choose heuristic** — Manhattan or Euclidean.
5. **Switch to RACE Mode** — click the "Race" tab in the sidebar to compare A*, BFS, and Greedy simultaneously side-by-side.
6. **Click Solve / Start Race** — watch the agent search in real time.
7. **Hover explored cells** — see f(n), g(n), h(n) in the Cell Inspector.
8. **🎲 Maze** — generate random wall patterns.
9. **Clear Path** — keep your walls but reset the search animation.
10. **Reset** — full clear of the grid and results.

---

## Algorithms

### A* Search (Informed)
```
f(n) = g(n) + h(n)
g(n) = actual cost from start to n
h(n) = heuristic estimate from n to goal
```
- Uses a min-heap priority queue on f(n)
- Optimal if heuristic is admissible (never overestimates)
- Time/Space: O(b^d)

### BFS (Uninformed)
```
f(n) = depth level, h(n) = 0
```
- FIFO queue, explores level by level
- Guaranteed shortest path in unweighted graphs
- Time: O(b^d), Space: O(b^d)

### Greedy Best First (Informed, not optimal)
```
f(n) = h(n) only
```
- Rushes toward goal using only heuristic
- Fast but not guaranteed to find optimal path
- Ignores g(n) — path cost not considered

---

## Heuristics

| Heuristic   | Formula                           | Admissible? |
|-------------|-----------------------------------|-------------|
| Manhattan   | |dx| + |dy|                       | Yes (4-dir)  |
| Euclidean   | √(dx² + dy²)                      | Yes          |

---

## API

### POST /solve

**Request:**
```json
{
  "grid": [[0,1,0,...], ...],   // 0=open, 1=wall
  "start": [5, 5],
  "end": [16, 34],
  "algorithm": "astar",         // astar | bfs | greedy
  "heuristic": "manhattan",     // manhattan | euclidean
  "allow_diagonal": false
}
```

**Response:**
```json
{
  "explored": [[r,c], ...],
  "explored_details": [{"node":[r,c], "g":1.0, "h":4.0, "f":5.0}],
  "path": [[r,c], ...],
  "found": true,
  "nodes_explored": 142,
  "path_length": 28,
  "time_ms": 1.2,
  "algorithm": "astar"
}
```

---

## Tech Stack

| Layer      | Tech                          |
|------------|-------------------------------|
| Frontend   | React 18, Vite, CSS Modules   |
| Backend    | Python, FastAPI, Uvicorn      |
| Algorithms | Pure Python (heapq, deque)    |
| State      | React hooks (useState, useRef)|
| API comm   | fetch + Vite proxy            |
