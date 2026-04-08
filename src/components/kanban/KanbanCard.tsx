import { Draggable } from '@hello-pangea/dnd'
import type { Task, Client } from '../../types'
import { PRIORITY_COLORS, ASSIGNEE_LABELS, ASSIGNEE_COLORS } from '../../types'
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

  const priority = task.priority || 'medium'
  const assignee = task.assignee || 'alan'
  const pc = PRIORITY_COLORS[priority]
  const ac = ASSIGNEE_COLORS[assignee]

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
              ? 'shadow-lg rotate-1 scale-105 border-blue-200'
              : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
          }`}
          style={{
            ...provided.draggableProps.style,
            borderLeft: priority === 'high' ? `3px solid ${pc.border}` : undefined,
          }}
        >
          {/* Top row: priority + assignee */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
              style={{ backgroundColor: pc.bg, color: pc.text }}>
              {priority === 'high' ? '↑ Alta' : priority === 'low' ? '↓ Baja' : '— Media'}
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded-md font-medium"
              style={{ backgroundColor: ac.bg, color: ac.text }}>
              {ASSIGNEE_LABELS[assignee]}
            </span>
          </div>

          {/* Title */}
          <div className="flex items-start gap-2 mb-2">
            {client && (
              <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: client.color }} />
            )}
            <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">{task.title}</p>
          </div>

          {/* Progress */}
          {task.progress > 0 && (
            <div className="mb-2">
              <ProgressBar value={task.progress} color={client?.color || '#378ADD'} showLabel height={4} />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 mt-1">
            {client && (
              <span className="text-xs font-medium truncate" style={{ color: client.color }}>{client.name}</span>
            )}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {task.file_url && (
                <span className="text-gray-300" title="Tiene archivo adjunto">
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
                  </svg>
                </span>
              )}
              {task.due_date && (
                <span className={`text-xs px-1.5 py-0.5 rounded-md font-medium ${
                  isOverdue ? 'bg-red-50 text-red-500' :
                  isDueSoon ? 'bg-amber-50 text-amber-600' :
                  'text-gray-400'
                }`}>
                  {formatDate(task.due_date)}
                </span>
              )}
            </div>
          </div>

          {/* Next step */}
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
