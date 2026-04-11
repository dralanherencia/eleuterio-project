import { useState, useRef } from 'react'
import type { Task, Status, Client, Project } from '../../types'
import { STATUS_LABELS, PRIORITY_COLORS } from '../../types'
import { TaskPanel } from './TaskPanel'
import { ConfettiCanvas, CompletionToast, updateStreakOnCompletion } from '../../Celebration'
import type { StreakData, WeeklyData } from '../../Celebration'

const STATUS_ORDER: Status[] = ['pending', 'in_progress', 'review', 'done']

const STATUS_CONFIG: Record<Status, { color: string; bg: string }> = {
  pending:     { color: '#888780', bg: '#F5F5F4' },
  in_progress: { color: '#378ADD', bg: '#EFF6FF' },
  review:      { color: '#EF9F27', bg: '#FFFBEB' },
  done:        { color: '#1D9E75', bg: '#F0FDF4' },
}

interface Props {
  tasks: Task[]
  clients: Client[]
  projects: Project[]
  defaultAssignee: 'alan' | 'mercedes'
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  onCreateTask: (task: Omit<Task, 'id' | 'created_at'>) => void
  onDeleteTask: (id: string) => void
}

export function TableView({ tasks, clients, projects, defaultAssignee, onUpdateTask, onCreateTask, onDeleteTask }: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const titleInputRef = useRef<HTMLInputElement>(null)

  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [toastStreak, setToastStreak] = useState<StreakData>({ currentStreak: 0, lastCompletionDate: '', bestStreak: 0, totalCompleted: 0 })
  const [toastWeekly, setToastWeekly] = useState<WeeklyData>({ weekStart: '', completed: 0, goal: 10 })

  const triggerCelebration = () => {
    const { streak, weekly } = updateStreakOnCompletion()
    setToastStreak(streak)
    setToastWeekly(weekly)
    setConfettiTrigger(prev => prev + 1)
    setShowToast(false)
    setTimeout(() => setShowToast(true), 50)
  }

  const handleStatusChange = (task: Task, newStatus: Status) => {
    const wasNotDone = task.status !== 'done'
    onUpdateTask(task.id, { status: newStatus })
    if (wasNotDone && newStatus === 'done') triggerCelebration()
  }

  const handleDateChange = (task: Task, date: string) => {
    onUpdateTask(task.id, { due_date: date || null })
  }

  const startEditTitle = (task: Task) => {
    setEditingId(task.id)
    setEditingTitle(task.title)
    setTimeout(() => titleInputRef.current?.focus(), 30)
  }

  const commitTitle = (task: Task) => {
    if (editingTitle.trim() && editingTitle.trim() !== task.title) {
      onUpdateTask(task.id, { title: editingTitle.trim() })
    }
    setEditingId(null)
  }

  const handleSavePanel = (task: Task) => {
    if (isNew) {
      const { id: _id, ...rest } = task
      onCreateTask({ ...rest })
    } else {
      const original = tasks.find(t => t.id === task.id)
      if (original && original.status !== 'done' && task.status === 'done') {
        triggerCelebration()
      }
      onUpdateTask(task.id, task)
    }
    setActiveTask(null)
  }

  const handleNewTask = () => {
    const blankTask: Task = {
      id: '__new__',
      title: '',
      client_id: clients[0]?.id || '',
      project_id: null,
      status: 'pending',
      progress: 0,
      due_date: null,
      next_step: null,
      notes: null,
      file_url: null,
      priority: 'medium',
      assignee: defaultAssignee,
      position: 0,
    }
    setIsNew(true)
    setActiveTask(blankTask)
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })

  const grouped = STATUS_ORDER
    .map(status => ({
      status,
      rows: tasks.filter(t => t.status === status).sort((a, b) => a.position - b.position),
    }))
    .filter(g => g.rows.length > 0)

  return (
    <>
      <ConfettiCanvas trigger={confettiTrigger} />
      <CompletionToast show={showToast} streak={toastStreak} weekly={toastWeekly} />

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{tasks.length} tareas</span>
        <button
          onClick={handleNewTask}
          className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          Nueva tarea
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[3px_24px_1fr_120px_90px_32px] gap-0 items-center px-3 py-2 border-b border-gray-100 bg-gray-50">
          <div />
          <div />
          <div className="text-xs font-medium text-gray-400 pl-1">Tarea</div>
          <div className="text-xs font-medium text-gray-400 text-center">Estado</div>
          <div className="text-xs font-medium text-gray-400 text-center">Vence</div>
          <div />
        </div>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-20 text-sm text-gray-300">
            Sin tareas en esta vista
          </div>
        )}

        {grouped.map(({ status, rows }) => {
          const sc = STATUS_CONFIG[status]
          return (
            <div key={status}>
              {/* Status group header */}
              <div className="flex items-center gap-2 px-4 py-1.5 border-b border-gray-50 bg-gray-50/60">
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sc.color }} />
                <span className="text-xs font-semibold" style={{ color: sc.color }}>{STATUS_LABELS[status]}</span>
                <span className="text-xs text-gray-300 font-medium">{rows.length}</span>
              </div>

              {rows.map(task => {
                const client = clients.find(c => c.id === task.client_id)
                const pc = PRIORITY_COLORS[task.priority || 'medium']
                const isEditing = editingId === task.id
                const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
                const isDueSoon = task.due_date && !isOverdue && task.status !== 'done' &&
                  (new Date(task.due_date).getTime() - Date.now()) < 1000 * 60 * 60 * 24 * 3

                return (
                  <div
                    key={task.id}
                    className="grid grid-cols-[3px_24px_1fr_120px_90px_32px] gap-0 items-center border-b border-gray-50 hover:bg-gray-50/50 group transition-colors"
                    style={{ minHeight: '40px' }}
                  >
                    {/* Priority border */}
                    <div className="self-stretch w-[3px] rounded-r-sm" style={{ backgroundColor: pc.border }} />

                    {/* Client dot */}
                    <div className="flex items-center justify-center">
                      {client && (
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: client.color }} />
                      )}
                    </div>

                    {/* Title — inline editable */}
                    <div className="px-2 py-1 min-w-0">
                      {isEditing ? (
                        <input
                          ref={titleInputRef}
                          value={editingTitle}
                          onChange={e => setEditingTitle(e.target.value)}
                          onBlur={() => commitTitle(task)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitTitle(task)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          className="w-full text-sm text-gray-900 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      ) : (
                        <span
                          onClick={() => startEditTitle(task)}
                          className="text-sm text-gray-800 truncate block cursor-text hover:text-blue-600 transition-colors"
                          title={task.title}
                        >
                          {task.title || <span className="text-gray-300 italic">Sin título</span>}
                        </span>
                      )}
                    </div>

                    {/* Status select */}
                    <div className="px-1">
                      <select
                        value={task.status}
                        onChange={e => handleStatusChange(task, e.target.value as Status)}
                        className="w-full text-xs rounded-lg px-2 py-1 border-0 font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors"
                        style={{ backgroundColor: sc.bg, color: sc.color }}
                      >
                        {STATUS_ORDER.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>

                    {/* Due date */}
                    <div className="px-1">
                      <input
                        type="date"
                        value={task.due_date || ''}
                        onChange={e => handleDateChange(task, e.target.value)}
                        className={`w-full text-xs rounded-lg px-1.5 py-1 border-0 text-center focus:outline-none focus:ring-1 focus:ring-blue-400 transition-colors ${
                          isOverdue ? 'bg-red-50 text-red-500' :
                          isDueSoon ? 'bg-amber-50 text-amber-600' :
                          task.due_date ? 'text-gray-600' : 'text-gray-300'
                        }`}
                        title={task.due_date ? formatDate(task.due_date) : 'Sin fecha'}
                      />
                    </div>

                    {/* Open panel button */}
                    <div className="flex items-center justify-center">
                      <button
                        onClick={() => { setIsNew(false); setActiveTask(task) }}
                        className="w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                        title="Abrir detalle"
                      >
                        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {activeTask && (
        <TaskPanel
          task={activeTask}
          isNew={isNew}
          clients={clients}
          projects={projects}
          onSave={handleSavePanel}
          onDelete={(id) => { onDeleteTask(id); setActiveTask(null) }}
          onClose={() => setActiveTask(null)}
        />
      )}
    </>
  )
}
