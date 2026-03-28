import type { User } from "@supabase/supabase-js"
import { isSupabaseConfigured, supabase } from "@/lib/supabase"
import type { AppSnapshot, Task, TaskScope, TaskStatus, TeamMember, TopicProgress, UserProfile } from "@/lib/types"

interface DbTask {
  id: string
  user_id: string
  task_scope: TaskScope
  shared_task_key: string | null
  calendar_event_id: string | null
  title: string
  topic: string | null
  due_date: string
  reminder_time: string | null
  status: TaskStatus
  carried_forward: boolean
  team_id: string | null
}

interface DbTeam {
  id: string
  code: string
  owner_id: string
}

interface DbMember {
  id: string
  team_id: string
  user_id: string | null
  invited_email: string
  role: "owner" | "member"
}

interface DbProfile {
  user_id: string
  email: string
  full_name: string
}

interface DbTopicProgress {
  user_id: string
  topic: string
  total_count: number
  completed_count: number
}

const DB_TASK_SELECT =
  "id,user_id,task_scope,shared_task_key,calendar_event_id,title,topic,due_date,reminder_time,status,carried_forward,team_id"
const GOOGLE_PROVIDER_TOKEN_STORAGE_KEY = "dailybrick_google_provider_token"

const CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"

function assertSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
  }
}

function getPublicAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim()
  if (configured) {
    return configured.replace(/\/$/, "")
  }

  if (typeof window !== "undefined") {
    return window.location.origin
  }

  return "http://localhost:3000"
}

function getTodayLocalDateString(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, "0")
  const day = `${now.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${day}`
}

function getWeekStartDateString(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  const year = monday.getFullYear()
  const month = `${monday.getMonth() + 1}`.padStart(2, "0")
  const date = `${monday.getDate()}`.padStart(2, "0")
  return `${year}-${month}-${date}`
}

function time24To12Label(time: string | null): string {
  if (!time) return "Any time"
  const [hourStr, minuteStr] = time.split(":")
  const hour24 = Number(hourStr)
  const minute = Number(minuteStr)
  if (Number.isNaN(hour24) || Number.isNaN(minute)) return "Any time"
  const period = hour24 >= 12 ? "PM" : "AM"
  const hour12 = hour24 % 12 || 12
  return `${hour12}:${`${minute}`.padStart(2, "0")} ${period}`
}

