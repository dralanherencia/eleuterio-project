export type Status = 'pending' | 'in_progress' | 'review' | 'done'
export type Priority = 'high' | 'medium' | 'low'
export type Assignee = 'alan' | 'mercedes' | 'both'

export interface Client {
  id: string
  name: string
  color: string
}

export interface Project {
  id: string
  name: string
  client_id: string | null
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
  file_url: string | null
  priority: Priority
  assignee: Assignee
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

export const PRIORITY_LABELS: Record<Priority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

export const PRIORITY_COLORS: Record<Priority, { bg: string; text: string; border: string }> = {
  high:   { bg: '#FCEBEB', text: '#A32D2D', border: '#F09595' },
  medium: { bg: '#FAEEDA', text: '#854F0B', border: '#EF9F27' },
  low:    { bg: '#EAF3DE', text: '#3B6D11', border: '#97C459' },
}

export const ASSIGNEE_LABELS: Record<Assignee, string> = {
  alan: 'Alan',
  mercedes: 'Mercedes',
  both: 'Ambos',
}

export const ASSIGNEE_COLORS: Record<Assignee, { bg: string; text: string }> = {
  alan:     { bg: '#E6F1FB', text: '#0C447C' },
  mercedes: { bg: '#EEEDFE', text: '#3C3489' },
  both:     { bg: '#E1F5EE', text: '#085041' },
}
