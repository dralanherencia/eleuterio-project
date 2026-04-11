import { Draggable } from '@hello-pangea/dnd'
import type { Task, Client } from '../../types'
import { PRIORITY_COLORS } from '../../types'

interface Props {
  task: Task
  index: number
  clients: Client[]
  onClick: (task: Task) => void
}

export function KanbanCard({ task, index, clients, onClick }: Props) {
  const client = clients.find(c => c.id === task.client_id)
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
  const isDueSoon = task.due_date && !isOverdue && task.status !== 'done' &&
    (new Date(task.due_date).getTime() - Date.now()) < 1000 * 60 * 60 * 24 * 3

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })

  const priority = task.priority || 'medium'
  const pc = PRIORITY_COLORS[priority]

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`bg-white rounded-xl border p-3 cursor-pointer transition-all duration-150 select-none ${
            snapshot.isDragging
              ? 'shadow-lg rotate-1 scale-105 border-blue-200'
              : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
          }`}
          style={{
            ...provided.draggableProps.style,
            borderLeft: `3px solid ${pc.border}`,
          }}
        >
          {/* Title with client dot */}
          <div className="flex items-start gap-2">
            {client && (
              <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: client.color }} />
            )}
            <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{task.title}</p>
          </div>

          {/* Date — only shown if exists */}
          {task.due_date && (
            <div className="flex items-center justify-end mt-2">
              <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                isOverdue ? 'bg-red-50 text-red-500' :
                isDueSoon ? 'bg-amber-50 text-amber-600' :
                'text-gray-400'
              }`}>
                {formatDate(task.due_date)}
              </span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