function initials(fullName: string, email: string): string {
  const name = fullName.trim()
  if (!name) {
    const prefix = email.split("@")[0] ?? "U"
    return prefix.slice(0, 2).toUpperCase()
  }
  const parts = name.split(" ").filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

async function generateUniqueTeamCode(): Promise<string> {
  for (let i = 0; i < 8; i += 1) {
    let code = ""
    const bytes = new Uint8Array(10)
    crypto.getRandomValues(bytes)
    for (const value of bytes) {
      code += CODE_ALPHABET[value % CODE_ALPHABET.length]
    }

    const { data } = await supabase.from("teams").select("id").eq("code", code).maybeSingle()
    if (!data) return code
  }
  throw new Error("Could not generate a unique team code. Please try again.")
}

function mapTask(task: DbTask): Task {
  return {
    id: task.id,
    ownerId: task.user_id,
    taskScope: task.task_scope,
    sharedTaskKey: task.shared_task_key ?? undefined,
    calendarEventId: task.calendar_event_id ?? undefined,
    teamId: task.team_id,
    title: task.title,
    topic: task.topic ?? undefined,
    dueDate: task.due_date,
    time: time24To12Label(task.reminder_time),
    status: task.status,
    carriedForward: task.carried_forward,
  }
}

function getTaskDateTimeWindow(dueDate: string, reminderTime: string | null) {
  const fallback = "09:00:00"
  const clock = reminderTime ?? fallback
  const start = new Date(`${dueDate}T${clock}`)
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid task date/time for calendar sync: ${dueDate} ${clock}`)
  }

  const end = new Date(start)
  end.setMinutes(end.getMinutes() + 30)

  return {
    startDateTime: start.toISOString(),
    endDateTime: end.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  }
}

function getCachedGoogleProviderToken(): string | null {
  if (typeof window === "undefined") return null
  return window.localStorage.getItem(GOOGLE_PROVIDER_TOKEN_STORAGE_KEY)
}

function setCachedGoogleProviderToken(token: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(GOOGLE_PROVIDER_TOKEN_STORAGE_KEY, token)
}

function clearCachedGoogleProviderToken() {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(GOOGLE_PROVIDER_TOKEN_STORAGE_KEY)
}

async function googleCalendarRequest(token: string, url: string, init: RequestInit): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    const details = await response.text().catch(() => "")
    throw new Error(`Google Calendar API ${response.status}: ${details}`)
  }

  return response
}

async function getGoogleProviderToken(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession()
  if (error) throw error

  const sessionToken = data.session?.provider_token ?? null
  if (sessionToken) {
    setCachedGoogleProviderToken(sessionToken)
    return sessionToken
  }

  return getCachedGoogleProviderToken()
}

async function syncTaskWithGoogleCalendar(task: DbTask) {
  const token = await getGoogleProviderToken()
  if (!token) return

  if (task.status === "completed") {
    if (!task.calendar_event_id) return

    try {
      await googleCalendarRequest(
        token,
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(task.calendar_event_id)}`,
        { method: "DELETE" }
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : ""
      if (!message.includes("404")) {
        throw err
      }
    }

    await supabase.from("tasks").update({ calendar_event_id: null }).eq("id", task.id)
    return
  }

  const { startDateTime, endDateTime, timeZone } = getTaskDateTimeWindow(task.due_date, task.reminder_time)

  const payload = {
    summary: task.title,
    description: `DailyBrick task${task.topic ? ` | Topic: ${task.topic}` : ""}${
      task.task_scope === "team" ? " | Team task" : ""
    }`,
    start: { dateTime: startDateTime, timeZone },
    end: { dateTime: endDateTime, timeZone },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "popup", minutes: 0 },
        { method: "email", minutes: 10 },
      ],
    },
  }

  if (task.calendar_event_id) {
    await googleCalendarRequest(
      token,
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(task.calendar_event_id)}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    )
    return
  }

  const response = await googleCalendarRequest(token, "https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const created = (await response.json()) as { id?: string }
  if (!created.id) return

  await supabase.from("tasks").update({ calendar_event_id: created.id }).eq("id", task.id)
}

async function syncMyTaskRowsWithGoogleCalendar(rows: DbTask[]) {
  if (rows.length === 0) return
  for (const row of rows) {
    try {
      if (row.status === "completed" && row.calendar_event_id) {
        await syncTaskWithGoogleCalendar(row)
      }
      if (row.status === "pending") {
        await syncTaskWithGoogleCalendar(row)
      }
    } catch (err) {
      // Calendar sync is best-effort and must not break task operations.
      console.warn("Calendar sync skipped for task", row.id, err)
    }
  }
}

async function ensureProfile(user: User): Promise<UserProfile> {
  const defaultName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "DailyBrick User"
  const email = user.email ?? ""

  const { data: existing, error: fetchError } = await supabase
    .from("profiles")
    .select("user_id,email,full_name")
    .eq("user_id", user.id)
    .maybeSingle<DbProfile>()

  if (fetchError) throw fetchError

  if (existing) {
    return {
      id: existing.user_id,
      email: existing.email,
      fullName: existing.full_name,
    }
  }

  const { data: created, error: createError } = await supabase
    .from("profiles")
    .insert({
      user_id: user.id,
      email,
      full_name: defaultName,
    })
    .select("user_id,email,full_name")
    .single<DbProfile>()

  if (createError) throw createError

  return {
    id: created.user_id,
    email: created.email,
    fullName: created.full_name,
  }
}

async function claimInvites(user: User): Promise<void> {
  if (!user.email) return

  await supabase
    .from("team_members")
    .update({ user_id: user.id })
    .is("user_id", null)
    .ilike("invited_email", user.email)
}

async function carryForwardPendingTasks(userId: string): Promise<void> {
  const today = getTodayLocalDateString()

  await supabase
    .from("tasks")
    .update({
      due_date: today,
      carried_forward: true,
      reminder_sent_at: null,
    })
    .eq("user_id", userId)
    .eq("status", "pending")
    .lt("due_date", today)
}

