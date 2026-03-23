const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

export async function fetchSolve(payload) {
  const res = await fetch(`${BASE_URL}/solve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error(`Solve request failed (${res.status})`)
  }

  return res.json()
}

export function clearAnimationTimer(timerRef) {
  if (timerRef?.current) {
    clearTimeout(timerRef.current)
    timerRef.current = null
  }
}

export function animateSolveResult({
  explored,
  path,
  found,
  speed,
  timerRef,
  setGrid,
  CELL,
  onDone,
}) {
  clearAnimationTimer(timerRef)
  let cancelled = false
  let i = 0

  const step = () => {
    if (cancelled) return

    if (i < explored.length) {
      const [r, c] = explored[i]
      setGrid(prev => {
        const g = prev.map(row => [...row])
        if (g[r][c] !== CELL.START && g[r][c] !== CELL.END) {
          g[r][c] = CELL.EXPLORED
        }
        return g
      })
      i += 1
      timerRef.current = setTimeout(step, speed)
      return
    }

    if (!found) {
      onDone?.()
      return
    }

    let j = 0
    const drawPath = () => {
      if (cancelled) return
      if (j < path.length) {
        const [r, c] = path[j]
        setGrid(prev => {
          const g = prev.map(row => [...row])
          if (g[r][c] !== CELL.START && g[r][c] !== CELL.END) {
            g[r][c] = CELL.PATH
          }
          return g
        })
        j += 1
        timerRef.current = setTimeout(drawPath, speed * 2)
      } else {
        onDone?.()
      }
    }
    drawPath()
  }

  step()

  return () => {
    cancelled = true
    clearAnimationTimer(timerRef)
  }
}
