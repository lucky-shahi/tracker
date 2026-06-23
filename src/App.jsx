import { useEffect, useMemo, useState, useRef } from 'react'
import './App.css'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

const API_BASE_URL = '/api'

const getCurrentMonthKey = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const getDaysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate()
}

const getISODateString = (date) => date.toISOString().slice(0, 10)

function App() {
  const [tasks, setTasks] = useState([])
  const [completions, setCompletions] = useState({})
  const [taskInput, setTaskInput] = useState('')
  const [selectedDate, setSelectedDate] = useState(getISODateString(new Date()))
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dataPath, setDataPath] = useState('')
  const saveTimeoutRef = useRef(null)
  const isInitialLoadRef = useRef(true)

  // Load data from backend API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [dataResponse, infoResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/tracker`),
          fetch(`${API_BASE_URL}/info`),
        ])

        if (!dataResponse.ok) {
          throw new Error('Failed to load tracker data')
        }

        const data = await dataResponse.json()
        const info = await infoResponse.json()

        setTasks(data.tasks || [])
        setCompletions(data.completions || {})
        setMonthKey(data.monthKey || getCurrentMonthKey())
        setDataPath(info.dataPath || '')
        isInitialLoadRef.current = false
      } catch (err) {
        console.error('Error loading data:', err)
        setError(
          `Failed to connect to backend server. Make sure the server is running on port 3001. Error: ${err.message}`
        )
        // Fallback to empty state
        setTasks([])
        setCompletions({})
        setMonthKey(getCurrentMonthKey())
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Save data to backend API (debounced)
  useEffect(() => {
    // Skip save on initial load
    if (isInitialLoadRef.current) return

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // Debounce saves by 500ms
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const data = {
          monthKey,
          tasks,
          completions,
        }
        const response = await fetch(`${API_BASE_URL}/tracker`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        })

        if (!response.ok) {
          throw new Error('Failed to save data')
        }
      } catch (err) {
        console.error('Error saving data:', err)
        setError(`Failed to save data: ${err.message}`)
      }
    }, 500)

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [monthKey, tasks, completions])

  const handleRemoveTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    // Also remove this task's completion flags from all days
    setCompletions((prev) => {
      const updated = {}
      Object.entries(prev).forEach(([date, dayMap]) => {
        if (dayMap[taskId] === undefined) {
          updated[date] = dayMap
        } else {
          const { [taskId]: _removed, ...rest } = dayMap
          updated[date] = rest
        }
      })
      return updated
    })
  }

  const handleAddTask = () => {
    const trimmed = taskInput.trim()
    if (!trimmed) return
    const newTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      name: trimmed,
      createdAt: getISODateString(new Date()),
    }
    setTasks((prev) => [...prev, newTask])
    setTaskInput('')
  }

  const handleToggleTask = (taskId) => {
    setCompletions((prev) => {
      const day = prev[selectedDate] || {}
      const current = !!day[taskId]
      const updatedDay = { ...day, [taskId]: !current }
      return {
        ...prev,
        [selectedDate]: updatedDay,
      }
    })
  }

  const handleResetMonth = () => {
    const currentKey = getCurrentMonthKey()
    // Keep tasks, only clear this month's completion tracking
    setCompletions({})
    setMonthKey(currentKey)
    setSelectedDate(getISODateString(new Date()))
  }

  const [year, month] = useMemo(() => {
    const [y, m] = monthKey.split('-').map(Number)
    return [y, m - 1]
  }, [monthKey])

  const daysInMonth = useMemo(() => getDaysInMonth(year, month), [year, month])

  const chartData = useMemo(() => {
    const result = []
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`
      const dayCompletions = completions[dateStr] || {}
      const completedCount = Object.values(dayCompletions).filter(Boolean).length
      result.push({
        day,
        completed: completedCount,
      })
    }
    return result
  }, [completions, daysInMonth, monthKey])

  const { totalCompleted, totalPossible, completionRate } = useMemo(() => {
    const totalCompletedInner = chartData.reduce((sum, d) => sum + d.completed, 0)
    const totalPossibleInner = tasks.length * daysInMonth
    const rate =
      totalPossibleInner > 0 ? Math.round((totalCompletedInner / totalPossibleInner) * 100) : 0
    return {
      totalCompleted: totalCompletedInner,
      totalPossible: totalPossibleInner,
      completionRate: rate,
    }
  }, [chartData, tasks.length, daysInMonth])

  const handleExportCSV = () => {
    if (!tasks.length) return
    const rows = [['Date', 'Task', 'Completed']]

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthKey}-${String(day).padStart(2, '0')}`
      const dayCompletions = completions[dateStr] || {}
      tasks.forEach((task) => {
        const completed = !!dayCompletions[task.id]
        rows.push([dateStr, task.name, completed ? 'Yes' : 'No'])
      })
    }

    const csvContent = rows
      .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${monthKey}-todo-tracker.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value)
  }

  const today = getISODateString(new Date())
  const minDate = `${monthKey}-01`
  const maxDate = `${monthKey}-${String(daysInMonth).padStart(2, '0')}`

  const dayCompletedCount = useMemo(() => {
    const dayCompletions = completions[selectedDate] || {}
    return Object.values(dayCompletions).filter(Boolean).length
  }, [completions, selectedDate])

  if (loading) {
    return (
      <div className="app">
        <div className="loading-state">Loading tracker data...</div>
      </div>
    )
  }

  return (
    <div className="app">
      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}
      <header className="app-header">
        <div>
          <h1>Monthly To-Do Tracker</h1>
          <p className="subtitle">
            Track your daily task completions across the month. Data is stored in a file on your
            local device.
            {dataPath && (
              <span className="data-path-info" title={dataPath}>
                {' '}
                📁 {dataPath}
              </span>
            )}
          </p>
        </div>
        <div className="header-actions">
          <button className="secondary-button" onClick={handleResetMonth}>
            Reset Month
          </button>
          <button
            className="secondary-button"
            onClick={handleExportCSV}
            disabled={!tasks.length}
          >
            Export CSV
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="panel">
          <h2>Tasks</h2>
          <div className="task-input-row">
            <input
              type="text"
              placeholder="Add a new task (e.g. Exercise, Read, Meditate)"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask()
              }}
            />
            <button className="primary-button" onClick={handleAddTask}>
              Add
            </button>
          </div>

          <div className="date-row">
            <label>
              Day to update:
              <input
                type="date"
                value={selectedDate}
                min={minDate}
                max={maxDate}
                onChange={handleDateChange}
              />
            </label>
            <span className="today-pill">{selectedDate === today ? 'Today' : selectedDate}</span>
          </div>

          {tasks.length === 0 ? (
            <p className="empty-state">
              No tasks yet. Add a few tasks to start tracking your month.
            </p>
          ) : (
            <ul className="task-list">
              {tasks.map((task) => {
                const dayCompletions = completions[selectedDate] || {}
                const checked = !!dayCompletions[task.id]
                return (
                  <li key={task.id} className="task-item">
                    <label className="task-main">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => handleToggleTask(task.id)}
                      />
                      <span className={checked ? 'task-name completed' : 'task-name'}>
                        {task.name}
                      </span>
                    </label>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => handleRemoveTask(task.id)}
                      title="Remove task"
                    >
                      ✕
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          <div className="daily-summary">
            <strong>
              {dayCompletedCount} / {tasks.length || 0}
            </strong>{' '}
            tasks completed for this day.
          </div>
        </section>

        <section className="panel">
          <h2>Monthly Progress</h2>
          <div className="stats-row">
            <div className="stat-card">
              <span className="stat-label">Total completions</span>
              <span className="stat-value">
                {totalCompleted} / {totalPossible || 0}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Monthly completion rate</span>
              <span className="stat-value">{completionRate}%</span>
            </div>
          </div>

          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} />
                <YAxis allowDecimals={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="completed" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-note">
            Each bar shows how many tasks you completed on that day of the month.
          </div>

          <div className="chart-wrapper secondary-chart">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} />
                <YAxis allowDecimals={false} tickLine={false} />
                <Tooltip />
                <Line type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
