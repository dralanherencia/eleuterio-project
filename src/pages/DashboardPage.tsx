import { useMemo } from 'react'
import { useTasks } from '../hooks/useTasks'
import type { Status } from '../types'
import { STATUS_LABELS, STATUS_COLORS } from '../types'
import { DashboardSkeleton, ErrorState } from '../components/shared/LoadingStates'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

function MetricCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="text-xs font-medium text-gray-400 mb-1">{label}</div>
      <div className="text-3xl font-bold" style={{ color: accent || '#1a1a2e' }}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

export function DashboardPage() {
  const { tasks, clients, loading, error, refetch } = useTasks()

  if (loading) return <DashboardSkeleton />
  if (error) return <ErrorState message={error} onRetry={refetch} />

  const now = new Date()
  const in7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const in3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const metrics = useMemo(() => {
    const active = tasks.filter(t => t.status !== 'done')
    const doneAll = tasks.filter(t => t.status === 'done')
    const dueSoon = tasks.filter(t => t.due_date && t.status !== 'done' && new Date(t.due_date) <= in7)
    const avgProgress = tasks.length > 0
      ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / tasks.length) : 0

    const clientData = clients.map(c => {
      const ctasks = tasks.filter(t => t.client_id === c.id)
      const avg = ctasks.length > 0 ? Math.round(ctasks.reduce((s, t) => s + t.progress, 0) / ctasks.length) : 0
      return { name: c.name, avance: avg, color: c.color, total: ctasks.length }
    }).filter(c => c.total > 0)

    const statusData = (['pending', 'in_progress', 'review', 'done'] as Status[]).map(s => ({
      name: STATUS_LABELS[s],
      value: tasks.filter(t => t.status === s).length,
      color: STATUS_COLORS[s],
    })).filter(s => s.value > 0)

    const upcoming = [...tasks]
      .filter(t => t.due_date && t.status !== 'done')
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 6)

    // Workload by assignee
    const alanTasks = tasks.filter(t => t.assignee === 'alan' || t.assignee === 'both').filter(t => t.status !== 'done')
    const mercTasks = tasks.filter(t => t.assignee === 'mercedes' || t.assignee === 'both').filter(t => t.status !== 'done')

    return { active, doneAll, dueSoon, avgProgress, clientData, statusData, upcoming, alanTasks, mercTasks }
  }, [tasks, clients])

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })

  const getDueBadge = (due: string) => {
    const d = new Date(due)
    if (d < now) return { label: 'Vencida', cls: 'bg-red-50 text-red-500' }
    if (d <= in3) return { label: 'Urgente', cls: 'bg-orange-50 text-orange-500' }
    if (d <= in7) return { label: 'Esta semana', cls: 'bg-amber-50 text-amber-600' }
    return { label: formatDate(due), cls: 'bg-gray-50 text-gray-500' }
  }

  const getClient = (id: string | null) => clients.find(c => c.id === id)
  const { active, doneAll, dueSoon, avgProgress, clientData, statusData, upcoming, alanTasks, mercTasks } = metrics

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Resumen general de Eleuterio Project</p>
      </div>

      {/* Workload row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-blue-600">AH</span>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Alan · tareas activas</div>
            <div className="text-2xl font-bold text-gray-900">{alanTasks.length}</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-purple-600">MV</span>
          </div>
          <div>
            <div className="text-xs text-gray-400 mb-0.5">Mercedes · tareas activas</div>
            <div className="text-2xl font-bold text-gray-900">{mercTasks.length}</div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Tareas activas" value={active.length} sub={`de ${tasks.length} totales`} />
        <MetricCard label="Completadas" value={doneAll.length} sub="estado: Listo" accent="#1D9E75" />
        <MetricCard
          label="Vencen en 7 días"
          value={dueSoon.length}
          sub={dueSoon.length > 0 ? 'Requieren atención' : 'Todo al día'}
          accent={dueSoon.length > 0 ? '#E24B4A' : '#1D9E75'}
        />
        <MetricCard label="Avance global" value={`${avgProgress}%`} sub="promedio de todas las tareas" accent="#378ADD" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-5 gap-4">
        <div className="col-span-3 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-sm font-semibold text-gray-700 mb-4">Avance por cliente</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={clientData} layout="vertical" margin={{ left: 0, right: 24 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
              <Tooltip formatter={(v: unknown) => [`${v}%`, 'Avance']} />
              <Bar dataKey="avance" radius={[0, 6, 6, 0]}>
                {clientData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="col-span-2 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="text-sm font-semibold text-gray-700 mb-2">Por estado</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip formatter={(v: unknown) => [String(v), '']} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <div className="text-sm font-semibold text-gray-700">Próximas a vencer</div>
          <span className="text-xs text-gray-400">{upcoming.length} tareas</span>
        </div>
        <div className="divide-y divide-gray-50">
          {upcoming.length === 0 && (
            <div className="py-8 text-center text-sm text-gray-400">No hay tareas con fecha de vencimiento</div>
          )}
          {upcoming.map(task => {
            const client = getClient(task.client_id)
            const badge = getDueBadge(task.due_date ?? '')
            return (
              <div key={task.id} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{task.title}</p>
                  {task.next_step && <p className="text-xs text-gray-400 truncate mt-0.5">→ {task.next_step}</p>}
                </div>
                {client && <span className="text-xs font-medium flex-shrink-0" style={{ color: client.color }}>{client.name}</span>}
                <div className="flex-shrink-0 w-20">
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${task.progress}%`, backgroundColor: client?.color || '#888' }} />
                  </div>
                  <div className="text-xs text-gray-400 text-right mt-0.5">{task.progress}%</div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-lg font-medium flex-shrink-0 ${badge.cls}`}>{badge.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
