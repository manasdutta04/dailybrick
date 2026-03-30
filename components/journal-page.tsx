"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  Bold,
  ClipboardPaste,
  Copy,
  Download,
  FileText,
  Italic,
  List,
  ListOrdered,
  Plus,
  Printer,
  Quote,
  Strikethrough,
  Trash2,
  Type,
  Underline,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { createJournalNote, deleteJournalNote, getJournalNotes, updateJournalNote } from "@/lib/dailybrick-api"
import type { JournalFontStyle, JournalNote } from "@/lib/types"
import { cn } from "@/lib/utils"

interface JournalPageProps {
  userId: string
  showNotification: (message: string) => void
}

const FONT_OPTIONS: { value: JournalFontStyle; label: string; family: string }[] = [
  { value: "system", label: "System", family: "ui-sans-serif, system-ui, sans-serif" },
  { value: "serif", label: "Serif", family: "ui-serif, Georgia, Cambria, Times New Roman, serif" },
  { value: "mono", label: "Mono", family: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace" },
  { value: "journal", label: "Journal", family: "Charter, Georgia, serif" },
]

const TEXT_SIZE_OPTIONS = [
  { value: "14px", label: "14" },
  { value: "16px", label: "16" },
  { value: "18px", label: "18" },
  { value: "20px", label: "20" },
]

const ACCENT_HOVER_BUTTON =
  "border-border/70 text-foreground hover:border-primary/45 hover:bg-primary/10 hover:text-primary"

type SaveState = "idle" | "saving" | "saved" | "error" | "title-required"

function extractPreview(contentHtml: string): string {
  if (typeof window === "undefined") return ""
  const div = document.createElement("div")
  div.innerHTML = contentHtml
  return (div.textContent ?? "").replace(/\s+/g, " ").trim()
}

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function JournalPage({ userId, showNotification }: JournalPageProps) {
  const [notes, setNotes] = useState<JournalNote[]>([])
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null)
  const [title, setTitle] = useState("")
  const [contentHtml, setContentHtml] = useState("")
  const [fontStyle, setFontStyle] = useState<JournalFontStyle>("system")
  const [textSize, setTextSize] = useState<string>("16px")
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [saveState, setSaveState] = useState<SaveState>("idle")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  const editorRef = useRef<HTMLDivElement>(null)
  const saveTimerRef = useRef<number | null>(null)
  const lastSyncedRef = useRef<string>("")

  const selectedNote = useMemo(
    () => notes.find((note) => note.id === selectedNoteId) ?? null,
    [notes, selectedNoteId]
  )

  const currentFontFamily = useMemo(
    () => FONT_OPTIONS.find((option) => option.value === fontStyle)?.family ?? FONT_OPTIONS[0].family,
    [fontStyle]
  )

  const syncSelectionDraft = useCallback((note: JournalNote) => {
    setSelectedNoteId(note.id)
    setTitle(note.title)
    setContentHtml(note.contentHtml)
    setFontStyle(note.fontStyle)
    lastSyncedRef.current = JSON.stringify({
      title: note.title,
      contentHtml: note.contentHtml,
      fontStyle: note.fontStyle,
    })

    if (editorRef.current) {
      editorRef.current.innerHTML = note.contentHtml
    }
  }, [])

  const loadNotes = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await getJournalNotes(userId)
      setNotes(data)
      if (data.length > 0) {
        syncSelectionDraft(data[0])
      } else {
        setSelectedNoteId(null)
        setTitle("")
        setContentHtml("")
        setFontStyle("system")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not load journal notes"
      showNotification(message)
    } finally {
      setIsLoading(false)
    }
  }, [showNotification, syncSelectionDraft, userId])

  useEffect(() => {
    void loadNotes()
  }, [loadNotes])

  useEffect(() => {
    if (!selectedNoteId) return

    const payload = JSON.stringify({
      title: title.trim(),
      contentHtml,
      fontStyle,
    })

    if (payload === lastSyncedRef.current) return

    if (!title.trim()) {
      setSaveState("title-required")
      return
    }

    setSaveState("saving")

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(async () => {
      try {
        const updated = await updateJournalNote({
          noteId: selectedNoteId,
          title: title.trim(),
          contentHtml,
          fontStyle,
        })

        setNotes((prev) => {
          const merged = prev.map((note) => (note.id === updated.id ? updated : note))
          return merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        })

        lastSyncedRef.current = payload
        setSaveState("saved")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Could not sync note"
        showNotification(message)
        setSaveState("error")
      }
    }, 700)

    return () => {
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current)
      }
    }
  }, [contentHtml, fontStyle, selectedNoteId, showNotification, title])

  const handleCreateNote = async () => {
    try {
      setIsCreating(true)
      const nextIndex = notes.length + 1
      const created = await createJournalNote({
        userId,
        title: `Untitled Note ${nextIndex}`,
        contentHtml: "",
        fontStyle: "system",
      })

      setNotes((prev) => [created, ...prev])
      syncSelectionDraft(created)
      setSaveState("idle")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create note"
      showNotification(message)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteSelected = async () => {
    if (!selectedNote) return

    try {
      await deleteJournalNote(selectedNote.id)
      setNotes((prev) => {
        const remaining = prev.filter((note) => note.id !== selectedNote.id)
        if (remaining.length > 0) {
          syncSelectionDraft(remaining[0])
        } else {
          setSelectedNoteId(null)
          setTitle("")
          setContentHtml("")
          setFontStyle("system")
          lastSyncedRef.current = ""
        }
        return remaining
      })
      setSaveState("idle")
      setIsDeleteDialogOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not delete note"
      showNotification(message)
    }
  }

  const getCurrentEditorHtml = () => editorRef.current?.innerHTML ?? contentHtml

  const runFormatCommand = (command: string, value?: string) => {
    if (!editorRef.current) return
    editorRef.current.focus()
    document.execCommand(command, false, value)
    setContentHtml(editorRef.current.innerHTML)
  }

  const handleDownloadCurrent = () => {
    if (!selectedNote) return

    const safeTitle = selectedNote.title.trim().replace(/[^a-zA-Z0-9-_ ]/g, "") || "journal-note"
    const htmlDoc = `<!doctype html><html><head><meta charset="utf-8"><title>${selectedNote.title}</title></head><body>${getCurrentEditorHtml()}</body></html>`

    const blob = new Blob([htmlDoc], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${safeTitle}.html`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }

  const handleCopyCurrent = async () => {
    if (!selectedNote) return
    const text = extractPreview(getCurrentEditorHtml())
    if (!text) {
      showNotification("Nothing to copy yet")
      return
    }

    try {
      await navigator.clipboard.writeText(text)
      showNotification("Note copied")
    } catch {
      showNotification("Copy failed. Clipboard permission may be blocked.")
    }
  }

  const handlePasteIntoEditor = async () => {
    if (!editorRef.current) return

    try {
      const text = await navigator.clipboard.readText()
      if (!text) return
      editorRef.current.focus()
      document.execCommand("insertText", false, text)
      setContentHtml(editorRef.current.innerHTML)
      showNotification("Text pasted")
    } catch {
      showNotification("Paste failed. Use Ctrl+V if browser blocks clipboard access.")
    }
  }

  const handlePrintCurrent = () => {
    if (!selectedNote) return

    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700")
    if (!printWindow) {
      showNotification("Could not open print dialog window")
      return
    }

    const printable = `<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>${selectedNote.title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; margin: 40px; }
            h1 { margin: 0 0 16px; font-size: 22px; }
          </style>
        </head>
        <body>
          <h1>${selectedNote.title}</h1>
          ${getCurrentEditorHtml()}
          <script>window.onload = function(){ window.print(); window.close(); }</script>
        </body>
      </html>`

    printWindow.document.open()
    printWindow.document.write(printable)
    printWindow.document.close()
  }

  const saveStatusLabel =
    saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
      ? "Saved"
      : saveState === "title-required"
      ? "Title is required"
      : saveState === "error"
      ? "Sync failed"
      : "Auto-sync enabled"

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5">
        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={`journal-list-${index}`} className="h-24 w-full" />
          ))}
        </div>
        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-5">
      <aside className="rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-3 md:p-4 flex flex-col max-h-[calc(100vh-10rem)] shadow-[0_20px_80px_-60px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between mb-3 rounded-2xl border border-border/60 bg-gradient-to-r from-card via-secondary/35 to-card px-3 py-2">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Journal</p>
            <p className="text-sm font-semibold text-foreground">{notes.length} note{notes.length === 1 ? "" : "s"}</p>
          </div>
          <Button
            size="sm"
            className="h-8 rounded-lg text-xs bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => void handleCreateNote()}
            disabled={isCreating}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            New
          </Button>
        </div>

        <div className="overflow-y-auto pr-1 space-y-2">
          {notes.length === 0 && (
            <button
              type="button"
              onClick={() => void handleCreateNote()}
              className="w-full rounded-2xl border border-dashed border-border px-4 py-8 text-center hover:border-primary/40 hover:bg-secondary/40 transition-colors"
            >
              <FileText className="w-5 h-5 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-foreground">Create your first note</p>
              <p className="text-xs text-muted-foreground mt-1">Notes auto-save and sync to cloud.</p>
            </button>
          )}

          {notes.map((note) => {
            const preview = extractPreview(note.contentHtml)
            const isActive = note.id === selectedNoteId

            return (
              <button
                key={note.id}
                type="button"
                onClick={() => syncSelectionDraft(note)}
                className={cn(
                  "w-full text-left rounded-2xl border p-3 transition-all duration-150",
                  isActive
                    ? "border-primary/40 bg-primary/10 shadow-[0_8px_24px_-20px_rgba(16,185,129,0.8)]"
                    : "border-border bg-card/60 hover:bg-secondary/40"
                )}
              >
                <p className="text-sm font-semibold text-foreground truncate">{note.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1 min-h-8">{preview || "No content yet"}</p>
                <p className="text-[11px] text-muted-foreground/80 mt-2">{formatUpdatedAt(note.updatedAt)}</p>
              </button>
            )
          })}
        </div>
      </aside>

      <section className="rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-3 md:p-4 flex flex-col min-h-[70vh] shadow-[0_24px_90px_-60px_rgba(0,0,0,0.55)]">
        {selectedNote ? (
          <>
            <div className="flex flex-col gap-3 border-b border-border pb-3 sticky top-0 bg-card/95 backdrop-blur-md z-[2] rounded-2xl">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note title"
                  className="h-10 text-base font-semibold max-w-xl"
                  required
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={fontStyle}
                    onChange={(e) => setFontStyle(e.target.value as JournalFontStyle)}
                    className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground"
                    aria-label="Journal font style"
                  >
                    {FONT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={textSize}
                    onChange={(e) => setTextSize(e.target.value)}
                    className="h-9 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground"
                    aria-label="Journal text size"
                  >
                    {TEXT_SIZE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <Button variant="outline" className={cn("h-9 rounded-lg text-xs", ACCENT_HOVER_BUTTON)} onClick={handleCopyCurrent}>
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>

                  <Button variant="outline" className={cn("h-9 rounded-lg text-xs", ACCENT_HOVER_BUTTON)} onClick={handlePasteIntoEditor}>
                    <ClipboardPaste className="w-3.5 h-3.5 mr-1.5" />
                    Paste
                  </Button>

                  <Button variant="outline" className={cn("h-9 rounded-lg text-xs", ACCENT_HOVER_BUTTON)} onClick={handlePrintCurrent}>
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Print
                  </Button>

                  <Button variant="outline" className={cn("h-9 rounded-lg text-xs", ACCENT_HOVER_BUTTON)} onClick={handleDownloadCurrent}>
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download
                  </Button>

                  <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="h-9 rounded-lg text-xs text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-2xl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. The note will be removed from both local view and cloud sync.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          onClick={() => void handleDeleteSelected()}
                        >
                          Delete Note
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Button variant="outline" size="sm" className={cn("h-8 px-2", ACCENT_HOVER_BUTTON)} onClick={() => runFormatCommand("bold")}>
                  <Bold className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className={cn("h-8 px-2", ACCENT_HOVER_BUTTON)} onClick={() => runFormatCommand("italic")}>
                  <Italic className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className={cn("h-8 px-2", ACCENT_HOVER_BUTTON)} onClick={() => runFormatCommand("underline")}>
                  <Underline className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className={cn("h-8 px-2", ACCENT_HOVER_BUTTON)} onClick={() => runFormatCommand("strikeThrough")}>
                  <Strikethrough className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className={cn("h-8 px-2", ACCENT_HOVER_BUTTON)} onClick={() => runFormatCommand("insertUnorderedList")}>
                  <List className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className={cn("h-8 px-2", ACCENT_HOVER_BUTTON)} onClick={() => runFormatCommand("insertOrderedList")}>
                  <ListOrdered className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className={cn("h-8 px-2", ACCENT_HOVER_BUTTON)} onClick={() => runFormatCommand("formatBlock", "<blockquote>")}>
                  <Quote className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" className={cn("h-8 px-2", ACCENT_HOVER_BUTTON)} onClick={() => runFormatCommand("formatBlock", "<h2>")}>
                  <Type className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 pt-3">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                data-placeholder="Start writing your thoughts..."
                className="journal-editor min-h-[50vh] rounded-2xl border border-border bg-background/50 p-4 outline-none overflow-y-auto"
                onInput={(event) => {
                  setContentHtml((event.currentTarget as HTMLDivElement).innerHTML)
                }}
                style={{ fontFamily: currentFontFamily, fontSize: textSize }}
              />
            </div>

            <div className="pt-3 border-t border-border mt-3 flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{saveStatusLabel}</p>
              <p className="text-[11px] text-muted-foreground">
                Updated {selectedNote.updatedAt ? formatUpdatedAt(selectedNote.updatedAt) : "just now"}
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <FileText className="w-7 h-7 text-muted-foreground mx-auto mb-3" />
              <p className="text-base font-medium text-foreground mb-1">No note selected</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first journal entry and it will sync automatically.</p>
              <Button onClick={() => void handleCreateNote()}>
                <Plus className="w-4 h-4 mr-1.5" />
                Create Note
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