async function cleanupOldCompletedTasks(userId: string): Promise<void> {
  const today = getTodayLocalDateString()

  await supabase
    .from("tasks")
    .delete()
    .eq("user_id", userId)
    .eq("status", "completed")
    .lt("due_date", today)
}

async function adjustTopicProgress(params: {
  userId: string
  topic: string
  totalDelta?: number
  completedDelta?: number
}) {
  const topic = params.topic.trim()
  if (!topic) return

  const totalDelta = params.totalDelta ?? 0
  const completedDelta = params.completedDelta ?? 0
  if (totalDelta === 0 && completedDelta === 0) return

  const { data: existing, error: fetchError } = await supabase
    .from("topic_progress")
    .select("user_id,topic,total_count,completed_count")
    .eq("user_id", params.userId)
    .eq("topic", topic)
    .maybeSingle<DbTopicProgress>()

  if (fetchError) throw fetchError

  const nextTotal = Math.max(0, (existing?.total_count ?? 0) + totalDelta)
  const nextCompleted = Math.max(0, (existing?.completed_count ?? 0) + completedDelta)

  const { error: upsertError } = await supabase.from("topic_progress").upsert(
    {
      user_id: params.userId,
      topic,
      total_count: nextTotal,
      completed_count: nextCompleted,
    },
    { onConflict: "user_id,topic" }
  )

  if (upsertError) throw upsertError
}

async function getUserTeam(userId: string): Promise<{ team: DbTeam | null; members: DbMember[] }> {
  const { data: membershipRows, error: membershipError } = await supabase
    .from("team_members")
    .select("id,team_id,user_id,invited_email,role")
    .eq("user_id", userId)
    .returns<DbMember[]>()

  if (membershipError) throw membershipError

  const membership = membershipRows?.[0]
  if (!membership) return { team: null, members: [] }

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("id,code,owner_id")
    .eq("id", membership.team_id)
    .single<DbTeam>()

  if (teamError) throw teamError

  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("id,team_id,user_id,invited_email,role")
    .eq("team_id", membership.team_id)
    .returns<DbMember[]>()

  if (membersError) throw membersError

  return { team, members: members ?? [] }
}

async function getProfiles(userIds: string[]): Promise<Map<string, DbProfile>> {
  if (userIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id,email,full_name")
    .in("user_id", userIds)
    .returns<DbProfile[]>()

  if (error) throw error

  return new Map((data ?? []).map((profile) => [profile.user_id, profile]))
}

async function getTodayTasksForUsers(userIds: string[]): Promise<DbTask[]> {
  if (userIds.length === 0) return []
  const today = getTodayLocalDateString()

  const { data, error } = await supabase
    .from("tasks")
    .select(DB_TASK_SELECT)
    .in("user_id", userIds)
    .eq("due_date", today)
    .order("reminder_time", { ascending: true })
    .returns<DbTask[]>()

  if (error) throw error

  return data ?? []
}

async function getUserTopicProgress(userId: string): Promise<TopicProgress[]> {
  const { data, error } = await supabase
    .from("topic_progress")
    .select("user_id,topic,total_count,completed_count")
    .eq("user_id", userId)
    .order("topic", { ascending: true })
    .returns<DbTopicProgress[]>()

  if (error) throw error

  return (data ?? []).map((row, index) => ({
    id: `topic-${index + 1}`,
    name: row.topic,
    completed: row.completed_count,
    total: row.total_count,
  }))
}

async function getDoneThisWeek(userId: string): Promise<number> {
  const weekStart = getWeekStartDateString()
  const today = getTodayLocalDateString()

  const { count, error } = await supabase
    .from("tasks")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "completed")
    .gte("due_date", weekStart)
    .lte("due_date", today)

  if (error) throw error
  return count ?? 0
}

