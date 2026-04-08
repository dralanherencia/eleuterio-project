import { useState, useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import type { Task } from '../types'
import { TaskPanel } from '../components/kanban/TaskPanel'

type ViewMode = 'week' | 'month'

function getDays(mode: ViewMode, offset: number): Date[] {
  const today = new Date()
  const days: Date[] = []
  if (mode === 'week') {
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay() + 1 + offset * 7)
    for (let i = 0; i < 14; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i); days.push(d)
    }
  } else {
    const start = new Date(today.getFullYear(), today.getMonth() + offset, 1)
    const end = new Date(today.getFullYear(), today.getMonth() + offset + 2, 0)
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) days.push(new Date(d))
  }
  return days
}

function fmt(d: Date) { return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' }) }

export function GanttPage() {
  const { tasks, clients, projects, updateTask, deleteTask } = useTasks()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [offset, setOffset] = useState(0)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const days = useMemo(() => getDays(viewMode, offset), [viewMode, offset])
  const startDate = days[0]
  const endDate = days[days.length - 1]

  const filtered = tasks.filter(t => {
    if (!t.due_date) return false
    if (selectedProject && t.project_id !== selectedProject) return false
    if (selectedClient && t.client_id !== selectedClient) return false
    return true
  })

  const getBar = (task: Task) => {
    if (!task.due_date) return null
    const end = new Date(task.due_date)
    const start = task.created_at
      ? new Date(new Date(task.due_date).getTime() - 7 * 24 * 60 * 60 * 1000)
      : new Date(new Date(task.due_date).getTime() - 5 * 24 * 60 * 60 * 1000)

    const rangeMs = endDate.getTime() - startDate.getTime()
    const startPct = Math.max(0, (start.getTime() - startDate.getTime()) / rangeMs * 100)
    const endPct = Math.min(100, (end.getTime() - startDate.getTime()) / rangeMs * 100)
    const width = endPct - startPct
    if (width <= 0) return null
    return { left: startPct, width }
  }

  const todayPct = (() => {
    const rangeMs = endDate.getTime() - startDate.getTime()
    const pct = (new Date().getTime() - startDate.getTime()) / rangeMs * 100
    return Math.max(0, Math.min(100, pct))
  })()

  const LABEL_W = 200

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gantt</h1>
          <p className="text-sm text-gray-400 mt-0.5">Línea de tiempo de proyectos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOffset(o => o - 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
            ‹
          </button>
          <button onClick={() => setOffset(0)}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
            Hoy
          </button>
          <button onClick={() => setOffset(o => o + 1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors">
            ›
          </button>
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 ml-2">
            {(['week', 'month'] as ViewMode[]).map(m => (
              <button key={m} onClick={() => { setViewMode(m); setOffset(0) }}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${viewMode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>
                {m === 'week' ? '2 Semanas' : '2 Meses'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {/* Project filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Proyecto:</span>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400 text-gray-700">
            <option value="">Todos</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {/* Client filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-medium">Cliente:</span>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setSelectedClient('')}
              className={`text-xs px-2.5 py-1.5 rounded-full border transition-all ${!selectedClient ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>
              Todos
            </button>
            {clients.map(c => (
              <button key={c.id} onClick={() => setSelectedClient(selectedClient === c.id ? '' : c.id)}
                className={`text-xs px-2.5 py-1.5 rounded-full border transition-all flex items-center gap-1 ${selectedClient === c.id ? 'text-white border-transparent' : 'bg-white border-gray-200'}`}
                style={selectedClient === c.id ? { backgroundColor: c.color } : { color: c.color }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedClient === c.id ? 'white' : c.color }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gantt chart */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-auto flex-1">
        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
            No hay tareas con fecha de vencimiento en este período
          </div>
        ) : (
          <div style={{ minWidth: LABEL_W + 600 }}>
            {/* Timeline header */}
            <div className="flex border-b border-gray-100 sticky top-0 bg-white z-10">
              <div style={{ width: LABEL_W, minWidth: LABEL_W }}
                className="px-4 py-2.5 text-xs font-medium text-gray-500 border-r border-gray-100 flex-shrink-0">
                Tarea
              </div>
              <div className="flex-1 relative overflow-hidden">
                <div className="flex h-full">
                  {days.filter((_, i) => {
                    if (viewMode === 'week') return true
                    return i % 3 === 0
                  }).map((d, i) => (
                    <div key={i} className="flex-1 text-center py-2.5 text-xs text-gray-400 border-r border-gray-50">
                      {fmt(d)}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rows */}
            {filtered.map(task => {
              const client = clients.find(c => c.id === task.client_id)
              const project = projects.find(p => p.id === task.project_id)
              const bar = getBar(task)
              const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'

              return (
                <div key={task.id} className="flex border-b border-gray-50 hover:bg-gray-50 group transition-colors"
                  style={{ minHeight: 44 }}>
                  {/* Label */}
                  <div style={{ width: LABEL_W, minWidth: LABEL_W }}
                    className="px-4 py-2.5 border-r border-gray-100 flex-shrink-0 flex flex-col justify-center cursor-pointer"
                    onClick={() => setActiveTask(task)}>
                    <div className="text-xs font-medium text-gray-800 truncate leading-tight">{task.title}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {client && (
                        <span className="text-xs truncate" style={{ color: client.color }}>{client.name}</span>
                      )}
                      {project && (
                        <span className="text-xs text-gray-400 truncate">· {project.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Bar area */}
                  <div className="flex-1 relative py-2.5 px-2" onClick={() => setActiveTask(task)}>
                    {/* Today line */}
                    <div className="absolute top-0 bottom-0 w-px bg-blue-400 opacity-40 pointer-events-none z-10"
                      style={{ left: `${todayPct}%` }} />

                    {bar && (
                      <div className="absolute top-2 bottom-2 rounded-md cursor-pointer transition-opacity hover:opacity-90"
                        style={{
                          left: `${bar.left}%`,
                          width: `${bar.width}%`,
                          backgroundColor: client?.color || '#888780',
                          opacity: task.status === 'done' ? 0.5 : 0.85,
                          minWidth: 4,
                        }}>
                        {/* Progress fill */}
                        <div className="h-full rounded-md bg-black opacity-20"
                          style={{ width: `${task.progress}%` }} />
                        {/* Label inside bar */}
                        {bar.width > 8 && (
                          <div className="absolute inset-0 flex items-center px-2">
                            <span className="text-white text-xs font-medium truncate leading-none">
                              {task.progress}%
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Due date badge */}
                    {task.due_date && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${isOverdue ? 'bg-red-50 text-red-500' : 'text-gray-400'}`}>
                          {new Date(task.due_date).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 mt-2 text-center">
        Haz clic en una fila para editar la tarea
      </p>

      {activeTask && (
        <TaskPanel task={activeTask} clients={clients} projects={projects}
          onSave={(t) => { updateTask(t.id, t); setActiveTask(null) }}
          onDelete={(id) => { deleteTask(id); setActiveTask(null) }}
          onClose={() => setActiveTask(null)} />
      )}
    </div>
  )
}
