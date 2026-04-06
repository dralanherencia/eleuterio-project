export type Status = 'pending' | 'in_progress' | 'review' | 'done'

export interface Client {
  id: string
  name: string
  color: string
}

export interface Project {
  id: string
  name: string
  client_id: string
  start_date: string
  end_date: string
  color: string
}

export interface Task {
  id: string
  project_id: string | null
  client_id: string
  title: string
  status: Status
  progress: number
  due_date: string | null
  next_step: string | null
  notes: string | null
  position: number
  created_at?: string
}

export const STATUS_LABELS: Record<Status, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  review: 'Revisión',
  done: 'Listo',
}

export const STATUS_COLORS: Record<Status, string> = {
  pending: '#888780',
  in_progress: '#378ADD',
  review: '#EF9F27',
  done: '#1D9E75',
}