async function getCompletionStreak(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("tasks")
    .select("due_date")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("due_date", { ascending: false })

  if (error) throw error

  const completedDates = new Set<string>((data ?? []).map((row) => row.due_date as string))
  if (completedDates.size === 0) return 0

  let streak = 0
  const cursor = new Date()

  while (true) {
    const year = cursor.getFullYear()
    const month = `${cursor.getMonth() + 1}`.padStart(2, "0")
    const day = `${cursor.getDate()}`.padStart(2, "0")
    const key = `${year}-${month}-${day}`

    if (!completedDates.has(key)) break
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

export async function signUpWithEmail(email: string, password: string, fullName: string) {
  assertSupabaseConfigured()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) throw error
  return data
}

export async function signInWithEmail(email: string, password: string) {
  assertSupabaseConfigured()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export async function signInWithGoogle(redirectTo?: string) {
  assertSupabaseConfigured()
  const finalRedirectTo = redirectTo ?? getPublicAppUrl()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: finalRedirectTo,
      scopes: "https://www.googleapis.com/auth/calendar.events",
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })

  if (error) throw error
  return data
}

export async function signOut() {
  assertSupabaseConfigured()
  const { error } = await supabase.auth.signOut()
  if (error) throw error
  clearCachedGoogleProviderToken()
}

export async function requestPasswordReset(email: string, redirectTo: string) {
  assertSupabaseConfigured()
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
  if (error) throw error
}

export async function bootstrapRecoverySessionFromUrl() {
  assertSupabaseConfigured()

  if (typeof window === "undefined") return false
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash

  if (!hash) return false

  const params = new URLSearchParams(hash)
  const accessToken = params.get("access_token")
  const refreshToken = params.get("refresh_token")
  const type = params.get("type")

  if (!accessToken || !refreshToken || type !== "recovery") return false

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  })

  if (error) throw error

  // Remove sensitive tokens from URL after session bootstrap.
  window.history.replaceState({}, document.title, window.location.pathname)
  return true
}

export async function updatePassword(newPassword: string) {
  assertSupabaseConfigured()
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

export async function updateProfileName(params: { userId: string; fullName: string }) {
  assertSupabaseConfigured()
  const trimmedName = params.fullName.trim()
  if (!trimmedName) throw new Error("Name cannot be empty")

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: trimmedName })
    .eq("user_id", params.userId)

  if (profileError) throw profileError

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: trimmedName },
  })

  if (authError) throw authError
}

export async function clearAllUserTasks(userId: string) {
  assertSupabaseConfigured()
  const { error } = await supabase.from("tasks").delete().eq("user_id", userId)
  if (error) throw error
}

export async function getCurrentUser() {
  assertSupabaseConfigured()
  const { data, error } = await supabase.auth.getUser()
  if (error) {
    // No active session is expected for logged-out users.
    if (error.name === "AuthSessionMissingError") {
      return null
    }
    throw error
  }
  return data.user
}

export function onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
  assertSupabaseConfigured()
  return supabase.auth.onAuthStateChange(callback)
}

export async function loadAppSnapshot(user: User): Promise<AppSnapshot> {
  assertSupabaseConfigured()
  const profile = await ensureProfile(user)
  await claimInvites(user)
  await cleanupOldCompletedTasks(user.id)
  await carryForwardPendingTasks(user.id)

  const [{ team, members }, topics, doneThisWeek, streak] = await Promise.all([
    getUserTeam(user.id),
    getUserTopicProgress(user.id),
    getDoneThisWeek(user.id),
    getCompletionStreak(user.id),
  ])

  const memberUserIds = members.map((member) => member.user_id).filter((id): id is string => Boolean(id))
  const profilesById = await getProfiles(memberUserIds)

  const usersForTaskFetch = memberUserIds.length > 0 ? memberUserIds : [user.id]
  const allTodayTasks = await getTodayTasksForUsers(usersForTaskFetch)

  const tasksByUser = new Map<string, DbTask[]>()
  for (const task of allTodayTasks) {
    const existing = tasksByUser.get(task.user_id) ?? []
    existing.push(task)
    tasksByUser.set(task.user_id, existing)
  }

  const myTasksRaw = tasksByUser.get(user.id) ?? []
  await syncMyTaskRowsWithGoogleCalendar(myTasksRaw)
  const tasks = myTasksRaw.filter((task) => !task.carried_forward).map(mapTask)
  const carriedTasks = myTasksRaw.filter((task) => task.carried_forward).map(mapTask)

  const teamMembers: TeamMember[] = members.map((member) => {
    const p = member.user_id ? profilesById.get(member.user_id) : null
    const name = p?.full_name ?? member.invited_email.split("@")[0] ?? "Member"
    const email = p?.email ?? member.invited_email
    const memberTasks = (member.user_id ? tasksByUser.get(member.user_id) : []) ?? []
    const completed = memberTasks.filter((task) => task.status === "completed").length
    const total = memberTasks.length
    const completionPercent = total > 0 ? Math.round((completed / total) * 100) : 0

    return {
      id: member.id,
      name,
      email,
      avatarInitials: initials(name, email),
      completionPercent,
      isYou: member.user_id === user.id,
      tasks: memberTasks.map(mapTask),
    }
  })

  const topTopic = [...topics]
    .sort((a, b) => {
      const aPct = a.total === 0 ? 0 : a.completed / a.total
      const bPct = b.total === 0 ? 0 : b.completed / b.total
      return bPct - aPct
    })[0]?.name ?? "No topic yet"

  return {
    profile,
    teamId: team?.id ?? null,
    teamCode: team?.code ?? null,
    teamOwnerId: team?.owner_id ?? null,
    tasks,
    carriedTasks,
    teamMembers,
    topics,
    quickStats: {
      streak: `${streak} day${streak === 1 ? "" : "s"}`,
      doneThisWeek: `${doneThisWeek} task${doneThisWeek === 1 ? "" : "s"}`,
      topTopic,
      teamMembers: `${teamMembers.length}/2`,
    },
  }
}

