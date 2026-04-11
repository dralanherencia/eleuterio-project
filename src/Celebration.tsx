import { useEffect, useRef, useState, useCallback } from 'react'

// ============================================================
// CONFETTI ENGINE — lightweight canvas-based particles
// ============================================================
interface Particle {
  x: number; y: number; vx: number; vy: number
  size: number; color: string; rotation: number; rotSpeed: number
  opacity: number; shape: 'rect' | 'circle' | 'strip'
}

const COLORS = ['#378ADD', '#1D9E75', '#D4537E', '#EF9F27', '#534AB7', '#E24B4A', '#639922', '#BA7517']

function createParticles(count: number, originX: number, originY: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x: originX,
    y: originY,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -16 - 4,
    size: Math.random() * 6 + 3,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    rotation: Math.random() * 360,
    rotSpeed: (Math.random() - 0.5) * 15,
    opacity: 1,
    shape: (['rect', 'circle', 'strip'] as const)[Math.floor(Math.random() * 3)],
  }))
}

// ============================================================
// CELEBRATION SOUND — tiny Web Audio chime
// ============================================================
function playChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99] // C5, E5, G5

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(ctx.currentTime + i * 0.12)
      osc.stop(ctx.currentTime + i * 0.12 + 0.5)
    })

    // Cleanup
    setTimeout(() => ctx.close(), 2000)
  } catch { /* Audio not available */ }
}

// ============================================================
// STREAK + WEEKLY PROGRESS — localStorage persistence
// ============================================================
const STREAK_KEY = 'eleuterio_streak'
const WEEKLY_KEY = 'eleuterio_weekly'

export interface StreakData {
  currentStreak: number
  lastCompletionDate: string // YYYY-MM-DD
  bestStreak: number
  totalCompleted: number
}

export interface WeeklyData {
  weekStart: string // YYYY-MM-DD (Monday)
  completed: number
  goal: number
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function getMonday(): string {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff)).toISOString().slice(0, 10)
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function loadStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { currentStreak: 0, lastCompletionDate: '', bestStreak: 0, totalCompleted: 0 }
}

function saveStreak(data: StreakData) {
  try { localStorage.setItem(STREAK_KEY, JSON.stringify(data)) } catch {}
}

function loadWeekly(): WeeklyData {
  try {
    const raw = localStorage.getItem(WEEKLY_KEY)
    if (raw) {
      const data = JSON.parse(raw)
      if (data.weekStart === getMonday()) return data
    }
  } catch {}
  return { weekStart: getMonday(), completed: 0, goal: 10 }
}

function saveWeekly(data: WeeklyData) {
  try { localStorage.setItem(WEEKLY_KEY, JSON.stringify(data)) } catch {}
}

export function updateStreakOnCompletion(): { streak: StreakData; weekly: WeeklyData; isNewDay: boolean } {
  const today = getToday()
  const yesterday = getYesterday()
  const streak = loadStreak()
  const weekly = loadWeekly()

  const isNewDay = streak.lastCompletionDate !== today

  // Update streak
  if (streak.lastCompletionDate === yesterday || streak.lastCompletionDate === today) {
    if (isNewDay) streak.currentStreak++
  } else if (streak.lastCompletionDate !== today) {
    streak.currentStreak = 1
  }

  streak.lastCompletionDate = today
  streak.totalCompleted++
  if (streak.currentStreak > streak.bestStreak) streak.bestStreak = streak.currentStreak

  // Update weekly
  if (weekly.weekStart !== getMonday()) {
    weekly.weekStart = getMonday()
    weekly.completed = 0
  }
  weekly.completed++

  saveStreak(streak)
  saveWeekly(weekly)

  return { streak, weekly, isNewDay }
}

export function getStreakData(): StreakData {
  const streak = loadStreak()
  const today = getToday()
  const yesterday = getYesterday()
  // If last completion wasn't today or yesterday, streak is broken
  if (streak.lastCompletionDate !== today && streak.lastCompletionDate !== yesterday) {
    streak.currentStreak = 0
  }
  return streak
}

export function getWeeklyData(): WeeklyData {
  return loadWeekly()
}

