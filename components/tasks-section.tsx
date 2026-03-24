"use client"

import { useState, useRef, useEffect } from "react"
import { Check, Trash2, Clock, ArrowUpFromLine, Plus, CalendarClock, ChevronDown, Tag } from "lucide-react"
import { Task, mockCarriedForwardTasks } from "@/lib/mock-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const PREDEFINED_TOPICS = [
  "Work",
  "Personal",
  "Health",
  "Learning",
  "Finance",
  "Home",
]

interface TaskRowProps {
  task: Task
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  disabled?: boolean
}

function TaskRow({ task, onToggle, onDelete, disabled }: TaskRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 py-3 px-4 rounded-xl group transition-all duration-150",
        "hover:bg-secondary/60",
        task.status === "completed" && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={() => !disabled && onToggle(task.id)}
        disabled={disabled}
        aria-label={task.status === "completed" ? "Mark incomplete" : "Mark complete"}
        className={cn(
          "w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all duration-150",
          task.status === "completed"
            ? "bg-primary border-primary"
            : "border-border hover:border-primary/60",
          disabled && "cursor-default"
        )}
      >
        {task.status === "completed" && <Check className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium text-foreground truncate transition-all",
            task.status === "completed" && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">{task.time}</span>
          {task.topic && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
              {task.topic}
            </span>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span
        className={cn(
          "text-[10px] font-semibold px-2 py-1 rounded-lg shrink-0",
          task.status === "completed"
            ? "bg-primary/15 text-primary"
            : "bg-secondary text-muted-foreground"
        )}
      >
        {task.status === "completed" ? "Done" : "Pending"}
      </span>

      {/* Delete */}
      {!disabled && (
        <button
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

interface TasksSectionProps {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  onAddTask?: (task: Task) => void
  showNotification?: (msg: string) => void
}

export function TasksSection({ tasks, setTasks, showNotification }: TasksSectionProps) {
  const [newTitle, setNewTitle] = useState("")
  const [newTime, setNewTime] = useState("09:00")
  const [newTopic, setNewTopic] = useState("")
  const [customTopic, setCustomTopic] = useState("")
  const [showTopicDropdown, setShowTopicDropdown] = useState(false)
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [carriedTasks, setCarriedTasks] = useState<Task[]>(mockCarriedForwardTasks)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowTopicDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t
      )
    )
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const deleteCarriedTask = (id: string) => {
    setCarriedTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const toggleCarried = (id: string) => {
    setCarriedTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status: t.status === "completed" ? "pending" : "completed" } : t
      )
    )
  }

  const selectTopic = (topic: string) => {
    setNewTopic(topic)
    setShowTopicDropdown(false)
    setShowCustomInput(false)
    setCustomTopic("")
  }

  const handleAddCustomTopic = () => {
    setShowCustomInput(true)
    setShowTopicDropdown(false)
  }

  const confirmCustomTopic = () => {
    if (customTopic.trim()) {
      setNewTopic(customTopic.trim())
      setCustomTopic("")
      setShowCustomInput(false)
    }
  }

  const addTask = () => {
    if (!newTitle.trim()) return
    const timeLabel = newTime
      ? new Date(`2000-01-01T${newTime}`).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
      : "Any time"
    const task: Task = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      time: timeLabel,
      status: "pending",
      topic: newTopic || undefined,
    }
    setTasks((prev) => [...prev, task])
    showNotification?.(`Task '${task.title}' scheduled at ${task.time}`)
    setNewTitle("")
    setNewTime("09:00")
    setNewTopic("")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Carried forward */}
      {carriedTasks.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border bg-chart-5/5">
            <ArrowUpFromLine className="w-4 h-4 text-chart-5" />
            <h3 className="text-sm font-semibold text-foreground">Moved from Yesterday</h3>
            <span className="ml-auto text-xs text-muted-foreground">{carriedTasks.length} tasks</span>
          </div>
          <div className="px-2 py-1">
            {carriedTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleCarried}
                onDelete={deleteCarriedTask}
              />
            ))}
          </div>
        </div>
      )}

      {/* Today's tasks */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border">
          <CalendarClock className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-foreground">{"Today's Tasks"}</h3>
          <span className="ml-auto text-xs text-muted-foreground">{tasks.length} tasks</span>
        </div>

        {/* Task list */}
        <div className="px-2 py-1">
          {tasks.length === 0 ? (
            <div className="py-12 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center">
                <CalendarClock className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No tasks for today</p>
              <p className="text-xs text-muted-foreground/70">Add your first task below to get started</p>
            </div>
          ) : (
            tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onDelete={deleteTask}
              />
            ))
          )}
        </div>

        {/* Add task */}
        <div className="px-4 pb-4 pt-3 border-t border-border">
          <div className="flex flex-col gap-2">
            {/* Row 1: Title input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                className="flex-1 h-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl text-sm"
              />
            </div>

            {/* Row 2: Topic, Time, Add button */}
            <div className="flex gap-2 items-center">
              {/* Topic dropdown */}
              <div className="relative" ref={dropdownRef}>
                {showCustomInput ? (
                  <div className="flex gap-1">
                    <Input
                      placeholder="Custom topic..."
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && confirmCustomTopic()}
                      className="w-28 h-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground rounded-xl text-sm"
                      autoFocus
                    />
                    <Button
                      onClick={confirmCustomTopic}
                      size="sm"
                      className="h-9 px-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTopicDropdown(!showTopicDropdown)}
                    className="flex items-center gap-2 h-9 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground hover:bg-secondary/80 transition-colors min-w-[120px]"
                  >
                    <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className={cn("flex-1 text-left truncate", !newTopic && "text-muted-foreground")}>
                      {newTopic || "Topic"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                )}

                {/* Dropdown menu */}
                {showTopicDropdown && (
                  <div className="absolute top-full left-0 mt-1 w-40 bg-popover border border-border rounded-xl shadow-lg py-1 z-20">
                    {PREDEFINED_TOPICS.map((topic) => (
                      <button
                        key={topic}
                        onClick={() => selectTopic(topic)}
                        className={cn(
                          "w-full px-3 py-2 text-left text-sm hover:bg-secondary/60 transition-colors",
                          newTopic === topic ? "text-primary font-medium" : "text-foreground"
                        )}
                      >
                        {topic}
                      </button>
                    ))}
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={handleAddCustomTopic}
                      className="w-full px-3 py-2 text-left text-sm text-primary hover:bg-secondary/60 transition-colors flex items-center gap-2"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add other
                    </button>
                    {newTopic && (
                      <>
                        <div className="border-t border-border my-1" />
                        <button
                          onClick={() => selectTopic("")}
                          className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-secondary/60 transition-colors"
                        >
                          Clear topic
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Time picker */}
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                className="h-9 px-3 bg-secondary border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {/* Add button */}
              <Button
                onClick={addTask}
                className="h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
                aria-label="Add task"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
