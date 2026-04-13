// api/send-reminders.js
// Vercel Cron Job — corre cada día a las 7am (Lima = UTC-5, entonces 12:00 UTC)
// Busca tareas con remind=true que vencen HOY o MAÑANA y envía correo via Resend

const RESEND_API_KEY = process.env.RESEND_API_KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY // Service role key (no la anon)
const CRON_SECRET = process.env.CRON_SECRET

const EMAILS = {
  alan: 'dr.alanherencia@gmail.com',
  mercedes: 'maria.vergara@upch.pe',
}

export const config = {
  maxDuration: 30,
}

export default async function handler(req, res) {
  // Seguridad: solo Vercel Cron puede llamar esto
  if (req.headers.authorization !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const todayStr = today.toISOString().split('T')[0]
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Consultar tareas con recordatorio activo que vencen hoy o mañana
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/tasks?remind=eq.true&status=neq.done&due_date=in.(${todayStr},${tomorrowStr})&select=*`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    )

    const tasks = await response.json()

    if (!tasks || tasks.length === 0) {
      return res.status(200).json({ message: 'Sin recordatorios para hoy', sent: 0 })
    }

    // Agrupar por destinatario
    const byRecipient = { alan: [], mercedes: [] }

    for (const task of tasks) {
      const isToday = task.due_date === todayStr
      const taskInfo = { ...task, isToday }

      if (task.assignee === 'alan') byRecipient.alan.push(taskInfo)
      else if (task.assignee === 'mercedes') byRecipient.mercedes.push(taskInfo)
      else if (task.assignee === 'both') {
        byRecipient.alan.push(taskInfo)
        byRecipient.mercedes.push(taskInfo)
      }
    }

    let sent = 0

    for (const [person, personTasks] of Object.entries(byRecipient)) {
      if (personTasks.length === 0) continue

      const email = EMAILS[person]
      const name = person === 'alan' ? 'Dr. Alan' : 'Dra. Mercedes'

      const todayTasks = personTasks.filter(t => t.isToday)
      const tomorrowTasks = personTasks.filter(t => !t.isToday)

      const html = buildEmailHtml(name, todayTasks, tomorrowTasks)

      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Eleuterio <recordatorios@eleuterio-project.vercel.app>',
          to: email,
          subject: `📋 ${personTasks.length} tarea${personTasks.length > 1 ? 's' : ''} pendiente${personTasks.length > 1 ? 's' : ''} — Eleuterio`,
          html,
        }),
      })

      if (emailRes.ok) sent++
    }

    return res.status(200).json({ message: 'Recordatorios enviados', sent, tasks: tasks.length })
  } catch (error) {
    console.error('Error en cron de recordatorios:', error)
    return res.status(500).json({ error: error.message })
  }
}

function buildEmailHtml(name, todayTasks, tomorrowTasks) {
  const taskRow = (task) => {
    const priorityColor = task.priority === 'high' ? '#A32D2D' : task.priority === 'low' ? '#3B6D11' : '#854F0B'
    const priorityLabel = task.priority === 'high' ? '↑ Alta' : task.priority === 'low' ? '↓ Baja' : '— Media'
    return `
      <tr>
        <td style="padding:10px 0; border-bottom:1px solid #f0f0f0;">
          <div style="font-size:14px; font-weight:600; color:#1a1a1a; margin-bottom:4px;">${task.title}</div>
          ${task.next_step ? `<div style="font-size:12px; color:#666; margin-bottom:4px;">→ ${task.next_step}</div>` : ''}
          <span style="font-size:11px; color:${priorityColor}; font-weight:500;">${priorityLabel}</span>
        </td>
      </tr>
    `
  }

  const section = (title, color, tasks) => tasks.length === 0 ? '' : `
    <div style="margin-bottom:24px;">
      <div style="font-size:12px; font-weight:700; color:${color}; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:12px;">${title}</div>
      <table style="width:100%; border-collapse:collapse;">
        ${tasks.map(taskRow).join('')}
      </table>
    </div>
  `

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0; padding:0; background:#f5f5f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:520px; margin:32px auto; background:white; border-radius:16px; overflow:hidden; box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <div style="background:#1a1a1a; padding:24px 32px; display:flex; align-items:center; gap:12px;">
          <div style="width:36px; height:36px; background:#378ADD; border-radius:10px; display:flex; align-items:center; justify-content:center;">
            <span style="color:white; font-weight:800; font-size:18px;">E</span>
          </div>
          <div>
            <div style="color:white; font-weight:700; font-size:16px;">Eleuterio</div>
            <div style="color:#888; font-size:12px;">Recordatorio de tareas</div>
          </div>
        </div>

        <!-- Body -->
        <div style="padding:28px 32px;">
          <p style="font-size:15px; color:#333; margin:0 0 24px;">
            Hola <strong>${name}</strong>, tienes tareas pendientes que requieren tu atención:
          </p>

          ${section('⚠️ Vencen hoy', '#A32D2D', todayTasks)}
          ${section('📅 Vencen mañana', '#854F0B', tomorrowTasks)}

          <div style="margin-top:24px; text-align:center;">
            <a href="https://eleuterio-project.vercel.app" 
               style="display:inline-block; background:#378ADD; color:white; text-decoration:none; padding:12px 28px; border-radius:10px; font-size:14px; font-weight:600;">
              Abrir Eleuterio
            </a>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:16px 32px; border-top:1px solid #f0f0f0; text-align:center;">
          <p style="font-size:11px; color:#aaa; margin:0;">
            Enviado automáticamente por Eleuterio · Solo recibes esto porque activaste recordatorios en la tarea
          </p>
        </div>
      </div>
    </body>
    </html>
  `
}
