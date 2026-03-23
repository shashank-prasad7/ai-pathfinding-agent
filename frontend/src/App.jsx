import { usePathfinder } from './usePathfinder'
import { useRacePathfinder } from './useRacePathfinder'
import { useState } from 'react'
import styles from './App.module.css'

// ── Cell color map ───────────────────────────────────────────────
const CELL_CLASS = {
  0: 'empty',
  1: 'wall',
  2: 'start',
  3: 'end',
  4: 'explored',
  5: 'path',
}

const ALGO_LABELS = {
  astar:  { name: 'A* Search',           tag: 'Optimal + Informed' },
  bfs:    { name: 'Breadth First Search', tag: 'Optimal + Uninformed' },
  greedy: { name: 'Greedy Best First',    tag: 'Fast + Not Optimal' },
}

const MODE_BTNS = [
  { id: 'wall',  label: '🧱 Draw Wall' },
  { id: 'erase', label: '🧹 Erase' },
  { id: 'start', label: '🟢 Move Start' },
  { id: 'end',   label: '🔴 Move End' },
]

export default function App() {
  const single = usePathfinder()
  const race = useRacePathfinder()
  const [viewMode, setViewMode] = useState('single')

  const isRace = viewMode === 'race'
  const pf = isRace ? race : single
  const activeAlgo = isRace ? 'astar' : pf.algorithm

  return (
    <div className={styles.app}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Pathfinding Agent</h1>
          <span className={styles.subtitle}>Intelligent Search Visualizer</span>
        </div>
        <div className={styles.algoTag}>
          <span className={styles.algoName}>
            {isRace ? 'Algorithm Race Mode' : ALGO_LABELS[pf.algorithm].name}
          </span>
          <span className={styles.algoBadge}>
            {isRace ? 'A* vs BFS vs Greedy' : ALGO_LABELS[pf.algorithm].tag}
          </span>
        </div>
      </header>

      <div className={styles.layout}>
        {/* ── Sidebar ── */}
        <aside className={styles.sidebar}>
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>View</h3>
            <div className={styles.modeToggle}>
              <button
                className={`${styles.modeToggleBtn} ${!isRace ? styles.activeModeBtn : ''}`}
                onClick={() => setViewMode('single')}
                disabled={pf.isRunning}
              >
                Single
              </button>
              <button
                className={`${styles.modeToggleBtn} ${isRace ? styles.activeModeBtn : ''}`}
                onClick={() => setViewMode('race')}
                disabled={pf.isRunning}
              >
                Race
              </button>
            </div>
          </section>

          {/* Algorithm */}
          {!isRace && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Algorithm</h3>
              <div className={styles.radioGroup}>
                {Object.entries(ALGO_LABELS).map(([id, { name }]) => (
                  <label key={id} className={`${styles.radioBtn} ${pf.algorithm === id ? styles.active : ''}`}>
                    <input type="radio" value={id} checked={pf.algorithm === id}
                      onChange={() => pf.setAlgorithm(id)} hidden />
                    {name}
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Heuristic (hide for BFS) */}
          {(isRace || pf.algorithm !== 'bfs') && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Heuristic h(n)</h3>
              <div className={styles.radioGroup}>
                {['manhattan', 'euclidean'].map(h => (
                  <label key={h} className={`${styles.radioBtn} ${pf.heuristic === h ? styles.active : ''}`}>
                    <input type="radio" value={h} checked={pf.heuristic === h}
                      onChange={() => pf.setHeuristic(h)} hidden />
                    {h === 'manhattan' ? '↕ Manhattan' : '↗ Euclidean'}
                  </label>
                ))}
              </div>
            </section>
          )}

          {/* Drawing mode */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Draw Mode</h3>
            <div className={styles.modeGroup}>
              {MODE_BTNS.map(({ id, label }) => (
                <button key={id}
                  className={`${styles.modeBtn} ${pf.mode === id ? styles.activeModeBtn : ''}`}
                  onClick={() => pf.setMode(id)}>
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Options */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Options</h3>
            <label className={styles.toggle}>
              <input type="checkbox" checked={pf.diagonal}
                onChange={e => pf.setDiagonal(e.target.checked)} />
              <span>Allow Diagonal</span>
            </label>
            <div className={styles.sliderRow}>
              <span>Speed</span>
              <input type="range" min={1} max={100} value={100 - pf.speed + 1}
                onChange={e => pf.setSpeed(100 - parseInt(e.target.value) + 1)} />
              <span>{pf.speed < 10 ? 'Fast' : pf.speed < 40 ? 'Med' : 'Slow'}</span>
            </div>
          </section>

          {/* Actions */}
          <section className={styles.section}>
            <button className={styles.solveBtn}
              onClick={pf.isRunning ? undefined : (isRace ? pf.solveRace : pf.solve)}
              disabled={pf.isRunning}>
              {pf.isRunning ? (isRace ? '⏳ Racing...' : '⏳ Solving...') : (isRace ? '▶ Start Race' : '▶ Solve')}
            </button>
            <div className={styles.actionRow}>
              {isRace && (
                <button className={styles.secondaryBtn} onClick={pf.cancelAnimation}>
                  Stop
                </button>
              )}
              <button className={styles.secondaryBtn} onClick={pf.generateMaze}>🎲 Maze</button>
              <button className={styles.secondaryBtn} onClick={pf.clearPath}>Clear Path</button>
              <button className={styles.dangerBtn} onClick={pf.clearAll}>Reset</button>
            </div>
          </section>

          {/* Stats */}
          {!isRace && pf.stats && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Results</h3>
              <div className={styles.statsGrid}>
                <StatCard label="Nodes Explored" value={pf.stats.nodes_explored} color="cyan" />
                <StatCard label="Path Length" value={pf.stats.path_length || '—'} color="green" />
                <StatCard label="Time (ms)" value={pf.stats.time_ms} color="yellow" />
                <StatCard label="Found" value={pf.stats.found ? 'Yes ✓' : 'No ✗'}
                  color={pf.stats.found ? 'green' : 'red'} />
              </div>
            </section>
          )}

          {isRace && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Race Results</h3>
              <div className={styles.raceStatsList}>
                {race.algorithms.map(algo => (
                  <RaceStatRow
                    key={algo}
                    title={ALGO_LABELS[algo].name}
                    stats={race.statsByAlgo[algo]}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Cell Inspector */}
          {pf.cellInfo && (
            <section className={styles.section}>
              <h3 className={styles.sectionTitle}>Cell Inspector</h3>
              {isRace && (
                <div className={styles.inspectorAlgoLabel}>
                  {ALGO_LABELS[pf.cellInfo.algorithm].name}
                </div>
              )}
              <div className={styles.inspector}>
                <InspRow label="f(n) = g + h" value={pf.cellInfo.f} color="#6366f1" />
                <InspRow label="g(n) actual cost" value={pf.cellInfo.g} color="#10b981" />
                <InspRow label="h(n) heuristic" value={pf.cellInfo.h} color="#f59e0b" />
              </div>
            </section>
          )}

          {/* Legend */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>Legend</h3>
            <div className={styles.legend}>
              <LegendItem color="#10b981" label="Start" />
              <LegendItem color="#ef4444" label="End" />
              <LegendItem color="#1e293b" border label="Empty" />
              <LegendItem color="#334155" label="Wall" />
              <LegendItem color="#1d4ed8" label="Explored" />
              <LegendItem color="#f59e0b" label="Path" />
            </div>
          </section>

        </aside>

        {/* ── Grid ── */}
        <main className={styles.main}>
          {!isRace && (
            <div
              className={styles.grid}
              onMouseLeave={pf.handleMouseUp}
              onMouseUp={pf.handleMouseUp}
            >
              {pf.grid.map((row, r) =>
                row.map((cell, c) => (
                  <div
                    key={`${r}-${c}`}
                    className={`${styles.cell} ${styles[CELL_CLASS[cell]]}`}
                    onMouseDown={() => pf.handleMouseDown(r, c)}
                    onMouseEnter={() => pf.handleMouseEnter(r, c)}
                  />
                ))
              )}
            </div>
          )}

          {isRace && (
            <div className={styles.raceGridWrap} onMouseLeave={pf.handleMouseUp} onMouseUp={pf.handleMouseUp}>
              {race.algorithms.map(algo => (
                <section key={algo} className={styles.racePanel}>
                  <header className={styles.racePanelHeader}>
                    <strong>{ALGO_LABELS[algo].name}</strong>
                    <span>{ALGO_LABELS[algo].tag}</span>
                  </header>
                  <div className={styles.raceGrid}>
                    {race.raceGrids[algo].map((row, r) =>
                      row.map((cell, c) => (
                        <div
                          key={`${algo}-${r}-${c}`}
                          className={`${styles.cell} ${styles[CELL_CLASS[cell]]}`}
                          onMouseDown={() => pf.handleMouseDown(r, c)}
                          onMouseEnter={() => pf.handleRaceMouseEnter(algo, r, c)}
                        />
                      ))
                    )}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Algorithm explainer bar */}
          <div className={styles.explainer}>
            <AlgoExplainer algorithm={activeAlgo} heuristic={pf.heuristic} race={isRace} />
          </div>
        </main>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }) {
  return (
    <div className={styles.statCard} style={{ borderColor: `var(--${color})` }}>
      <span className={styles.statValue} style={{ color: `var(--${color})` }}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

function InspRow({ label, value, color }) {
  return (
    <div className={styles.inspRow}>
      <span style={{ color }}>{label}</span>
      <strong style={{ color }}>{value}</strong>
    </div>
  )
}

function LegendItem({ color, label, border }) {
  return (
    <div className={styles.legendItem}>
      <div className={styles.legendDot}
        style={{ background: color, border: border ? '1px solid #334155' : 'none' }} />
      <span>{label}</span>
    </div>
  )
}

function AlgoExplainer({ algorithm, heuristic, race }) {
  if (race) {
    return (
      <p className={styles.explainerText}>
        Race mode runs A*, BFS, and Greedy simultaneously on the same map. Compare explored nodes,
        final path, and runtime side by side to see the trade-offs between optimality and speed.
      </p>
    )
  }

  const info = {
    astar: `A* evaluates f(n) = g(n) + h(n). g(n) is the actual cost from start. h(n) is the ${heuristic} heuristic estimate to goal. Expands the node with the lowest f — guaranteed optimal if h is admissible.`,
    bfs: `BFS explores all nodes level by level using a FIFO queue. g(n) = depth level, h(n) = 0 (uninformed). Guaranteed to find the shortest path in unweighted graphs. Time & Space: O(b^d).`,
    greedy: `Greedy Best First uses only h(n) — the heuristic — to decide the next node. Fastest but NOT guaranteed optimal. It rushes toward the goal without considering path cost g(n).`,
  }
  return <p className={styles.explainerText}>{info[algorithm]}</p>
}

function RaceStatRow({ title, stats }) {
  return (
    <div className={styles.raceStatRow}>
      <strong>{title}</strong>
      {!stats && <span>Not run yet</span>}
      {stats && (
        <span>
          N:{stats.nodes_explored} | P:{stats.path_length || 0} | T:{stats.time_ms}ms | {stats.found ? 'Found' : 'No Path'}
        </span>
      )}
    </div>
  )
}
