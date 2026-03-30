export type TaskStatus = "pending" | "completed"
export type TaskScope = "individual" | "team"
export type JournalFontStyle = "system" | "serif" | "mono" | "journal"

export interface Task {
  id: string
  title: string
  time: string
  status: TaskStatus
  taskScope?: TaskScope
  sharedTaskKey?: string
  teamId?: string | null
  calendarEventId?: string
  carriedForward?: boolean
  topic?: string
  dueDate?: string
  ownerId?: string
}

export interface TeamMember {
  id: string
  name: string
  email: string
  avatarInitials: string
  completionPercent: number
  tasks: Task[]
  isYou?: boolean
}

export interface TopicProgress {
  id: string
  name: string
  completed: number
  total: number
}

export interface UserProfile {
  id: string
  email: string
  fullName: string
}

export interface DashboardQuickStats {
  streak: string
  doneThisWeek: string
  topTopic: string
  teamMembers: string
}

export interface AppSnapshot {
  profile: UserProfile
  teamId: string | null
  teamCode: string | null
  teamOwnerId: string | null
  tasks: Task[]
  carriedTasks: Task[]
  teamMembers: TeamMember[]
  topics: TopicProgress[]
  quickStats: DashboardQuickStats
}

export interface JournalNote {
  id: string
  userId: string
  title: string
  contentHtml: string
  fontStyle: JournalFontStyle
  createdAt: string
  updatedAt: string
}