export async function createTask(params: {
  userId: string
  teamId: string | null
  taskScope?: TaskScope
  title: string
  topic?: string
  reminderTime?: string
}) {
  assertSupabaseConfigured()
  const taskScope: TaskScope = params.taskScope ?? "individual"

  if (taskScope === "team") {
    if (!params.teamId) {
      throw new Error("Join or create a team to create team tasks.")
    }

    const { data: members, error: membersError } = await supabase
      .from("team_members")
      .select("user_id")
      .eq("team_id", params.teamId)

    if (membersError) throw membersError

    const memberUserIds = (members ?? [])
      .map((member) => member.user_id as string | null)
      .filter((id): id is string => Boolean(id))

    if (memberUserIds.length === 0) {
      throw new Error("No active team members found for this team.")
    }

    const sharedTaskKey = crypto.randomUUID()
    const payload = memberUserIds.map((memberUserId) => ({
      user_id: memberUserId,
      team_id: params.teamId,
      task_scope: "team" as const,
      shared_task_key: sharedTaskKey,
      title: params.title,
      topic: params.topic ?? null,
      reminder_time: params.reminderTime ?? null,
      due_date: getTodayLocalDateString(),
      status: "pending" as const,
      carried_forward: false,
      reminder_sent_at: null,
    }))

    const { data, error } = await supabase
      .from("tasks")
      .insert(payload)
      .select(DB_TASK_SELECT)
      .returns<DbTask[]>()

    if (error) throw error

    for (const row of data ?? []) {
      if (!row.topic) continue
      await adjustTopicProgress({ userId: row.user_id, topic: row.topic, totalDelta: 1 })
    }

    const myTaskRow = (data ?? []).find((row) => row.user_id === params.userId)
    if (myTaskRow) {
      try {
        await syncTaskWithGoogleCalendar(myTaskRow)
      } catch {
        // Calendar sync is best-effort and must not block task creation.
      }
    }

    const ownTask = (data ?? []).find((task) => task.user_id === params.userId) ?? data?.[0]
    if (!ownTask) {
      throw new Error("Could not create team task")
    }

    return mapTask(ownTask)
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: params.userId,
      team_id: params.teamId,
      task_scope: "individual",
      shared_task_key: null,
      title: params.title,
      topic: params.topic ?? null,
      reminder_time: params.reminderTime ?? null,
      due_date: getTodayLocalDateString(),
      status: "pending",
      carried_forward: false,
      reminder_sent_at: null,
      calendar_event_id: null,
    })
    .select(DB_TASK_SELECT)
    .single<DbTask>()

  if (error) throw error

  if (data.topic) {
    await adjustTopicProgress({ userId: data.user_id, topic: data.topic, totalDelta: 1 })
  }

  try {
    await syncTaskWithGoogleCalendar(data)
  } catch {
    // Calendar sync is best-effort and must not block task creation.
  }

  return mapTask(data)
}