// ============================================================
// CONFETTI CANVAS COMPONENT
// ============================================================
export function ConfettiCanvas({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animRef = useRef<number>(0)

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particlesRef.current = particlesRef.current.filter(p => p.opacity > 0.01)

    if (particlesRef.current.length === 0) {
      cancelAnimationFrame(animRef.current)
      return
    }

    particlesRef.current.forEach(p => {
      p.x += p.vx
      p.vy += 0.3 // gravity
      p.y += p.vy
      p.rotation += p.rotSpeed
      p.opacity -= 0.012
      p.vx *= 0.99

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rotation * Math.PI) / 180)
      ctx.globalAlpha = Math.max(0, p.opacity)
      ctx.fillStyle = p.color

      if (p.shape === 'rect') {
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
      } else if (p.shape === 'circle') {
        ctx.beginPath()
        ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2)
        ctx.fill()
      } else {
        ctx.fillRect(-p.size / 2, -1, p.size, 2.5)
      }

      ctx.restore()
    })

    animRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    if (trigger <= 0) return

    // Spawn confetti from center-top area
    const cx = window.innerWidth / 2
    const cy = window.innerHeight * 0.3
    particlesRef.current = [...particlesRef.current, ...createParticles(60, cx, cy)]

    playChime()

    cancelAnimationFrame(animRef.current)
    animRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animRef.current)
  }, [trigger, animate])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none',
        width: '100%', height: '100%',
      }}
    />
  )
}

// ============================================================
// COMPLETION TOAST — shows streak + message
// ============================================================
const MESSAGES = [
  '!Tarea completada!',
  '!Bien hecho!',
  '!Excelente trabajo!',
  '!Sigue asi!',
  '!Imparable!',
  '!Productividad al maximo!',
  '!Otra mas al saco!',
]

export function CompletionToast({ show, streak, weekly }: {
  show: boolean
  streak: StreakData
  weekly: WeeklyData
}) {
  const [visible, setVisible] = useState(false)
  const [msg] = useState(() => MESSAGES[Math.floor(Math.random() * MESSAGES.length)])

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => setVisible(false), 3500)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!visible) return null

  const weekPct = Math.min(100, Math.round((weekly.completed / weekly.goal) * 100))
  const metGoal = weekly.completed >= weekly.goal

  return (
    <div
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[10000] animate-bounce"
      style={{ animation: 'toastIn 0.4s ease-out' }}
    >
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 px-6 py-4 flex items-center gap-5 min-w-[340px]">
        {/* Emoji celebration */}
        <div className="text-3xl">
          {streak.currentStreak >= 7 ? '🔥' : streak.currentStreak >= 3 ? '⚡' : '✅'}
        </div>

        <div className="flex-1">
          {/* Message */}
          <div className="text-sm font-semibold text-gray-900">{msg}</div>

          {/* Streak */}
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Racha:</span>
              <span className="text-sm font-bold text-orange-500">
                {streak.currentStreak} dia{streak.currentStreak !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-gray-200">|</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Total:</span>
              <span className="text-sm font-bold text-blue-500">{streak.totalCompleted}</span>
            </div>
          </div>

          {/* Weekly progress bar */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs text-gray-400">
                Semana: {weekly.completed}/{weekly.goal}
              </span>
              {metGoal && <span className="text-xs font-medium text-green-500">Meta cumplida!</span>}
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${weekPct}%`,
                  backgroundColor: metGoal ? '#1D9E75' : '#378ADD',
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// STREAK BADGE — for sidebar or header (optional)
// ============================================================
export function StreakBadge() {
  const streak = getStreakData()
  const weekly = getWeeklyData()
  const weekPct = Math.min(100, Math.round((weekly.completed / weekly.goal) * 100))

  if (streak.totalCompleted === 0) return null

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {streak.currentStreak >= 7 ? '🔥' : streak.currentStreak >= 3 ? '⚡' : '✨'}
          </span>
          <div>
            <div className="text-xs text-gray-400">Racha</div>
            <div className="text-sm font-bold text-gray-900">
              {streak.currentStreak} dia{streak.currentStreak !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Mejor</div>
          <div className="text-sm font-bold text-orange-500">{streak.bestStreak}</div>
        </div>
      </div>

      {/* Weekly mini progress */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-0.5">
          <span>Semana</span>
          <span>{weekly.completed}/{weekly.goal}</span>
        </div>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${weekPct}%`, backgroundColor: weekPct >= 100 ? '#1D9E75' : '#378ADD' }}
          />
        </div>
      </div>
    </div>
  )
}
