import { useEffect, useRef, useState } from 'react'
import { useTasks } from '../hooks/useTasks'
import type { Task } from '../types'
import { TaskPanel } from '../components/kanban/TaskPanel'

type ViewMode = 'Day' | 'Week' | 'Month'

export function GanttPage() {
  const { tasks, clients, projects, updateTask, deleteTask } = useTasks()
  const ganttRef = useRef<HTMLDivElement>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('Week')
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const filtered = selectedClients.length > 0
    ? tasks.filter(t => selectedClients.includes(t.client_id))
    : tasks

  const validTasks = filtered.filter(t => t.due_date)

  useEffect(() => {
    if (!ganttRef.current || validTasks.length === 0) return
    const today = new Date().toISOString().split('T')[0]

    import('frappe-gantt').then(({ default: Gantt }) => {
      const ganttTasks = validTasks.map(t => {
        const client = clients.find(c => c.id === t.client_id)
        const slug = client?.name.toLowerCase().replace(/[^a-z]/g, '').substring(0, 7) || 'personal'
        const start = new Date(new Date(t.due_date!).getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        return { id: t.id, name: t.title, start, end: t.due_date || today, progress: t.progress, custom_class: `gantt-${slug}` }
      })

      if (ganttRef.current) {
        ganttRef.current.innerHTML = ''
        new Gantt(ganttRef.current, ganttTasks, {
          view_mode: viewMode,
          date_format: 'YYYY-MM-DD',
          on_click: (gt: { id: string }) => {
            const found = tasks.find(t => t.id === gt.id)
            if (found) setActiveTask(found)
          },
          on_progress_change: (gt: { id: string }, p: number) => {
            updateTask(gt.id, { progress: Math.round(p) })
          },
        })
      }
    })
  }, [validTasks.length, viewMode, selectedClients])

  const toggleClient = (id: string) =>
    setSelectedClients(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id])

  const VIEW_MODES: ViewMode[] = ['Day', 'Week', 'Month']
  const VIEW_LABELS: Record<ViewMode, string> = { Day: 'Día', Week: 'Semana', Month: 'Mes' }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Gantt</h1>
          <p className="text-sm text-gray-400 mt-0.5">Línea de tiempo de proyectos</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {VIEW_MODES.map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-all ${viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {VIEW_LABELS[mode]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-5">
        <span className="text-xs text-gray-400 font-medium">Filtrar:</span>
        <button onClick={() => setSelectedClients([])}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${selectedClients.length === 0 ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}>
          Todos
        </button>
        {clients.map(c => (
          <button key={c.id} onClick={() => toggleClient(c.id)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${selectedClients.includes(c.id) ? 'text-white border-transparent' : 'bg-white border-gray-200'}`}
            style={selectedClients.includes(c.id) ? { backgroundColor: c.color } : { color: c.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: selectedClients.includes(c.id) ? 'white' : c.color }} />
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-4 mb-4 flex-wrap">
        {clients.map(c => (
          <div key={c.id} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: c.color }} />
            <span className="text-xs text-gray-500">{c.name}</span>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-auto flex-1 p-4">
        {validTasks.length === 0
          ? <div className="flex items-center justify-center h-40 text-gray-400 text-sm">No hay tareas con fecha de vencimiento</div>
          : <div ref={ganttRef} />
        }
      </div>

      <p className="text-xs text-gray-400 mt-3 text-center">Haz clic en una barra para editar · Arrastra el extremo para ajustar fecha</p>

      {activeTask && (
        <TaskPanel task={activeTask} clients={clients} projects={projects}
          onSave={(t) => { updateTask(t.id, t); setActiveTask(null) }}
          onDelete={(id) => { deleteTask(id); setActiveTask(null) }}
          onClose={() => setActiveTask(null)} />
      )}
    </div>
  )
}
