import { Draggable } from '@hello-pangea/dnd'
import type { Task, Client } from '../../types'
import { ProgressBar } from '../shared/ProgressBar'

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

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`bg-white rounded-xl border p-3.5 cursor-pointer transition-all duration-150 select-none ${
            snapshot.isDragging
              ? 'shadow-lg rotate-1 border-blue-200 scale-105'
              : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
          }`}
        >
          {/* Client dot + title */}
          <div className="flex items-start gap-2 mb-2.5">
            {client && (
              <span
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: client.color }}
              />
            )}
            <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{task.title}</p>
          </div>

          {/* Progress */}
          {task.progress > 0 && (
            <div className="mb-2.5">
              <ProgressBar value={task.progress} color={client?.color || '#378ADD'} showLabel height={4} />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 mt-1">
            {client && (
              <span className="text-xs font-medium truncate" style={{ color: client.color }}>
                {client.name}
              </span>
            )}
            {task.due_date && (
              <span className={`text-xs flex-shrink-0 px-1.5 py-0.5 rounded-md font-medium ${
                isOverdue ? 'bg-red-50 text-red-500' :
                isDueSoon ? 'bg-amber-50 text-amber-600' :
                'text-gray-400'
              }`}>
                {formatDate(task.due_date)}
              </span>
            )}
          </div>

          {/* Next step preview */}
          {task.next_step && (
            <div className="mt-2 pt-2 border-t border-gray-50">
              <p className="text-xs text-gray-400 line-clamp-1">
                <span className="font-medium text-gray-500">→</span> {task.next_step}
              </p>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
