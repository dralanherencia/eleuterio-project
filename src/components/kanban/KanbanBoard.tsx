import { useState } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import type { DropResult } from '@hello-pangea/dnd'
import type { Task, Status, Client, Project } from '../../types'
import { KanbanColumn } from './KanbanColumn'
import { TaskPanel } from './TaskPanel'

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

  const filtered = selectedClients.length > 0
    ? tasks.filter(t => selectedClients.includes(t.client_id))
    : tasks

  const getColumnTasks = (status: Status) =>
    filtered.filter(t => t.status === status).sort((a, b) => a.position - b.position)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, destination } = result
    onMoveTask(draggableId, destination.droppableId as Status, destination.index)
  }

  const handleSave = (task: Task) => {
    if (isNew) {
      const { id: _id, ...rest } = task
      onCreateTask({ ...rest })
    } else {
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
      position: 0,
    }
    setIsNew(true)
    setActiveTask(blankTask)
  }

  return (
    <>
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
