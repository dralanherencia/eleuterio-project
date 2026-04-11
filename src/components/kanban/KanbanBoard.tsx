import { useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import type { Task, Status, Client, Project } from '../../types'
import { KanbanColumn } from './KanbanColumn'
import { TaskPanel } from './TaskPanel'
import { ConfettiCanvas, CompletionToast, updateStreakOnCompletion } from './Celebration'
import type { default as StreakType } from './Celebration'

const STATUSES: Status[] = ['pending', 'in_progress', 'review', 'done']

interface Props {
  tasks: Task[]
  clients: Client[]
  projects: Project[]
  selectedClients: string[]
  onMoveTask: (taskId: string, status: Status, position: number) => void
  onUpdateTask: (id: string, updates: Partial<Task>) => void
  onCreateTask: (task: Omit<Task, 'id' | 'created_at'>) => void
  onDeleteTask: (id: string) => void
}

export function KanbanBoard({
  tasks, clients, projects, selectedClients,
  onMoveTask, onUpdateTask, onCreateTask, onDeleteTask
}: Props) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const [isNew, setIsNew] = useState(false)

  // Celebration state
  const [confettiTrigger, setConfettiTrigger] = useState(0)
  const [showToast, setShowToast] = useState(false)
  const [toastStreak, setToastStreak] = useState({ currentStreak: 0, lastCompletionDate: '', bestStreak: 0, totalCompleted: 0 })
  const [toastWeekly, setToastWeekly] = useState({ weekStart: '', completed: 0, goal: 10 })

  const filtered = selectedClients.length > 0
    ? tasks.filter(t => selectedClients.includes(t.client_id))
    : tasks

  const getColumnTasks = (status: Status) =>
    filtered.filter(t => t.status === status).sort((a, b) => a.position - b.position)

  const triggerCelebration = () => {
    const { streak, weekly } = updateStreakOnCompletion()
    setToastStreak(streak)
    setToastWeekly(weekly)
    setConfettiTrigger(prev => prev + 1)
    setShowToast(false)
    // Small delay so toast re-mounts
    setTimeout(() => setShowToast(true), 50)
  }

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, source, destination } = result

    // Check if task was moved TO "done" from a different column
    const task = tasks.find(t => t.id === draggableId)
    const movedToDone = destination.droppableId === 'done' && source.droppableId !== 'done'

    onMoveTask(draggableId, destination.droppableId as Status, destination.index)

    if (movedToDone && task) {
      triggerCelebration()
    }
  }

  const handleSave = (task: Task) => {
    if (isNew) {
      const { id: _id, ...rest } = task
      onCreateTask({ ...rest })
    } else {
      // Check if status changed to 'done'
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
      assignee: 'alan',
      position: 0,
    }
    setIsNew(true)
    setActiveTask(blankTask)
  }

  return (
    <>
      {/* Confetti overlay */}
      <ConfettiCanvas trigger={confettiTrigger} />

      {/* Completion toast */}
      <CompletionToast show={showToast} streak={toastStreak} weekly={toastWeekly} />

      <div className="flex items-center justify-between mb-4 px-1">
        <span className="text-sm text-gray-500">{filtered.length} tareas</span>
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

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUSES.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={getColumnTasks(status)}
              clients={clients}
              onCardClick={(task) => { setIsNew(false); setActiveTask(task) }}
            />
          ))}
        </div>
      </DragDropContext>

      {activeTask && (
        <TaskPanel
          task={activeTask}
          isNew={isNew}
          clients={clients}
          projects={projects}
          onSave={handleSave}
          onDelete={(id) => { onDeleteTask(id); setActiveTask(null) }}
          onClose={() => setActiveTask(null)}
        />
      )}
    </>
  )
}