export async function toggleTaskStatus(task: Pick<Task, "id" | "status" | "taskScope" | "sharedTaskKey">) {
  assertSupabaseConfigured()
  const nextStatus: TaskStatus = task.status === "completed" ? "pending" : "completed"

  const sourceRowsQuery = supabase
    .from("tasks")
    .select(DB_TASK_SELECT)

  if (task.taskScope === "team" && task.sharedTaskKey) {
    sourceRowsQuery.eq("shared_task_key", task.sharedTaskKey)
  } else {
    sourceRowsQuery.eq("id", task.id)
  }

  const { data: sourceRows, error: sourceError } = await sourceRowsQuery.returns<DbTask[]>()
  if (sourceError) throw sourceError

  const payload: { status: TaskStatus; reminder_sent_at?: string | null } = { status: nextStatus }
  if (nextStatus === "pending") {
    payload.reminder_sent_at = null
  }

  const query = supabase.from("tasks").update(payload)

  if (task.taskScope === "team" && task.sharedTaskKey) {
    query.eq("shared_task_key", task.sharedTaskKey)
  } else {
    query.eq("id", task.id)
  }

  const { data, error } = await query
    .select(DB_TASK_SELECT)
    .returns<DbTask[]>()

  if (error) throw error

  for (const row of sourceRows ?? []) {
    if (!row.topic) continue
    await adjustTopicProgress({
      userId: row.user_id,
      topic: row.topic,
      completedDelta: nextStatus === "completed" ? 1 : -1,
    })
  }

  const myUpdatedRow = (data ?? []).find((row) => row.id === task.id)
  if (myUpdatedRow) {
    try {
      await syncTaskWithGoogleCalendar(myUpdatedRow)
    } catch {
      // Calendar sync is best-effort and must not block task updates.
    }
  }

  const updatedTask = (data ?? []).find((row) => row.id === task.id) ?? data?.[0]
  if (!updatedTask) throw new Error("Could not update task")
  return mapTask(updatedTask)
}

export async function deleteTask(task: Pick<Task, "id" | "taskScope" | "sharedTaskKey">) {
  assertSupabaseConfigured()
  const sourceRowsQuery = supabase
    .from("tasks")
    .select(DB_TASK_SELECT)

  if (task.taskScope === "team" && task.sharedTaskKey) {
    sourceRowsQuery.eq("shared_task_key", task.sharedTaskKey)
  } else {
    sourceRowsQuery.eq("id", task.id)
  }

  const { data: sourceRows, error: sourceError } = await sourceRowsQuery.returns<DbTask[]>()
  if (sourceError) throw sourceError

  const mySourceRow = (sourceRows ?? []).find((row) => row.id === task.id)
  if (mySourceRow?.calendar_event_id) {
    try {
      await syncTaskWithGoogleCalendar({ ...mySourceRow, status: "completed" })
    } catch {
      // Calendar sync is best-effort and must not block task deletion.
    }
  }

  const query = supabase.from("tasks").delete()

  if (task.taskScope === "team" && task.sharedTaskKey) {
    query.eq("shared_task_key", task.sharedTaskKey)
  } else {
    query.eq("id", task.id)
  }

  const { error } = await query
  if (error) throw error

  for (const row of sourceRows ?? []) {
    if (!row.topic) continue
    await adjustTopicProgress({
      userId: row.user_id,
      topic: row.topic,
      totalDelta: -1,
      completedDelta: row.status === "completed" ? -1 : 0,
    })
  }
}

export async function createTeam(owner: User): Promise<{ teamId: string; code: string }> {
  assertSupabaseConfigured()

  const { data: existingMembership } = await supabase
    .from("team_members")
    .select("id")
    .eq("user_id", owner.id)
    .maybeSingle()

  if (existingMembership) {
    throw new Error("You are already in a team.")
  }

  const code = await generateUniqueTeamCode()

  const { data: team, error: teamError } = await supabase
    .from("teams")
    .insert({
      code,
      owner_id: owner.id,
    })
    .select("id,code")
    .single<{ id: string; code: string }>()

  if (teamError) throw teamError

  const { error: memberError } = await supabase.from("team_members").insert({
    team_id: team.id,
    user_id: owner.id,
    invited_email: owner.email,
    role: "owner",
  })

  if (memberError) throw memberError

  return { teamId: team.id, code: team.code }
}

