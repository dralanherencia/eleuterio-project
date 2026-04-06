declare module 'frappe-gantt' {
  interface GanttTask {
    id: string
    name: string
    start: string
    end: string
    progress: number
    custom_class?: string
  }
  interface GanttOptions {
    view_mode?: string
    date_format?: string
    on_click?: (task: GanttTask) => void
    on_progress_change?: (task: GanttTask, progress: number) => void
  }
  export default class Gantt {
    constructor(wrapper: HTMLElement, tasks: GanttTask[], options?: GanttOptions)
    change_view_mode(mode: string): void
  }
}
