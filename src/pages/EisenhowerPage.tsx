import { useTasks } from '../hooks/useTasks'
import { useAuth } from '../hooks/useAuth'
import { useState, useRef } from 'react'
import type { Task } from '../types'
import { KanbanSkeleton, ErrorState } from '../components/shared/LoadingStates'

function getUserAssignee(email?: string): 'alan' | 'mercedes' {
  return email === 'maria.vergara@upch.pe' ? 'mercedes' : 'alan'
}

function isUrgent(task: Task): boolean {
  if (!task.due_date) return false
  const now = new Date()
  const due = new Date(task.due_date)
  const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60)
  return diffHours <= 48
}

function isImportant(task: Task): boolean {
  return task.priority === 'high'
}

type Quadrant = 'do' | 'decide' | 'delegate' | 'eliminate'

function getQuadrant(task: Task): Quadrant {
  const u = isUrgent(task)
  const i = isImportant(task)
  if (u && i)  return 'do'
  if (!u && i) return 'decide'
  if (u && !i) return 'delegate'
  return 'eliminate'
}

function getQuadrantUpdates(q: Quadrant): Partial<Task> {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  switch (q) {
    case 'do':       return { priority: 'high',   due_date: fmt(tomorrow) }
    case 'decide':   return { priority: 'high',   due_date: fmt(nextWeek) }
    case 'delegate': return { priority: 'medium', due_date: fmt(tomorrow) }
    case 'eliminate':return { priority: 'low',    due_date: null }
  }
}

function formatDue(due: string | null): string {
  if (!due) return 'Sin fecha'
  const d = new Date(due)
  const now = new Date()
  const diffH = (d.getTime() - now.getTime()) / (1000 * 60 * 60)
  if (diffH < 0) return 'Vencida'
  if (diffH <= 24) return 'Vence hoy'
  if (diffH <= 48) return 'Vence mañana'
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })
}

const QUADRANT_CONFIG = {
  do:       { label: 'Cuadrante 1', title: 'Hacer',    subtitle: 'Alta prioridad · ≤48h',    bg: '#FCEBEB', border: '#F09595', labelColor: '#A32D2D', titleColor: '#791F1F', subtitleColor: '#A32D2D', countBg: '#F09595', countColor: '#791F1F' },
  decide:   { label: 'Cuadrante 2', title: 'Decidir',  subtitle: 'Alta prioridad · >48h',    bg: '#FAEEDA', border: '#FAC775', labelColor: '#854F0B', titleColor: '#633806', subtitleColor: '#854F0B', countBg: '#FAC775', countColor: '#633806' },
  delegate: { label: 'Cuadrante 3', title: 'Delegar',  subtitle: 'Media/baja · ≤48h',        bg: '#E6F1FB', border: '#85B7EB', labelColor: '#185FA5', titleColor: '#042C53', subtitleColor: '#185FA5', countBg: '#85B7EB', countColor: '#042C53' },
  eliminate:{ label: 'Cuadrante 4', title: 'Eliminar', subtitle: 'Media/baja · sin urgencia', bg: 'var(--color-background-secondary)', border: 'var(--color-border-tertiary)', labelColor: '#888780', titleColor: 'var(--color-text-primary)', subtitleColor: '#888780', countBg: '#D3D1C7', countColor: '#444441' },
}

const PRIORITY_BADGE: Record<string, { bg: string; color: string; label: string }> = {
  high:   { bg: '#FCEBEB', color: '#A32D2D', label: 'Alta' },
  medium: { bg: '#FAEEDA', color: '#854F0B', label: 'Media' },
  low:    { bg: '#EAF3DE', color: '#3B6D11', label: 'Baja' },
}

function TaskCard({ task, onDragStart }: { task: Task; onDragStart: (id: string) => void }) {
  const due = formatDue(task.due_date)
  const isOverdue = task.due_date && new Date(task.due_date) < new Date()
  const pb = PRIORITY_BADGE[task.priority || 'medium']
  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart(task.id) }}
      style={{ background: 'white', borderRadius: 8, padding: '8px 10px', border: '0.5px solid rgba(0,0,0,0.1)', marginBottom: 6, cursor: 'grab', userSelect: 'none', transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a', marginBottom: 4, lineHeight: 1.3 }}>{task.title}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 500, background: isOverdue ? '#FCEBEB' : '#F1EFE8', color: isOverdue ? '#A32D2D' : '#5F5E5A' }}>{due}</span>
        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 500, background: pb.bg, color: pb.color }}>{pb.label}</span>
      </div>
    </div>
  )
}

