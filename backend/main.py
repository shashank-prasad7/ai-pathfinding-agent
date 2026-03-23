"""
Pathfinding Agent - Backend (FastAPI)
Algorithms: A*, BFS, Greedy Best First Search
Each algorithm returns: explored steps + final path + stats
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import heapq
import time
from collections import deque

app = FastAPI(title="Pathfinding Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─────────────────────────────────────────────
# Request / Response Models
# ─────────────────────────────────────────────

class GridRequest(BaseModel):
    grid: List[List[int]]        # 0 = open, 1 = wall
    start: List[int]             # [row, col]
    end: List[int]               # [row, col]
    algorithm: str               # "astar" | "bfs" | "greedy"
    heuristic: Optional[str] = "manhattan"   # "manhattan" | "euclidean"
    allow_diagonal: Optional[bool] = False

class StepInfo(BaseModel):
    node: List[int]
    g: float
    h: float
    f: float

class PathResponse(BaseModel):
    explored: List[List[int]]          # order nodes were explored
    explored_details: List[StepInfo]   # f/g/h for each explored node
    path: List[List[int]]              # final optimal path
    found: bool
    nodes_explored: int
    path_length: int
    time_ms: float
    algorithm: str

# ─────────────────────────────────────────────
# Heuristics
# ─────────────────────────────────────────────

def manhattan(a, b):
    return abs(a[0] - b[0]) + abs(a[1] - b[1])

def euclidean(a, b):
    return ((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2) ** 0.5

def get_heuristic(name):
    return euclidean if name == "euclidean" else manhattan

# ─────────────────────────────────────────────
# Neighbors
# ─────────────────────────────────────────────

def get_neighbors(node, grid, allow_diagonal=False):
    rows, cols = len(grid), len(grid[0])
    r, c = node
    directions = [(-1,0),(1,0),(0,-1),(0,1)]
    if allow_diagonal:
        directions += [(-1,-1),(-1,1),(1,-1),(1,1)]
    neighbors = []
    for dr, dc in directions:
        nr, nc = r + dr, c + dc
        if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] == 0:
            cost = 1.414 if (dr != 0 and dc != 0) else 1.0
            neighbors.append(([nr, nc], cost))
    return neighbors

# ─────────────────────────────────────────────
# Reconstruct path from parent map
# ─────────────────────────────────────────────

def reconstruct_path(came_from, end):
    path = []
    current = tuple(end)
    while current in came_from:
        path.append(list(current))
        current = came_from[current]
    path.append(list(current))
    path.reverse()
    return path

# ─────────────────────────────────────────────
# A* Algorithm
# ─────────────────────────────────────────────

def astar(grid, start, end, heuristic_fn, allow_diagonal):
    """
    A* Search
    f(n) = g(n) + h(n)
    g(n) = actual cost from start to n
    h(n) = heuristic estimate from n to goal
    Uses a min-heap (priority queue) on f(n)
    """
    start, end = tuple(start), tuple(end)
    
    # Priority queue: (f, g, node)
    open_set = []
    heapq.heappush(open_set, (0, 0, start))
    
    came_from = {}
    g_score = {start: 0}
    h_score = {start: heuristic_fn(start, end)}
    
    explored = []
    explored_details = []
    closed_set = set()

    while open_set:
        f, g, current = heapq.heappop(open_set)

        if current in closed_set:
            continue
        closed_set.add(current)

        h = heuristic_fn(current, end)
        explored.append(list(current))
        explored_details.append(StepInfo(node=list(current), g=round(g, 2), h=round(h, 2), f=round(g+h, 2)))

        if current == end:
            path = reconstruct_path(came_from, end)
            return explored, explored_details, path, True

        for neighbor, cost in get_neighbors(current, grid, allow_diagonal):
            neighbor = tuple(neighbor)
            if neighbor in closed_set:
                continue
            tentative_g = g_score[current] + cost
            if tentative_g < g_score.get(neighbor, float('inf')):
                came_from[neighbor] = current
                g_score[neighbor] = tentative_g
                h_n = heuristic_fn(neighbor, end)
                f_n = tentative_g + h_n
                heapq.heappush(open_set, (f_n, tentative_g, neighbor))

    return explored, explored_details, [], False

# ─────────────────────────────────────────────
# BFS Algorithm
# ─────────────────────────────────────────────

def bfs(grid, start, end, allow_diagonal):
    """
    Breadth First Search
    Explores all nodes at depth d before depth d+1
    Guarantees shortest path (in unweighted graphs)
    g(n) = depth level, h(n) = 0 (uninformed)
    """
    start, end = tuple(start), tuple(end)
    queue = deque([start])
    came_from = {}
    g_score = {start: 0}
    visited = {start}

    explored = []
    explored_details = []

    while queue:
        current = queue.popleft()
        g = g_score[current]
        explored.append(list(current))
        explored_details.append(StepInfo(node=list(current), g=g, h=0, f=g))

        if current == end:
            path = reconstruct_path(came_from, end)
            return explored, explored_details, path, True

        for neighbor, _ in get_neighbors(current, grid, allow_diagonal):
            neighbor = tuple(neighbor)
            if neighbor not in visited:
                visited.add(neighbor)
                came_from[neighbor] = current
                g_score[neighbor] = g + 1
                queue.append(neighbor)

    return explored, explored_details, [], False

# ─────────────────────────────────────────────
# Greedy Best First Search
# ─────────────────────────────────────────────

def greedy(grid, start, end, heuristic_fn, allow_diagonal):
    """
    Greedy Best First Search
    f(n) = h(n) only — purely heuristic-driven
    Fast but NOT guaranteed to find optimal path
    Contrast with A* which adds g(n) for optimality
    """
    start, end = tuple(start), tuple(end)
    open_set = []
    heapq.heappush(open_set, (heuristic_fn(start, end), start))
    came_from = {}
    visited = {start}

    explored = []
    explored_details = []

    while open_set:
        h, current = heapq.heappop(open_set)
        explored.append(list(current))
        explored_details.append(StepInfo(node=list(current), g=0, h=round(h, 2), f=round(h, 2)))

        if current == end:
            path = reconstruct_path(came_from, end)
            return explored, explored_details, path, True

        for neighbor, _ in get_neighbors(current, grid, allow_diagonal):
            neighbor = tuple(neighbor)
            if neighbor not in visited:
                visited.add(neighbor)
                came_from[neighbor] = current
                h_n = heuristic_fn(neighbor, end)
                heapq.heappush(open_set, (h_n, neighbor))

    return explored, explored_details, [], False

# ─────────────────────────────────────────────
# Main API Endpoint
# ─────────────────────────────────────────────

@app.post("/solve", response_model=PathResponse)
def solve(req: GridRequest):
    h_fn = get_heuristic(req.heuristic or "manhattan")
    start_time = time.time()

    if req.algorithm == "astar":
        explored, details, path, found = astar(req.grid, req.start, req.end, h_fn, req.allow_diagonal)
    elif req.algorithm == "bfs":
        explored, details, path, found = bfs(req.grid, req.start, req.end, req.allow_diagonal)
    elif req.algorithm == "greedy":
        explored, details, path, found = greedy(req.grid, req.start, req.end, h_fn, req.allow_diagonal)
    else:
        explored, details, path, found = astar(req.grid, req.start, req.end, h_fn, req.allow_diagonal)

    elapsed = round((time.time() - start_time) * 1000, 2)

    return PathResponse(
        explored=explored,
        explored_details=details,
        path=path,
        found=found,
        nodes_explored=len(explored),
        path_length=len(path),
        time_ms=elapsed,
        algorithm=req.algorithm,
    )

@app.get("/")
def root():
    return {"message": "Pathfinding Agent API is running"}