export async function joinTeamByCode(params: { user: User; code: string }) {
  assertSupabaseConfigured()

  const code = params.code.trim()
  if (!code) throw new Error("Team code is required")

  const { data, error } = await supabase.rpc("join_team_by_code", { p_code: code })
  if (error) throw error

  return data as string
}

export async function leaveTeam(params: { userId: string }) {
  assertSupabaseConfigured()

  const { data: membership, error: membershipError } = await supabase
    .from("team_members")
    .select("id,team_id,role")
    .eq("user_id", params.userId)
    .maybeSingle<{ id: string; team_id: string; role: "owner" | "member" }>()

  if (membershipError) throw membershipError
  if (!membership) return

  if (membership.role === "owner") {
    throw new Error("Team owner cannot leave directly. Delete the team instead.")
  }

  const { error: clearTasksError } = await supabase
    .from("tasks")
    .update({ team_id: null })
    .eq("user_id", params.userId)
    .eq("team_id", membership.team_id)

  if (clearTasksError) throw clearTasksError

  const { error: leaveError } = await supabase
    .from("team_members")
    .delete()
    .eq("id", membership.id)
    .eq("user_id", params.userId)

  if (leaveError) throw leaveError
}

export async function deleteTeam(params: { teamId: string; ownerId: string }) {
  assertSupabaseConfigured()

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", params.teamId)
    .eq("owner_id", params.ownerId)

  if (error) throw error
}

export async function inviteTeamMember(params: { teamId: string; email: string; redirectTo?: string }) {
  assertSupabaseConfigured()
  const normalizedEmail = params.email.trim().toLowerCase()
  if (!normalizedEmail) throw new Error("Email is required")

  const { data: existingMembers, error: existingError } = await supabase
    .from("team_members")
    .select("id, invited_email")
    .eq("team_id", params.teamId)

  if (existingError) throw existingError

  if ((existingMembers ?? []).length >= 2) {
    throw new Error("Team is full. DailyBrick supports max 2 members per team.")
  }

  const alreadyInTeam = (existingMembers ?? []).some(
    (member) => String(member.invited_email).toLowerCase() === normalizedEmail
  )

  if (alreadyInTeam) {
    throw new Error("This email is already in your team.")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id,email")
    .ilike("email", normalizedEmail)
    .maybeSingle<{ user_id: string; email: string }>()

  const { error } = await supabase.from("team_members").insert({
    team_id: params.teamId,
    invited_email: normalizedEmail,
    user_id: profile?.user_id ?? null,
    role: "member",
  })

  if (error) throw error

  let emailSent = false
  let emailError: string | null = null

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email: normalizedEmail,
    options: {
      shouldCreateUser: true,
      emailRedirectTo: params.redirectTo,
      data: {
        invited_team_id: params.teamId,
      },
    },
  })

  if (otpError) {
    emailError = otpError.message
  } else {
    emailSent = true
  }

  return { emailSent, emailError }
}

export async function markDueRemindersAsSent(taskIds: string[]) {
  assertSupabaseConfigured()
  if (taskIds.length === 0) return
  const { error } = await supabase
    .from("tasks")
    .update({ reminder_sent_at: new Date().toISOString() })
    .in("id", taskIds)

  if (error) throw error
}

export async function getDueReminderTasks(userId: string): Promise<Task[]> {
  assertSupabaseConfigured()
  const today = getTodayLocalDateString()
  const now = new Date()
  const currentTime = `${`${now.getHours()}`.padStart(2, "0")}:${`${now.getMinutes()}`.padStart(2, "0")}:00`

  const { data, error } = await supabase
    .from("tasks")
    .select(DB_TASK_SELECT)
    .eq("user_id", userId)
    .eq("due_date", today)
    .eq("status", "pending")
    .not("reminder_time", "is", null)
    .is("reminder_sent_at", null)
    .lte("reminder_time", currentTime)
    .returns<DbTask[]>()

  if (error) throw error

  return (data ?? []).map(mapTask)
}