function QuadrantBox({ id, tasks, onDragStart, onDrop, dragOverId, setDragOver }: {
  id: Quadrant; tasks: Task[]
  onDragStart: (taskId: string) => void
  onDrop: (q: Quadrant) => void
  dragOverId: Quadrant | null
  setDragOver: (q: Quadrant | null) => void
}) {
  const cfg = QUADRANT_CONFIG[id]
  const isOver = dragOverId === id
  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(id) }}
      onDragLeave={() => setDragOver(null)}
      onDrop={e => { e.preventDefault(); setDragOver(null); onDrop(id) }}
      style={{ background: cfg.bg, border: isOver ? `2px dashed ${cfg.border}` : `0.5px solid ${cfg.border}`, borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column' as const, overflow: 'hidden', position: 'relative' as const, minHeight: 0, transition: 'border 0.15s, box-shadow 0.15s', boxShadow: isOver ? `0 0 0 3px ${cfg.border}33` : 'none' }}
    >
      <div style={{ position: 'absolute' as const, top: 12, right: 12, width: 22, height: 22, borderRadius: '50%', background: cfg.countBg, color: cfg.countColor, fontSize: 11, fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{tasks.length}</div>
      <div style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.6px', color: cfg.labelColor, marginBottom: 2 }}>{cfg.label}</div>
      <div style={{ fontSize: 16, fontWeight: 500, color: cfg.titleColor, marginBottom: 2 }}>{cfg.title}</div>
      <div style={{ fontSize: 11, color: cfg.subtitleColor, opacity: 0.75, marginBottom: 10 }}>{cfg.subtitle}</div>
      {isOver && (
        <div style={{ fontSize: 11, color: cfg.labelColor, textAlign: 'center', padding: '6px 0', marginBottom: 6, borderRadius: 6, background: `${cfg.border}22`, border: `1px dashed ${cfg.border}` }}>
          Soltar aquí
        </div>
      )}
      <div style={{ flex: 1, overflowY: 'auto' as const }}>
        {tasks.length === 0 && !isOver
          ? <div style={{ fontSize: 11, color: cfg.subtitleColor, opacity: 0.5, textAlign: 'center' as const, paddingTop: 16 }}>Sin tareas</div>
          : tasks.map(t => <TaskCard key={t.id} task={t} onDragStart={onDragStart} />)
        }
      </div>
    </div>
  )
}

export function EisenhowerPage() {
  const { user } = useAuth()
  const { tasks, loading, error, refetch, updateTask } = useTasks()
  const [activeTab, setActiveTab] = useState<'mine' | 'other' | 'all'>('mine')
  const [dragOverId, setDragOver] = useState<Quadrant | null>(null)
  const dragTaskId = useRef<string | null>(null)

  if (loading) return <KanbanSkeleton />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const loggedAssignee = getUserAssignee(user?.email)
  const otherAssignee: 'alan' | 'mercedes' = loggedAssignee === 'alan' ? 'mercedes' : 'alan'
  const otherLabel = otherAssignee === 'alan' ? 'Dr. Alan' : 'Dra. Mercedes'

  const activeTasks = tasks.filter(t => t.status !== 'done')
  const filteredTasks = activeTab === 'all'
    ? activeTasks
    : activeTab === 'mine'
      ? activeTasks.filter(t => t.assignee === loggedAssignee || t.assignee === 'both')
      : activeTasks.filter(t => t.assignee === otherAssignee || t.assignee === 'both')

  const byQuadrant: Record<Quadrant, Task[]> = { do: [], decide: [], delegate: [], eliminate: [] }
  filteredTasks.forEach(t => byQuadrant[getQuadrant(t)].push(t))

  const handleDragStart = (taskId: string) => { dragTaskId.current = taskId }

  const handleDrop = async (targetQuadrant: Quadrant) => {
    const taskId = dragTaskId.current
    if (!taskId) return
    const task = tasks.find(t => t.id === taskId)
    if (!task || getQuadrant(task) === targetQuadrant) return
    await updateTask(taskId, getQuadrantUpdates(targetQuadrant))
    dragTaskId.current = null
  }

  const tabStyle = (tab: typeof activeTab) => ({
    padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 500 as const,
    cursor: 'pointer' as const, border: activeTab === tab ? '0.5px solid rgba(0,0,0,0.1)' : 'none',
    background: activeTab === tab ? 'white' : 'transparent',
    color: activeTab === tab ? 'var(--color-text-primary)' : '#888780',
  })

  const axisLabel = (text: string) => (
    <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '1px', textTransform: 'uppercase' as const, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
      {text}
      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </span>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 500, margin: 0 }}>Matriz de Eisenhower</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>{filteredTasks.length} tarea{filteredTasks.length !== 1 ? 's' : ''} activas</p>
        </div>
        <div style={{ display: 'flex', background: '#F1EFE8', borderRadius: 10, padding: 3, gap: 2 }}>
          <button style={tabStyle('mine')} onClick={() => setActiveTab('mine')}>Mis tareas</button>
          <button style={tabStyle('other')} onClick={() => setActiveTab('other')}>{otherLabel}</button>
          <button style={tabStyle('all')} onClick={() => setActiveTab('all')}>Todas</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '44px 1fr', gridTemplateRows: '1fr 44px', gap: 6, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', writingMode: 'vertical-rl' as const, transform: 'rotate(180deg)' }}>
          {axisLabel('Urgente')}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 8, minHeight: 0 }}>
          {(['do', 'decide', 'delegate', 'eliminate'] as Quadrant[]).map(q => (
            <QuadrantBox key={q} id={q} tasks={byQuadrant[q]} onDragStart={handleDragStart} onDrop={handleDrop} dragOverId={dragOverId} setDragOver={setDragOver} />
          ))}
        </div>
        <div />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {axisLabel('Importante')}
        </div>
      </div>
    </div>
  )
}
