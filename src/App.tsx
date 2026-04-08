import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { useAuth } from './hooks/useAuth'
import { TaskProvider } from './context/TaskContext'
import { Sidebar } from './components/shared/Sidebar'
import { LoginPage } from './pages/LoginPage'
import { DashboardSkeleton, KanbanSkeleton } from './components/shared/LoadingStates'

// Lazy load pages — each loads only when visited
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const KanbanPage    = lazy(() => import('./pages/KanbanPage').then(m => ({ default: m.KanbanPage })))
const GanttPage     = lazy(() => import('./pages/GanttPage').then(m => ({ default: m.GanttPage })))

function AppLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
          <span className="text-white font-bold">E</span>
        </div>
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-blue-300 rounded-full animate-bounce" style={{animationDelay:'0ms'}}/>
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay:'150ms'}}/>
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay:'300ms'}}/>
        </div>
      </div>
    </div>
  )
}

function ProtectedApp() {
  const { user, loading } = useAuth()

  if (loading) return <AppLoader />
  if (!user) return <Navigate to="/login" replace />

  return (
    <TaskProvider>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto min-h-screen">
          <Routes>
            <Route path="/" element={
              <Suspense fallback={<DashboardSkeleton />}>
                <DashboardPage />
              </Suspense>
            }/>
            <Route path="/kanban" element={
              <Suspense fallback={<KanbanSkeleton />}>
                <KanbanPage />
              </Suspense>
            }/>
            <Route path="/gantt" element={
              <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400 text-sm">Cargando Gantt…</div>}>
                <GanttPage />
              </Suspense>
            }/>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </TaskProvider>
  )
}

function LoginWithRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <LoginPage />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginWithRedirect />} />
        <Route path="/*" element={<ProtectedApp />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
