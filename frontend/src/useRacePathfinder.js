import { useCallback, useRef, useState } from 'react'
import { animateSolveResult, clearAnimationTimer, fetchSolve } from './pathfinderRunner'
import { CELL, makeGrid } from './usePathfinder'

const RACE_ALGOS = ['astar', 'bfs', 'greedy']

function cloneGrid(grid) {
  return grid.map(row => [...row])
}

function clearPathMarks(grid) {
  return grid.map(row => row.map(cell => (
    cell === CELL.EXPLORED || cell === CELL.PATH ? CELL.EMPTY : cell
  )))
}

function buildRawGrid(grid) {
  return grid.map(row => row.map(cell => (cell === CELL.WALL ? 1 : 0)))
}

function makeInitialGrid() {
  const g = makeGrid()
  g[5][5] = CELL.START
  g[16][34] = CELL.END
  return g
}

function makeRunnerGrids(baseGrid) {
  return RACE_ALGOS.reduce((acc, algo) => {
    acc[algo] = cloneGrid(baseGrid)
    return acc
  }, {})
}

function makeRunnerStats() {
  return RACE_ALGOS.reduce((acc, algo) => {
    acc[algo] = null
    return acc
  }, {})
}

export function useRacePathfinder() {
  const [editorGrid, setEditorGrid] = useState(() => makeInitialGrid())
  const [raceGrids, setRaceGrids] = useState(() => makeRunnerGrids(makeInitialGrid()))
  const [start, setStart] = useState([5, 5])
  const [end, setEnd] = useState([16, 34])
  const [mode, setMode] = useState('wall')
  const [heuristic, setHeuristic] = useState('manhattan')
  const [diagonal, setDiagonal] = useState(false)
  const [speed, setSpeed] = useState(15)
  const [isRunning, setIsRunning] = useState(false)
  const [statsByAlgo, setStatsByAlgo] = useState(() => makeRunnerStats())
  const [cellInfo, setCellInfo] = useState(null)

  const mouseDown = useRef(false)
  const animRefs = useRef({
    astar: { current: null },
    bfs: { current: null },
    greedy: { current: null },
  })
  const detailsRefs = useRef({
    astar: [],
    bfs: [],
    greedy: [],
  })
  const completionCount = useRef(0)

  const syncRaceGridsFromEditor = useCallback((nextGrid) => {
    const base = clearPathMarks(nextGrid)
    setRaceGrids(makeRunnerGrids(base))
  }, [])

  const applyCell = useCallback((r, c, currentGrid) => {
    const g = cloneGrid(currentGrid)

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
  }, [end, mode, start])

  const cancelAnimation = useCallback(() => {
    RACE_ALGOS.forEach((algo) => clearAnimationTimer(animRefs.current[algo]))
    setIsRunning(false)
  }, [])

  const clearPath = useCallback(() => {
    cancelAnimation()
    detailsRefs.current = { astar: [], bfs: [], greedy: [] }
    setStatsByAlgo(makeRunnerStats())
    setCellInfo(null)
    setRaceGrids(prev => {
      const next = {}
      RACE_ALGOS.forEach(algo => {
        next[algo] = clearPathMarks(prev[algo])
      })
      return next
    })
  }, [cancelAnimation])

  const clearAll = useCallback(() => {
    cancelAnimation()
    detailsRefs.current = { astar: [], bfs: [], greedy: [] }
    setStatsByAlgo(makeRunnerStats())
    setCellInfo(null)
    const g = makeInitialGrid()
    setStart([5, 5])
    setEnd([16, 34])
    setEditorGrid(g)
    setRaceGrids(makeRunnerGrids(g))
  }, [cancelAnimation])

  const generateMaze = useCallback(() => {
    clearPath()
    const g = cloneGrid(editorGrid).map(row => row.map(cell => {
      if (cell === CELL.START || cell === CELL.END) return cell
      return Math.random() < 0.3 ? CELL.WALL : CELL.EMPTY
    }))
    setEditorGrid(g)
    syncRaceGridsFromEditor(g)
  }, [clearPath, editorGrid, syncRaceGridsFromEditor])

  const handleMouseDown = useCallback((r, c) => {
    if (isRunning) return
    mouseDown.current = true
    setEditorGrid(prev => {
      const nextGrid = applyCell(r, c, prev)
      syncRaceGridsFromEditor(nextGrid)
      return nextGrid
    })
  }, [applyCell, isRunning, syncRaceGridsFromEditor])

  const handleRaceMouseEnter = useCallback((algo, r, c) => {
    if (mouseDown.current && !isRunning) {
      setEditorGrid(prev => {
        const nextGrid = applyCell(r, c, prev)
        syncRaceGridsFromEditor(nextGrid)
        return nextGrid
      })
    }

    const detail = detailsRefs.current[algo].find(d => d.node[0] === r && d.node[1] === c)
    setCellInfo(detail ? { ...detail, algorithm: algo } : null)
  }, [applyCell, isRunning, syncRaceGridsFromEditor])

  const handleMouseUp = useCallback(() => {
    mouseDown.current = false
  }, [])

  const solveRace = useCallback(async () => {
    clearPath()
    setIsRunning(true)
    completionCount.current = 0

    const base = clearPathMarks(editorGrid)
    setRaceGrids(makeRunnerGrids(base))

    const payloadBase = {
      grid: buildRawGrid(base),
      start,
      end,
      heuristic,
      allow_diagonal: diagonal,
    }

    try {
      const responses = await Promise.all(
        RACE_ALGOS.map(algo => fetchSolve({
          ...payloadBase,
          algorithm: algo,
        }))
      )

      const stats = {}
      responses.forEach((data, index) => {
        const algo = RACE_ALGOS[index]
        detailsRefs.current[algo] = data.explored_details || []
        stats[algo] = {
          nodes_explored: data.nodes_explored,
          path_length: data.path_length,
          time_ms: data.time_ms,
          found: data.found,
          algorithm: data.algorithm,
        }
      })
      setStatsByAlgo(stats)

      responses.forEach((data, index) => {
        const algo = RACE_ALGOS[index]
        animateSolveResult({
          explored: data.explored,
          path: data.path,
          found: data.found,
          speed,
          timerRef: animRefs.current[algo],
          setGrid: (updater) => {
            setRaceGrids(prev => ({
              ...prev,
              [algo]: updater(prev[algo]),
            }))
          },
          CELL,
          onDone: () => {
            completionCount.current += 1
            if (completionCount.current >= RACE_ALGOS.length) {
              setIsRunning(false)
            }
          },
        })
      })
    } catch (e) {
      console.error(e)
      setIsRunning(false)
    }
  }, [clearPath, diagonal, editorGrid, end, heuristic, speed, start])

  return {
    CELL,
    algorithms: RACE_ALGOS,
    raceGrids,
    mode,
    setMode,
    heuristic,
    setHeuristic,
    diagonal,
    setDiagonal,
    speed,
    setSpeed,
    isRunning,
    statsByAlgo,
    cellInfo,
    handleMouseDown,
    handleRaceMouseEnter,
    handleMouseUp,
    solveRace,
    clearPath,
    clearAll,
    generateMaze,
    cancelAnimation,
  }
}
