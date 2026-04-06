import { Droppable } from '@hello-pangea/dnd'
import type { Task, Status, Client } from '../../types'
import { KanbanCard } from './KanbanCard'

const COLUMN_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pendiente',    color: '#888780', bg: '#F5F5F4' },
  in_progress: { label: 'En progreso',  color: '#378ADD', bg: '#EFF6FF' },
  review:      { label: 'Revisión',     color: '#EF9F27', bg: '#FFFBEB' },
  done:        { label: 'Listo',        color: '#1D9E75', bg: '#F0FDF4' },
}

interface Props {
  status: Status
  tasks: Task[]
  clients: Client[]
  onCardClick: (task: Task) => void
}

export function KanbanColumn({ status, tasks, clients, onCardClick }: Props) {
  const config = COLUMN_CONFIG[status]

  return (
    <div className="flex flex-col min-w-[260px] w-[260px]">
      {/* Column header */}
      <div className="flex items-center justify-between px-1 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: config.color }} />
          <span className="text-sm font-semibold text-gray-700">{config.label}</span>
        </div>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 rounded-2xl p-2 min-h-[120px] transition-colors duration-150 space-y-2 ${
              snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-200 ring-inset' : 'bg-gray-50'
            }`}
          >
            {tasks.map((task, index) => (
              <KanbanCard
                key={task.id}
                task={task}
                index={index}
                clients={clients}
                onClick={onCardClick}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div className="flex items-center justify-center h-16 text-xs text-gray-300">
                Sin tareas
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
