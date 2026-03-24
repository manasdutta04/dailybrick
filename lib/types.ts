export type TaskStatus = "pending" | "completed"

export interface Task {
  id: string
  title: string
  time: string
  status: TaskStatus
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
  teamRank: string
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
