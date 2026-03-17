# Pathfinding Agent — Intelligent Search Visualizer

A* | BFS | Greedy Best First Search  
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
        ├── App.jsx           ← Full UI
        ├── App.module.css    ← All styles
        ├── usePathfinder.js  ← Grid state + animation logic
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

1. **Draw walls** — click and drag on the grid
2. **Move start/end** — switch mode in sidebar, then click a cell
3. **Choose algorithm** — A*, BFS, or Greedy Best First
4. **Choose heuristic** — Manhattan or Euclidean (for A* and Greedy)
5. **Click Solve** — watch the agent search in real time
6. **Hover explored cells** — see f(n), g(n), h(n) in Cell Inspector
7. **🎲 Maze** — generate random walls
8. **Clear Path** — keep walls, reset animation
9. **Reset** — full clear

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
