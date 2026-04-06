import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Sidebar } from './components/shared/Sidebar'
import { DashboardPage } from './pages/DashboardPage'
import { KanbanPage } from './pages/KanbanPage'
import { GanttPage } from './pages/GanttPage'

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 overflow-auto min-h-screen">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/kanban" element={<KanbanPage />} />
            <Route path="/gantt" element={<GanttPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
