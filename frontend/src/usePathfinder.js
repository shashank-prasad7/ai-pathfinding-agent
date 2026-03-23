import { useState, useRef, useCallback } from 'react'
import { animateSolveResult, clearAnimationTimer, fetchSolve } from './pathfinderRunner'

export const ROWS = 22
export const COLS = 40

export const CELL = {
  EMPTY: 0,
  WALL: 1,
  START: 2,
  END: 3,
  EXPLORED: 4,
  PATH: 5,
}

export function makeGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(CELL.EMPTY))
}

export function usePathfinder() {
  const [grid, setGrid] = useState(() => {
    const g = makeGrid()
    g[5][5] = CELL.START
    g[16][34] = CELL.END
    return g
  })

  const [start, setStart] = useState([5, 5])
  const [end, setEnd] = useState([16, 34])
  const [mode, setMode] = useState('wall')        // wall | erase | start | end
  const [algorithm, setAlgorithm] = useState('astar')
  const [heuristic, setHeuristic] = useState('manhattan')
  const [diagonal, setDiagonal] = useState(false)
  const [speed, setSpeed] = useState(15)          // ms per step
  const [isRunning, setIsRunning] = useState(false)
  const [stats, setStats] = useState(null)
  const [cellInfo, setCellInfo] = useState(null)  // hovered cell f/g/h

  const mouseDown = useRef(false)
  const animRef = useRef(null)
  const detailsRef = useRef([])

  // ── Grid drawing ──────────────────────────────────────────────

  const applyCell = useCallback((r, c, currentGrid) => {
    const g = currentGrid.map(row => [...row])
    if (mode === 'wall' && g[r][c] !== CELL.START && g[r][c] !== CELL.END) {
      g[r][c] = CELL.WALL
    } else if (mode === 'erase' && g[r][c] !== CELL.START && g[r][c] !== CELL.END) {
      g[r][c] = CELL.EMPTY
    } else if (mode === 'start' && g[r][c] !== CELL.END) {
      const [sr, sc] = start
      g[sr][sc] = CELL.EMPTY
      g[r][c] = CELL.START
      setStart([r, c])
    } else if (mode === 'end' && g[r][c] !== CELL.START) {
      const [er, ec] = end
      g[er][ec] = CELL.EMPTY
      g[r][c] = CELL.END
      setEnd([r, c])
    }
    return g
  }, [mode, start, end])

  const handleMouseDown = useCallback((r, c) => {
    mouseDown.current = true
    setGrid(prev => applyCell(r, c, prev))
  }, [applyCell])

  const handleMouseEnter = useCallback((r, c) => {
    if (mouseDown.current) {
      setGrid(prev => applyCell(r, c, prev))
    }
    // Show f/g/h on hover if details exist
    if (detailsRef.current.length > 0) {
      const d = detailsRef.current.find(d => d.node[0] === r && d.node[1] === c)
      setCellInfo(d || null)
    }
  }, [applyCell])

  const handleMouseUp = useCallback(() => { mouseDown.current = false }, [])

  // ── Clear ─────────────────────────────────────────────────────

  const clearPath = useCallback(() => {
    cancelAnimation()
    detailsRef.current = []
    setCellInfo(null)
    setStats(null)
    setGrid(prev => prev.map(row => row.map(cell =>
      cell === CELL.EXPLORED || cell === CELL.PATH ? CELL.EMPTY : cell
    )))
  }, [])

  const clearAll = useCallback(() => {
    cancelAnimation()
    detailsRef.current = []
    setCellInfo(null)
    setStats(null)
    const g = makeGrid()
    g[5][5] = CELL.START
    g[16][34] = CELL.END
    setStart([5, 5])
    setEnd([16, 34])
    setGrid(g)
  }, [])

  const cancelAnimation = () => {
    clearAnimationTimer(animRef)
    setIsRunning(false)
  }

  // ── Generate maze (random walls) ─────────────────────────────

  const generateMaze = useCallback(() => {
    clearPath()
    setGrid(prev => {
      const g = prev.map(row => row.map(cell => {
        if (cell === CELL.START || cell === CELL.END) return cell
        return Math.random() < 0.3 ? CELL.WALL : CELL.EMPTY
      }))
      return g
    })
  }, [clearPath])

  // ── Solve ─────────────────────────────────────────────────────

  const solve = useCallback(async () => {
    clearPath()
    setIsRunning(true)

    // Build plain 0/1 grid for API
    const rawGrid = grid.map(row => row.map(cell =>
      cell === CELL.WALL ? 1 : 0
    ))

    try {
      const data = await fetchSolve({
        grid: rawGrid,
        start,
        end,
        algorithm,
        heuristic,
        allow_diagonal: diagonal,
      })
      detailsRef.current = data.explored_details || []

      setStats({
        nodes_explored: data.nodes_explored,
        path_length: data.path_length,
        time_ms: data.time_ms,
        found: data.found,
        algorithm: data.algorithm,
      })

      animateSolveResult({
        explored: data.explored,
        path: data.path,
        found: data.found,
        speed,
        timerRef: animRef,
        setGrid,
        CELL,
        onDone: () => setIsRunning(false),
      })
    } catch (e) {
      console.error(e)
      setIsRunning(false)
    }
  }, [grid, start, end, algorithm, heuristic, diagonal, clearPath, speed])

  return {
    grid, CELL,
    mode, setMode,
    algorithm, setAlgorithm,
    heuristic, setHeuristic,
    diagonal, setDiagonal,
    speed, setSpeed,
    isRunning, stats, cellInfo,
    handleMouseDown, handleMouseEnter, handleMouseUp,
    solve, clearPath, clearAll, generateMaze,
  }
}
