"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------
import { updateName, updateDashboardPhoto } from "@/app/actions/settings";
import {
  addStickyNote,
  updateStickyNote,
  deleteStickyNote,
} from "@/app/actions/sticky-notes";
import {
  addTodo,
  toggleTodo,
  deleteTodo,
  resetTodos,
} from "@/app/actions/todos";
import {
  addEvent,
  deleteEvent,
} from "@/app/actions/events";
import {
  addCalendar,
  toggleCalendarVisibility,
} from "@/app/actions/calendars";
import {
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry,
} from "@/app/actions/journal";
import {
  addProject,
  updateProject,
  deleteProject as deleteProjectAction,
  addSubtask,
  toggleSubtask,
  deleteSubtask,
} from "@/app/actions/projects";
import {
  addGoal,
  updateGoal,
  deleteGoal as deleteGoalAction,
  updateGoalProgress,
} from "@/app/actions/goals";
import {
  addContact,
  updateContact,
  deleteContact as deleteContactAction,
  markContacted,
} from "@/app/actions/contacts";
import {
  addBookmark,
  deleteBookmark as deleteBookmarkAction,
} from "@/app/actions/bookmarks";

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
import {
  formatDate,
  moodLabel,
  daysUntilBirthday,
  stripHtml,
  getEventsForDate,
  getUpcomingEvents,
  type EventRecord,
} from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types for props
// ---------------------------------------------------------------------------
type SettingsRow = {
  userId: string;
  name: string | null;
  dashboardPhotoUrl: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type CalendarRow = {
  id: string;
  userId: string;
  name: string;
  color: string;
  visible: boolean | null;
  createdAt: Date | null;
};

type EventRow = {
  id: string;
  userId: string;
  title: string;
  date: string;
  time: string | null;
  color: string;
  recurrence: string;
  notes: string | null;
  createdAt: Date | null;
};

type JournalRow = {
  id: string;
  userId: string;
  title: string | null;
  date: string;
  mood: string | null;
  body: string | null;
  createdAt: Date | null;
};

type TodoRow = {
  id: string;
  userId: string;
  text: string;
  done: boolean | null;
  sortOrder: number | null;
  createdAt: Date | null;
};

type SubtaskRow = {
  id: string;
  projectId: string;
  text: string;
  done: boolean | null;
  sortOrder: number | null;
};

type ProjectRow = {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  status: string;
  due: string | null;
  createdAt: Date | null;
  subtasks: SubtaskRow[];
};

type GoalRow = {
  id: string;
  userId: string;
  title: string;
  category: string | null;
  progress: number | null;
  target: string | null;
  notes: string | null;
  createdAt: Date | null;
};

type ContactRow = {
  id: string;
  userId: string;
  name: string;
  relationship: string | null;
  birthday: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  photoUrl: string | null;
  lastContacted: string | null;
  createdAt: Date | null;
};

type BookmarkRow = {
  id: string;
  userId: string;
  title: string;
  url: string;
  description: string | null;
  category: string | null;
  createdAt: Date | null;
};

type NoteRow = {
  id: string;
  userId: string;
  text: string | null;
  sortOrder: number | null;
  createdAt: Date | null;
};

// ---------------------------------------------------------------------------
// Component props
// ---------------------------------------------------------------------------
interface CrmAppProps {
  initialSettings: SettingsRow;
  initialCalendars: CalendarRow[];
  initialEvents: EventRow[];
  initialJournal: JournalRow[];
  initialTodos: TodoRow[];
  initialProjects: ProjectRow[];
  initialGoals: GoalRow[];
  initialContacts: ContactRow[];
  initialBookmarks: BookmarkRow[];
  initialNotes: NoteRow[];
}

// ---------------------------------------------------------------------------
// SVG Icon Components
// ---------------------------------------------------------------------------
function IconHome({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconCalendar({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconBook({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  );
}

function IconTodo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  );
}

function IconPeople({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function IconBookmark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  );
}

function IconSettings({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const NOTE_COLORS = ["yellow", "green", "blue", "pink"] as const;
const SECTIONS = [
  { id: "dashboard", label: "Dashboard", Icon: IconHome },
  { id: "calendar", label: "Calendar", Icon: IconCalendar },
  { id: "journal", label: "Journal", Icon: IconBook },
  { id: "todos", label: "Todos & Goals", Icon: IconTodo },
  { id: "contacts", label: "Contacts", Icon: IconPeople },
  { id: "bookmarks", label: "Bookmarks", Icon: IconBookmark },
  { id: "settings", label: "Settings", Icon: IconSettings },
] as const;

const CALENDAR_COLORS = [
  "#A67C5B", "#5B8FA6", "#8B9E82", "#B07AA1", "#BFA98A",
  "#C0392B", "#D4843E", "#5B7FA6", "#7C8B5B", "#8B5B7C",
];

// ===========================================================================
// MAIN COMPONENT
// ===========================================================================
export default function CrmApp({
  initialSettings,
  initialCalendars,
  initialEvents,
  initialJournal,
  initialTodos,
  initialProjects,
  initialGoals,
  initialContacts,
  initialBookmarks,
  initialNotes,
}: CrmAppProps) {
  const router = useRouter();

  // -------------------------------------------------------------------------
  // Core UI state
  // -------------------------------------------------------------------------
  const [showBirthday, setShowBirthday] = useState(true);
  const [currentSection, setCurrentSection] = useState("dashboard");

  // -------------------------------------------------------------------------
  // Data mirrors (used for optimistic / local state)
  // -------------------------------------------------------------------------
  const settings = initialSettings;
  const calendarsData = initialCalendars;
  const eventsData = initialEvents;
  const journalData = initialJournal;
  const todosData = initialTodos;
  const projectsData = initialProjects;
  const goalsData = initialGoals;
  const contactsData = initialContacts;
  const bookmarksData = initialBookmarks;
  const notesData = initialNotes;

  // -------------------------------------------------------------------------
  // Live clock
  // -------------------------------------------------------------------------
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------------------
  // Calendar state
  // -------------------------------------------------------------------------
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calViewMode, setCalViewMode] = useState<"grid" | "list">("grid");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [dayDetailOpen, setDayDetailOpen] = useState(false);

  // Day detail form
  const [ddTitle, setDdTitle] = useState("");
  const [ddTime, setDdTime] = useState("");
  const [ddColor, setDdColor] = useState(calendarsData[0]?.color ?? "#A67C5B");
  const [ddRecur, setDdRecur] = useState("none");
  const [ddNotes, setDdNotes] = useState("");

  // -------------------------------------------------------------------------
  // Journal state
  // -------------------------------------------------------------------------
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(
    journalData.length > 0 ? journalData[0].id : null
  );
  const [journalSearch, setJournalSearch] = useState("");
  const [entryTitle, setEntryTitle] = useState(journalData[0]?.title ?? "");
  const [entryDate, setEntryDate] = useState(journalData[0]?.date ?? "");
  const [entryMood, setEntryMood] = useState(journalData[0]?.mood ?? "");
  const journalBodyRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // -------------------------------------------------------------------------
  // Todos tab state
  // -------------------------------------------------------------------------
  const [todosTab, setTodosTab] = useState<"daily-todos" | "projects" | "goals">("daily-todos");
  const [todoInput, setTodoInput] = useState("");

  // -------------------------------------------------------------------------
  // Contact state
  // -------------------------------------------------------------------------
  const [contactSearch, setContactSearch] = useState("");
  const [contactSort, setContactSort] = useState("name");

  // -------------------------------------------------------------------------
  // Bookmark state
  // -------------------------------------------------------------------------
  const [bookmarkFilter, setBookmarkFilter] = useState("");

  // -------------------------------------------------------------------------
  // Modal state
  // -------------------------------------------------------------------------
  const [modal, setModal] = useState<{
    title: string;
    content: React.ReactNode;
    onSave: () => void;
  } | null>(null);

  // -------------------------------------------------------------------------
  // Toast state
  // -------------------------------------------------------------------------
  const [toasts, setToasts] = useState<{ id: string; message: string }[]>([]);

  // -------------------------------------------------------------------------
  // Settings local state
  // -------------------------------------------------------------------------
  const [settingsName, setSettingsName] = useState(settings.name ?? "");

  // =========================================================================
  // Helpers
  // =========================================================================
  const userName = settings.name || "Mom";
  const dashboardPhotoUrl = settings.dashboardPhotoUrl;

  function getGreeting() {
    const hour = now.getHours();
    let greet = "Good morning";
    if (hour >= 12 && hour < 17) greet = "Good afternoon";
    else if (hour >= 17) greet = "Good evening";
    return `${greet}, ${userName}!`;
  }

  function getDateTimeString() {
    return (
      now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }) +
      " \u00b7 " +
      now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    );
  }

  const eventsAsRecords: EventRecord[] = useMemo(
    () =>
      eventsData.map((e) => ({
        id: e.id,
        title: e.title,
        date: e.date,
        time: e.time ?? "",
        color: e.color,
        recurrence: e.recurrence,
        notes: e.notes ?? "",
      })),
    [eventsData]
  );

  const visibleColors = useMemo(
    () => new Set(calendarsData.filter((c) => c.visible !== false).map((c) => c.color)),
    [calendarsData]
  );

  function navigateTo(section: string) {
    setCurrentSection(section);
  }

  function showToast(message: string) {
    const id = Date.now().toString(36);
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  }

  function dismissToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  function closeModal() {
    setModal(null);
  }

  // =========================================================================
  // Toast for recurring events on mount
  // =========================================================================
  const toastShownRef = useRef(false);
  useEffect(() => {
    if (toastShownRef.current) return;
    toastShownRef.current = true;
    const todayStr = new Date().toISOString().split("T")[0];
    const todayEvents = getEventsForDate(eventsAsRecords, todayStr);
    todayEvents.forEach((ev) => {
      showToast(`Today: ${ev.title}${ev.time ? " at " + ev.time : ""}`);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================================
  // BIRTHDAY SCREEN
  // =========================================================================
  function renderBirthdayScreen() {
    if (!showBirthday) return null;
    const hasPhoto = !!dashboardPhotoUrl;
    return (
      <div
        id="birthday-screen"
        className={hasPhoto ? "has-photo" : ""}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundImage: hasPhoto ? `url(${dashboardPhotoUrl})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="bg-overlay" />
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="heart">&hearts;</div>
        ))}
        <div className="content">
          <h1>Happy Birthday, Mom</h1>
          <p className="subtitle">
            I am forever grateful for you and can&apos;t imagine life without you.
            <br /><br />
            I know how much you love having your life in order, and I truly
            believe this tool will help you do just that. A space to plan,
            organize, and keep everything in one place. Built just for you.
          </p>
          <button className="enter-btn" onClick={() => setShowBirthday(false)}>
            Enter My Space
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SIDEBAR
  // =========================================================================
  function renderSidebar() {
    return (
      <aside className="sidebar">
        <div className="logo">My Space</div>
        <nav>
          {SECTIONS.map(({ id, label, Icon }) => (
            <div
              key={id}
              className={`nav-item${currentSection === id ? " active" : ""}`}
              onClick={() => navigateTo(id)}
            >
              <span className="icon"><Icon /></span>
              {label}
            </div>
          ))}
        </nav>
      </aside>
    );
  }

  // =========================================================================
  // BOTTOM NAV (mobile)
  // =========================================================================
  function renderBottomNav() {
    return (
      <div className="bottom-nav">
        {SECTIONS.map(({ id, Icon }) => (
          <div
            key={id}
            className={`bnav-item${currentSection === id ? " active" : ""}`}
            onClick={() => navigateTo(id)}
          >
            <span className="icon"><Icon size={20} /></span>
          </div>
        ))}
      </div>
    );
  }

  // =========================================================================
  // DASHBOARD
  // =========================================================================
  function renderDashboard() {
    const todayStr = new Date().toISOString().split("T")[0];
    const top5Todos = todosData.slice(0, 5);
    const upcoming = getUpcomingEvents(eventsAsRecords, 3);
    const latestJournal = journalData.length > 0 ? journalData[0] : null;

    return (
      <div id="section-dashboard" className={`section${currentSection === "dashboard" ? " active" : ""}`}>
        <div
          className={`dashboard-bg${dashboardPhotoUrl ? "" : " no-photo"}`}
          id="dashboard-bg"
          style={dashboardPhotoUrl ? { backgroundImage: `url(${dashboardPhotoUrl})` } : undefined}
        />
        <div className="dashboard-inner">
          <div className="greeting-bar">
            <h1 id="greeting-text">{getGreeting()}</h1>
            <div className="datetime" id="datetime-display">{getDateTimeString()}</div>
          </div>

          <div className="quick-actions">
            <button onClick={() => { navigateTo("calendar"); openEventModal(); }}>+ Event</button>
            <button onClick={() => { navigateTo("journal"); handleCreateJournalEntry(); }}>+ Journal</button>
            <button onClick={() => navigateTo("todos")}>+ Todo</button>
            <button onClick={() => { navigateTo("contacts"); openContactModal(); }}>+ Contact</button>
            <button onClick={() => { navigateTo("bookmarks"); openBookmarkModal(); }}>+ Bookmark</button>
          </div>

          <div className="dashboard-grid">
            <div className="dash-card">
              <h3>Today&apos;s Tasks</h3>
              <div id="dash-todos">
                {todosData.length === 0 ? (
                  <div style={{ color: "var(--text-light)", fontSize: "0.9rem", padding: "8px 0" }}>
                    No tasks yet. Add some to stay on track.
                  </div>
                ) : (
                  <>
                    {top5Todos.map((t) => (
                      <div key={t.id} className="todo-item" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <span style={t.done ? { textDecoration: "line-through", opacity: 0.5 } : undefined}>
                          {t.text}
                        </span>
                      </div>
                    ))}
                    {todosData.length > 5 && (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-light)", paddingTop: "4px" }}>
                        +{todosData.length - 5} more
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="dash-card">
              <h3>Upcoming Events</h3>
              <div id="dash-events">
                {upcoming.length === 0 ? (
                  <div style={{ color: "var(--text-light)", fontSize: "0.9rem", padding: "8px 0" }}>
                    No upcoming events. Your schedule is clear.
                  </div>
                ) : (
                  upcoming.map((e, idx) => (
                    <div key={idx} className="event-item">
                      <span className="event-tag" style={{ background: e.color }} />
                      <strong>{e.title}</strong>
                      <div style={{ fontSize: "0.82rem", color: "var(--text-light)" }}>
                        {formatDate(e.date)}{e.time ? " at " + e.time : ""}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="dash-card" style={{ gridColumn: "span 2" }}>
              <h3>Recent Journal</h3>
              <div id="dash-journal">
                {!latestJournal ? (
                  <div style={{ color: "var(--text-light)", fontSize: "0.9rem", padding: "8px 0" }}>
                    No journal entries yet. Start writing your thoughts.
                  </div>
                ) : (
                  <div className="journal-preview">
                    <strong>{latestJournal.title || "Untitled"}</strong>
                    <div style={{ fontSize: "0.82rem", color: "var(--text-light)" }}>
                      {formatDate(latestJournal.date)}
                      {latestJournal.mood ? " \u00b7 " + moodLabel(latestJournal.mood) : ""}
                    </div>
                    <div style={{ fontSize: "0.9rem", marginTop: "6px" }}>
                      {stripHtml(latestJournal.body ?? "").substring(0, 150)}
                      {(latestJournal.body ?? "").length > 150 ? "..." : ""}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <h3 style={{ marginBottom: "12px", color: "var(--text-light)", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Sticky Notes
          </h3>
          <div className="sticky-notes-area" id="sticky-notes">
            {notesData.map((n, i) => (
              <StickyNote
                key={n.id}
                note={n}
                colorClass={NOTE_COLORS[i % NOTE_COLORS.length]}
                onDelete={async () => {
                  await deleteStickyNote(n.id);
                  router.refresh();
                }}
                onSave={async (text: string) => {
                  await updateStickyNote(n.id, text);
                  router.refresh();
                }}
              />
            ))}
            <div
              className="add-note-btn"
              onClick={async () => {
                await addStickyNote();
                router.refresh();
              }}
            >
              +
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CALENDAR
  // =========================================================================
  function changeMonth(dir: number) {
    setCalMonth((prev) => {
      let newMonth = prev + dir;
      if (newMonth > 11) {
        setCalYear((y) => y + 1);
        return 0;
      }
      if (newMonth < 0) {
        setCalYear((y) => y - 1);
        return 11;
      }
      return newMonth;
    });
  }

  function goToToday() {
    const n = new Date();
    setCalYear(n.getFullYear());
    setCalMonth(n.getMonth());
  }

  function openDayDetail(dateStr: string) {
    setSelectedDate(dateStr);
    setDayDetailOpen(true);
    setDdTitle("");
    setDdTime("");
    setDdColor(calendarsData[0]?.color ?? "#A67C5B");
    setDdRecur("none");
    setDdNotes("");
  }

  async function handleAddEventFromPanel() {
    if (!ddTitle.trim() || !selectedDate) return;
    await addEvent({
      title: ddTitle.trim(),
      date: selectedDate,
      time: ddTime,
      color: ddColor,
      recurrence: ddRecur,
      notes: ddNotes.trim(),
    });
    router.refresh();
    setDdTitle("");
    setDdTime("");
    setDdNotes("");
    setDdRecur("none");
  }

  async function handleDeleteEvent(id: string) {
    await deleteEvent(id);
    router.refresh();
  }

  function openEventModal() {
    const todayStr = new Date().toISOString().split("T")[0];
    let mTitle = "";
    let mDate = todayStr;
    let mTime = "";
    let mColor = calendarsData[0]?.color ?? "#A67C5B";
    let mRecur = "none";
    let mNotes = "";

    setModal({
      title: "Add Event",
      content: (
        <EventModalContent
          calendars={calendarsData}
          initialDate={todayStr}
          onChange={(vals) => {
            mTitle = vals.title;
            mDate = vals.date;
            mTime = vals.time;
            mColor = vals.color;
            mRecur = vals.recurrence;
            mNotes = vals.notes;
          }}
        />
      ),
      onSave: async () => {
        if (!mTitle.trim() || !mDate) return;
        await addEvent({
          title: mTitle.trim(),
          date: mDate,
          time: mTime,
          color: mColor,
          recurrence: mRecur,
          notes: mNotes.trim(),
        });
        closeModal();
        router.refresh();
      },
    });
  }

  function openCalendarModal() {
    let mName = "";
    let mColor = "#A67C5B";

    setModal({
      title: "Add Calendar",
      content: (
        <CalendarModalContent
          onChange={(vals) => {
            mName = vals.name;
            mColor = vals.color;
          }}
        />
      ),
      onSave: async () => {
        if (!mName.trim()) return;
        await addCalendar(mName.trim(), mColor);
        closeModal();
        router.refresh();
      },
    });
  }

  function renderCalendarGrid() {
    const monthLabel = new Date(calYear, calMonth).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const prevDays = new Date(calYear, calMonth, 0).getDate();
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    const cells: React.ReactNode[] = [];

    // Day headers
    days.forEach((d, i) => {
      cells.push(
        <div key={`hdr-${i}`} className={`cal-day-header${i === 0 || i === 6 ? " weekend" : ""}`}>
          {d}
        </div>
      );
    });

    function dayCell(d: number, dateStr: string, classes: string) {
      const dayEvents = getEventsForDate(eventsAsRecords, dateStr, visibleColors);
      const pills = dayEvents.slice(0, 3);
      const moreCount = dayEvents.length > 3 ? dayEvents.length - 3 : 0;
      const hasEvents = dayEvents.length > 0;

      return (
        <div
          key={dateStr}
          className={`${classes}${hasEvents ? " has-events" : ""}`}
          onClick={() => openDayDetail(dateStr)}
        >
          <div className="day-num">{d}</div>
          <div className="cal-events">
            {pills.map((e, idx) => (
              <div key={idx} className="cal-event-pill" style={{ background: e.color }}>
                {e.title}
              </div>
            ))}
            {moreCount > 0 && <div className="cal-event-more">+{moreCount} more</div>}
          </div>
        </div>
      );
    }

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevDays - i;
      const pm = calMonth === 0 ? 11 : calMonth - 1;
      const py = calMonth === 0 ? calYear - 1 : calYear;
      const dateStr = `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = new Date(py, pm, d).getDay();
      cells.push(dayCell(d, dateStr, `cal-day other-month${dow === 0 || dow === 6 ? " weekend" : ""}`));
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === d;
      const dow = new Date(calYear, calMonth, d).getDay();
      const cls = `cal-day${isToday ? " today" : ""}${dow === 0 || dow === 6 ? " weekend" : ""}${dateStr === selectedDate ? " selected" : ""}`;
      cells.push(dayCell(d, dateStr, cls));
    }

    // Next month fill
    const totalCells = firstDay + daysInMonth;
    const remaining = (7 - (totalCells % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nm = calMonth === 11 ? 0 : calMonth + 1;
      const ny = calMonth === 11 ? calYear + 1 : calYear;
      const dateStr = `${ny}-${String(nm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dow = new Date(ny, nm, d).getDay();
      cells.push(dayCell(d, dateStr, `cal-day other-month${dow === 0 || dow === 6 ? " weekend" : ""}`));
    }

    // List view data
    const upcomingList = getUpcomingEvents(eventsAsRecords, 50);
    const grouped: Record<string, EventRecord[]> = {};
    upcomingList.forEach((e) => {
      if (!grouped[e.date]) grouped[e.date] = [];
      grouped[e.date].push(e);
    });

    return (
      <div id="section-calendar" className={`section${currentSection === "calendar" ? " active" : ""}`}>
        <div className="calendar-header">
          <div className="calendar-nav">
            <button className="btn-ghost" onClick={() => changeMonth(-1)}>&#8249;</button>
            <button className="btn-ghost" onClick={() => changeMonth(1)}>&#8250;</button>
            <h2 id="cal-month-label">{monthLabel}</h2>
            <button className="today-btn" onClick={goToToday}>Today</button>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              className="btn-outline btn-small"
              style={{ borderRadius: "8px" }}
              onClick={() => setCalViewMode((v) => (v === "grid" ? "list" : "grid"))}
            >
              {calViewMode === "grid" ? "List" : "Calendar"}
            </button>
            <button className="btn-primary btn-small" style={{ borderRadius: "8px" }} onClick={openEventModal}>+</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            {calViewMode === "grid" ? (
              <div id="cal-grid-view">
                <div className="calendar-grid-wrapper">
                  <div className="calendar-grid" id="calendar-grid">
                    {cells}
                  </div>
                </div>
              </div>
            ) : (
              <div id="cal-list-view" className="calendar-list-view">
                {upcomingList.length === 0 ? (
                  <div className="empty-state">
                    <h3>No upcoming events</h3>
                    <p>Your calendar is wide open. Add something to look forward to.</p>
                  </div>
                ) : (
                  Object.keys(grouped).sort().map((date) => (
                    <div key={date} className="event-list-group">
                      <h4>{formatDate(date)}</h4>
                      {grouped[date].map((e, idx) => (
                        <div key={idx} className="event-list-item">
                          <div className="event-info">
                            <span className="event-tag" style={{ background: e.color }} />
                            <span className="event-title">{e.title}</span>
                            {e.recurrence !== "none" && (
                              <span className="badge" style={{ background: "#f0e8de", color: "var(--taupe)", marginLeft: "6px" }}>
                                {e.recurrence}
                              </span>
                            )}
                            {e.notes && (
                              <div style={{ fontSize: "0.85rem", color: "var(--text-light)", marginTop: "2px" }}>
                                {e.notes}
                              </div>
                            )}
                          </div>
                          <span className="event-time">{e.time || "All day"}</span>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Calendar sidebar */}
          <div className="cal-sidebar" id="cal-sidebar">
            <h4 style={{ marginBottom: "10px", fontSize: "0.82rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-light)" }}>
              Calendars
            </h4>
            <div id="calendars-list">
              {calendarsData.map((c) => (
                <label
                  key={c.id}
                  className="cal-sidebar-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "5px 0",
                    cursor: "pointer",
                    fontSize: "0.88rem",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={c.visible !== false}
                    onChange={async () => {
                      await toggleCalendarVisibility(c.id);
                      router.refresh();
                    }}
                    style={{ width: "16px", height: "16px", accentColor: c.color }}
                  />
                  <span
                    className="cal-sidebar-dot"
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "3px",
                      background: c.color,
                      flexShrink: 0,
                    }}
                  />
                  <span>{c.name}</span>
                </label>
              ))}
            </div>
            <button
              className="btn-ghost btn-small"
              onClick={openCalendarModal}
              style={{ marginTop: "8px", width: "100%", textAlign: "left" }}
            >
              + Add calendar
            </button>
          </div>
        </div>

        {/* Day detail slide panel */}
        <div className={`day-detail${dayDetailOpen ? " open" : ""}`} id="day-detail">
          <button className="close-panel" onClick={() => setDayDetailOpen(false)}>
            &#10005;
          </button>
          <h3 id="day-detail-title">{selectedDate ? formatDate(selectedDate) : ""}</h3>
          <div id="day-detail-events">
            {selectedDate && (() => {
              const dayEvents = getEventsForDate(eventsAsRecords, selectedDate, visibleColors);
              if (dayEvents.length === 0) {
                return <p style={{ color: "var(--text-light)", fontSize: "0.9rem" }}>No events this day.</p>;
              }
              return dayEvents.map((e, idx) => (
                <div key={idx} className="event-list-item" style={{ borderLeftColor: e.color }}>
                  <div className="event-info">
                    <span className="event-tag" style={{ background: e.color }} />
                    <span className="event-title">{e.title}</span>
                    {e.notes && (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-light)" }}>{e.notes}</div>
                    )}
                  </div>
                  <div>
                    <span className="event-time">{e.time || "All day"}</span>
                    <button
                      className="btn-ghost btn-small"
                      onClick={() => handleDeleteEvent(e.id)}
                      style={{ marginLeft: "4px" }}
                    >
                      &#10005;
                    </button>
                  </div>
                </div>
              ));
            })()}
          </div>
          <div className="event-form">
            <h4 style={{ marginBottom: "12px" }}>Add Event</h4>
            <div className="form-group">
              <label>Title</label>
              <input type="text" placeholder="Event name" value={ddTitle} onChange={(e) => setDdTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Time</label>
              <input type="time" value={ddTime} onChange={(e) => setDdTime(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Calendar</label>
              <select value={ddColor} onChange={(e) => setDdColor(e.target.value)}>
                {calendarsData.map((c) => (
                  <option key={c.id} value={c.color}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Recurring</label>
              <select value={ddRecur} onChange={(e) => setDdRecur(e.target.value)}>
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="form-group">
              <label>Notes</label>
              <textarea rows={2} placeholder="Optional notes" value={ddNotes} onChange={(e) => setDdNotes(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={handleAddEventFromPanel}>Add Event</button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // JOURNAL
  // =========================================================================
  const currentEntry = useMemo(
    () => journalData.find((e) => e.id === currentEntryId) ?? null,
    [journalData, currentEntryId]
  );

  function loadJournalEntry(id: string) {
    const entry = journalData.find((e) => e.id === id);
    if (!entry) return;
    setCurrentEntryId(id);
    setEntryTitle(entry.title ?? "");
    setEntryDate(entry.date);
    setEntryMood(entry.mood ?? "");
    if (journalBodyRef.current) {
      journalBodyRef.current.innerHTML = entry.body ?? "";
    }
  }

  // Load first entry body into contenteditable on mount
  useEffect(() => {
    if (journalBodyRef.current && journalData.length > 0 && currentEntryId) {
      const entry = journalData.find((e) => e.id === currentEntryId);
      if (entry) {
        journalBodyRef.current.innerHTML = entry.body ?? "";
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const autoSaveEntry = useCallback(() => {
    if (!currentEntryId) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      const body = journalBodyRef.current?.innerHTML ?? "";
      await updateJournalEntry(currentEntryId, {
        title: entryTitle,
        date: entryDate,
        mood: entryMood,
        body,
      });
      router.refresh();
    }, 1000);
  }, [currentEntryId, entryTitle, entryDate, entryMood, router]);

  // Trigger autosave when title/date/mood change
  useEffect(() => {
    autoSaveEntry();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entryTitle, entryDate, entryMood]);

  async function handleCreateJournalEntry() {
    const entry = await createJournalEntry();
    router.refresh();
    setCurrentEntryId(entry.id);
    setEntryTitle("");
    setEntryDate(entry.date);
    setEntryMood("");
    if (journalBodyRef.current) {
      journalBodyRef.current.innerHTML = "";
    }
  }

  async function handleDeleteJournalEntry() {
    if (!currentEntryId) return;
    if (!confirm("Delete this journal entry?")) return;
    await deleteJournalEntry(currentEntryId);
    setCurrentEntryId(null);
    setEntryTitle("");
    setEntryDate("");
    setEntryMood("");
    if (journalBodyRef.current) {
      journalBodyRef.current.innerHTML = "";
    }
    router.refresh();
  }

  function handlePrintEntry() {
    if (!currentEntryId) return;
    window.print();
  }

  const filteredJournal = useMemo(() => {
    const search = journalSearch.toLowerCase();
    return journalData.filter(
      (e) =>
        !search ||
        (e.title ?? "").toLowerCase().includes(search) ||
        stripHtml(e.body ?? "").toLowerCase().includes(search)
    );
  }, [journalData, journalSearch]);

  function renderJournal() {
    return (
      <div id="section-journal" className={`section${currentSection === "journal" ? " active" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2>Journal</h2>
          <button className="btn-primary btn-small" onClick={handleCreateJournalEntry}>+ New Entry</button>
        </div>
        <div className="journal-layout">
          <div className="journal-sidebar">
            <input
              type="text"
              className="search-box"
              placeholder="Search entries..."
              value={journalSearch}
              onChange={(e) => setJournalSearch(e.target.value)}
            />
            <div id="journal-list">
              {filteredJournal.length === 0 ? (
                <div className="empty-state" style={{ padding: "30px 10px" }}>
                  <h3>No entries yet</h3>
                  <p>Start writing. This is your space to reflect.</p>
                </div>
              ) : (
                filteredJournal.map((e) => (
                  <div
                    key={e.id}
                    className={`journal-entry-item${e.id === currentEntryId ? " active" : ""}`}
                    onClick={() => loadJournalEntry(e.id)}
                  >
                    <div className="entry-title">{e.title || "Untitled"}</div>
                    <div className="entry-date">{formatDate(e.date)}</div>
                    {e.mood && <span className={`badge mood-${e.mood}`}>{moodLabel(e.mood)}</span>}
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="journal-editor" id="journal-editor">
            <div className="print-header" id="print-header">
              <h1 id="print-title">{entryTitle || "Untitled"}</h1>
              <div className="print-meta">
                <span id="print-date">{formatDate(entryDate)}</span>{" "}
                <span id="print-mood">{moodLabel(entryMood)}</span>
              </div>
            </div>
            <div className="entry-header">
              <input
                type="text"
                placeholder="Entry title..."
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
              />
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
              />
              <select value={entryMood} onChange={(e) => setEntryMood(e.target.value)}>
                <option value="">Mood...</option>
                <option value="happy">Happy</option>
                <option value="grateful">Grateful</option>
                <option value="reflective">Reflective</option>
                <option value="tired">Tired</option>
                <option value="excited">Excited</option>
              </select>
            </div>
            <div
              className="journal-body"
              id="entry-body"
              contentEditable
              ref={journalBodyRef}
              onInput={autoSaveEntry}
              suppressContentEditableWarning
            />
            <div className="journal-actions">
              <button className="btn-primary btn-small" onClick={handlePrintEntry}>Print</button>
              <button className="btn-danger btn-small" onClick={handleDeleteJournalEntry}>Delete Entry</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TODOS & GOALS
  // =========================================================================
  async function handleAddTodo() {
    const text = todoInput.trim();
    if (!text) return;
    await addTodo(text);
    setTodoInput("");
    router.refresh();
  }

  async function handleToggleTodo(id: string) {
    await toggleTodo(id);
    router.refresh();
  }

  async function handleDeleteTodo(id: string) {
    await deleteTodo(id);
    router.refresh();
  }

  async function handleResetTodos() {
    await resetTodos();
    router.refresh();
  }

  // Projects
  function openProjectModal(editProject?: ProjectRow) {
    let mName = editProject?.name ?? "";
    let mDesc = editProject?.description ?? "";
    let mStatus = editProject?.status ?? "not started";
    let mDue = editProject?.due ?? "";

    setModal({
      title: editProject ? "Edit Project" : "New Project",
      content: (
        <ProjectModalContent
          initial={{ name: mName, description: mDesc, status: mStatus, due: mDue }}
          onChange={(vals) => {
            mName = vals.name;
            mDesc = vals.description;
            mStatus = vals.status;
            mDue = vals.due;
          }}
        />
      ),
      onSave: async () => {
        if (!mName.trim()) return;
        if (editProject) {
          await updateProject(editProject.id, {
            name: mName.trim(),
            description: mDesc.trim(),
            status: mStatus,
            due: mDue || null,
          });
        } else {
          await addProject({
            name: mName.trim(),
            description: mDesc.trim(),
            status: mStatus,
            due: mDue || undefined,
          });
        }
        closeModal();
        router.refresh();
      },
    });
  }

  async function handleDeleteProject(id: string) {
    if (!confirm("Delete this project?")) return;
    await deleteProjectAction(id);
    router.refresh();
  }

  async function handleAddSubtask(projectId: string, inputId: string) {
    const input = document.getElementById(inputId) as HTMLInputElement;
    const text = input?.value.trim();
    if (!text) return;
    await addSubtask(projectId, text);
    if (input) input.value = "";
    router.refresh();
  }

  async function handleToggleSubtask(id: string) {
    await toggleSubtask(id);
    router.refresh();
  }

  async function handleDeleteSubtask(id: string) {
    await deleteSubtask(id);
    router.refresh();
  }

  // Goals
  function openGoalModal(editGoalData?: GoalRow) {
    let mTitle = editGoalData?.title ?? "";
    let mCat = editGoalData?.category ?? "personal";
    let mTarget = editGoalData?.target ?? "";
    let mNotes = editGoalData?.notes ?? "";

    setModal({
      title: editGoalData ? "Edit Goal" : "New Goal",
      content: (
        <GoalModalContent
          initial={{ title: mTitle, category: mCat, target: mTarget, notes: mNotes }}
          onChange={(vals) => {
            mTitle = vals.title;
            mCat = vals.category;
            mTarget = vals.target;
            mNotes = vals.notes;
          }}
        />
      ),
      onSave: async () => {
        if (!mTitle.trim()) return;
        if (editGoalData) {
          await updateGoal(editGoalData.id, {
            title: mTitle.trim(),
            category: mCat,
            target: mTarget || null,
            notes: mNotes.trim(),
          });
        } else {
          await addGoal({
            title: mTitle.trim(),
            category: mCat,
            target: mTarget || undefined,
            notes: mNotes.trim(),
          });
        }
        closeModal();
        router.refresh();
      },
    });
  }

  async function handleDeleteGoal(id: string) {
    if (!confirm("Delete this goal?")) return;
    await deleteGoalAction(id);
    router.refresh();
  }

  async function handleUpdateGoalProgress(id: string, progress: number) {
    await updateGoalProgress(id, progress);
    router.refresh();
  }

  function renderTodosSection() {
    return (
      <div id="section-todos" className={`section${currentSection === "todos" ? " active" : ""}`}>
        <h2 style={{ marginBottom: "16px" }}>Todos &amp; Goals</h2>
        <div className="tabs-bar">
          <button
            className={`tab-btn${todosTab === "daily-todos" ? " active" : ""}`}
            onClick={() => setTodosTab("daily-todos")}
          >
            Daily Todos
          </button>
          <button
            className={`tab-btn${todosTab === "projects" ? " active" : ""}`}
            onClick={() => setTodosTab("projects")}
          >
            Projects
          </button>
          <button
            className={`tab-btn${todosTab === "goals" ? " active" : ""}`}
            onClick={() => setTodosTab("goals")}
          >
            Goals
          </button>
        </div>

        {/* Daily Todos tab */}
        <div id="tab-daily-todos" className="tab-content" style={{ display: todosTab === "daily-todos" ? "block" : "none" }}>
          <div className="todo-input-row">
            <input
              type="text"
              placeholder="Add a task..."
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddTodo(); }}
            />
            <button className="btn-primary" onClick={handleAddTodo}>Add</button>
            <button className="btn-outline btn-small" onClick={handleResetTodos} title="Uncheck all">
              &#8634; Reset
            </button>
          </div>
          <div className="todo-list" id="todo-list">
            {todosData.length === 0 ? (
              <div className="empty-state" style={{ padding: "30px" }}>
                <h3>All clear!</h3>
                <p>Add a task to get started on your day.</p>
              </div>
            ) : (
              todosData.map((t) => (
                <div key={t.id} className={`todo-row${t.done ? " done" : ""}`}>
                  <input
                    type="checkbox"
                    checked={!!t.done}
                    onChange={() => handleToggleTodo(t.id)}
                  />
                  <span className="todo-text">{t.text}</span>
                  <button className="btn-ghost btn-small" onClick={() => handleDeleteTodo(t.id)}>&#10005;</button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Projects tab */}
        <div id="tab-projects" className="tab-content" style={{ display: todosTab === "projects" ? "block" : "none" }}>
          <button className="btn-primary btn-small" onClick={() => openProjectModal()} style={{ marginBottom: "16px" }}>
            + New Project
          </button>
          <div id="projects-list">
            {projectsData.length === 0 ? (
              <div className="empty-state">
                <h3>No projects yet</h3>
                <p>Break your big ideas into manageable pieces.</p>
              </div>
            ) : (
              projectsData.map((p) => {
                const statusClass =
                  p.status === "not started" ? "status-not-started" :
                  p.status === "in progress" ? "status-in-progress" : "status-done";
                const inputId = `subtask-input-${p.id}`;
                return (
                  <div key={p.id} className="project-card">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3>{p.name}</h3>
                        <div className="project-meta">
                          <span className={`project-status ${statusClass}`}>{p.status}</span>
                          {p.due && <span>Due: {formatDate(p.due)}</span>}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button className="btn-ghost btn-small" onClick={() => openProjectModal(p)}>&#9998;</button>
                        <button className="btn-ghost btn-small" onClick={() => handleDeleteProject(p.id)}>&#10005;</button>
                      </div>
                    </div>
                    {p.description && (
                      <p style={{ fontSize: "0.9rem", color: "var(--text-light)", marginBottom: "12px" }}>{p.description}</p>
                    )}
                    <div style={{ marginBottom: "8px" }}>
                      {(p.subtasks || []).map((st) => (
                        <div key={st.id} className="subtask-row">
                          <input
                            type="checkbox"
                            checked={!!st.done}
                            onChange={() => handleToggleSubtask(st.id)}
                            style={{ width: "18px", height: "18px" }}
                          />
                          <span style={st.done ? { textDecoration: "line-through", opacity: 0.5 } : undefined}>
                            {st.text}
                          </span>
                          <button
                            className="btn-ghost"
                            style={{ padding: "2px 6px", minHeight: "28px" }}
                            onClick={() => handleDeleteSubtask(st.id)}
                          >
                            &#10005;
                          </button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Add sub-task..."
                        id={inputId}
                        style={{ flex: 1, padding: "6px 10px" }}
                        onKeyDown={(e) => { if (e.key === "Enter") handleAddSubtask(p.id, inputId); }}
                      />
                      <button className="btn-outline btn-small" onClick={() => handleAddSubtask(p.id, inputId)}>+</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Goals tab */}
        <div id="tab-goals" className="tab-content" style={{ display: todosTab === "goals" ? "block" : "none" }}>
          <button className="btn-primary btn-small" onClick={() => openGoalModal()} style={{ marginBottom: "16px" }}>
            + New Goal
          </button>
          <div className="goals-grid" id="goals-list">
            {goalsData.length === 0 ? (
              <div className="empty-state">
                <h3>Dream big</h3>
                <p>Set a goal, even a small one, and watch yourself grow.</p>
              </div>
            ) : (
              goalsData.map((g) => (
                <div key={g.id} className="goal-card">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <h3>{g.title}</h3>
                    <div>
                      <button className="btn-ghost btn-small" onClick={() => openGoalModal(g)}>&#9998;</button>
                      <button className="btn-ghost btn-small" onClick={() => handleDeleteGoal(g.id)}>&#10005;</button>
                    </div>
                  </div>
                  <div className="goal-category">
                    {g.category || "personal"}
                    {g.target ? " \u00b7 Target: " + formatDate(g.target) : ""}
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${g.progress ?? 0}%` }} />
                  </div>
                  <div className="progress-label">{g.progress ?? 0}% complete</div>
                  <div style={{ marginTop: "8px" }}>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={g.progress ?? 0}
                      style={{ width: "100%" }}
                      onChange={(e) => handleUpdateGoalProgress(g.id, parseInt(e.target.value))}
                    />
                  </div>
                  {g.notes && (
                    <p style={{ fontSize: "0.88rem", color: "var(--text-light)", marginTop: "8px" }}>
                      {g.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CONTACTS
  // =========================================================================
  function openContactModal(editContactData?: ContactRow) {
    let mName = editContactData?.name ?? "";
    let mRel = editContactData?.relationship ?? "family";
    let mBday = editContactData?.birthday ?? "";
    let mPhone = editContactData?.phone ?? "";
    let mEmail = editContactData?.email ?? "";
    let mAddr = editContactData?.address ?? "";
    let mNotes = editContactData?.notes ?? "";
    let mPhotoFile: File | null = null;

    setModal({
      title: editContactData ? "Edit Contact" : "Add Contact",
      content: (
        <ContactModalContent
          initial={{ name: mName, relationship: mRel, birthday: mBday, phone: mPhone, email: mEmail, address: mAddr, notes: mNotes }}
          onChange={(vals) => {
            mName = vals.name;
            mRel = vals.relationship;
            mBday = vals.birthday;
            mPhone = vals.phone;
            mEmail = vals.email;
            mAddr = vals.address;
            mNotes = vals.notes;
          }}
          onPhotoChange={(file) => { mPhotoFile = file; }}
        />
      ),
      onSave: async () => {
        if (!mName.trim()) return;

        let photoUrl = editContactData?.photoUrl ?? undefined;
        if (mPhotoFile) {
          photoUrl = await readFileAsBase64(mPhotoFile);
        }

        if (editContactData) {
          await updateContact(editContactData.id, {
            name: mName.trim(),
            relationship: mRel,
            birthday: mBday || null,
            phone: mPhone.trim(),
            email: mEmail.trim(),
            address: mAddr.trim(),
            notes: mNotes.trim(),
            photoUrl: photoUrl ?? null,
          });
        } else {
          await addContact({
            name: mName.trim(),
            relationship: mRel,
            birthday: mBday || undefined,
            phone: mPhone.trim(),
            email: mEmail.trim(),
            address: mAddr.trim(),
            notes: mNotes.trim(),
            photoUrl: photoUrl,
          });
        }
        closeModal();
        router.refresh();
      },
    });
  }

  async function handleDeleteContact(id: string) {
    if (!confirm("Remove this contact?")) return;
    await deleteContactAction(id);
    router.refresh();
  }

  async function handleMarkContacted(id: string) {
    await markContacted(id);
    router.refresh();
  }

  const sortedContacts = useMemo(() => {
    const search = contactSearch.toLowerCase();
    let filtered = contactsData.filter(
      (c) => !search || c.name.toLowerCase().includes(search)
    );

    if (contactSort === "name") {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (contactSort === "birthday") {
      filtered.sort((a, b) => {
        if (!a.birthday) return 1;
        if (!b.birthday) return -1;
        return daysUntilBirthday(a.birthday) - daysUntilBirthday(b.birthday);
      });
    } else if (contactSort === "contacted") {
      filtered.sort((a, b) => {
        if (!a.lastContacted) return 1;
        if (!b.lastContacted) return -1;
        return new Date(b.lastContacted).getTime() - new Date(a.lastContacted).getTime();
      });
    }

    return filtered;
  }, [contactsData, contactSearch, contactSort]);

  const upcomingBirthdays = useMemo(() => {
    return contactsData
      .filter((c) => c.birthday && daysUntilBirthday(c.birthday) <= 30)
      .sort((a, b) => daysUntilBirthday(a.birthday!) - daysUntilBirthday(b.birthday!));
  }, [contactsData]);

  function renderContacts() {
    return (
      <div id="section-contacts" className={`section${currentSection === "contacts" ? " active" : ""}`}>
        <div className="contacts-header">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h2>People</h2>
            <button className="btn-primary btn-small" onClick={() => openContactModal()}>+ Add Contact</button>
          </div>
        </div>

        {upcomingBirthdays.length > 0 && (
          <div className="birthday-banner" id="birthday-banner-area">
            <div className="bday-list">
              <strong>Upcoming Birthdays:</strong>{" "}
              {upcomingBirthdays.map((c, i) => {
                const days = daysUntilBirthday(c.birthday!);
                const label = days === 0 ? "Today!" : days === 1 ? "Tomorrow!" : `in ${days} days`;
                return (
                  <span key={c.id}>
                    {i > 0 ? " \u00b7 " : ""}
                    {c.name} ({label})
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className="contacts-toolbar">
          <input
            type="text"
            placeholder="Search by name..."
            value={contactSearch}
            onChange={(e) => setContactSearch(e.target.value)}
          />
          <select value={contactSort} onChange={(e) => setContactSort(e.target.value)}>
            <option value="name">Sort: Name A-Z</option>
            <option value="birthday">Sort: Upcoming Birthday</option>
            <option value="contacted">Sort: Recently Contacted</option>
          </select>
        </div>

        <div className="contacts-grid" id="contacts-grid">
          {sortedContacts.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <h3>No one here yet</h3>
              <p>Add the people you love. Family, friends, everyone has a place here.</p>
            </div>
          ) : (
            sortedContacts.map((c) => {
              const initials = c.name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .substring(0, 2)
                .toUpperCase();
              return (
                <div key={c.id} className="contact-card">
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div className="contact-avatar">
                      {c.photoUrl ? (
                        <img src={c.photoUrl} alt={c.name} />
                      ) : (
                        initials
                      )}
                    </div>
                    <div>
                      <button className="btn-ghost btn-small" onClick={() => openContactModal(c)}>&#9998;</button>
                      <button className="btn-ghost btn-small" onClick={() => handleDeleteContact(c.id)}>&#10005;</button>
                    </div>
                  </div>
                  <h3>{c.name}</h3>
                  <div className="relationship">
                    <span className="badge" style={{ background: "#f0e8de", color: "var(--taupe)" }}>
                      {c.relationship || "other"}
                    </span>
                  </div>
                  {c.birthday && <div className="contact-detail">{formatDate(c.birthday)}</div>}
                  {c.phone && <div className="contact-detail">{c.phone}</div>}
                  {c.email && <div className="contact-detail">{c.email}</div>}
                  {c.address && <div className="contact-detail">{c.address}</div>}
                  {c.notes && (
                    <div style={{ fontSize: "0.85rem", color: "var(--text-light)", marginTop: "8px", fontStyle: "italic" }}>
                      {c.notes}
                    </div>
                  )}
                  <div className="last-contacted">
                    {c.lastContacted ? "Last contacted: " + formatDate(c.lastContacted) : "Not contacted yet"}
                    <button
                      className="btn-outline btn-small"
                      style={{ marginLeft: "8px", padding: "4px 10px" }}
                      onClick={() => handleMarkContacted(c.id)}
                    >
                      Contacted today
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // BOOKMARKS
  // =========================================================================
  function openBookmarkModal() {
    let mTitle = "";
    let mUrl = "";
    let mDesc = "";
    let mCat = "";

    setModal({
      title: "Add Bookmark",
      content: (
        <BookmarkModalContent
          onChange={(vals) => {
            mTitle = vals.title;
            mUrl = vals.url;
            mDesc = vals.description;
            mCat = vals.category;
          }}
        />
      ),
      onSave: async () => {
        if (!mTitle.trim() || !mUrl.trim()) return;
        await addBookmark({
          title: mTitle.trim(),
          url: mUrl.trim(),
          description: mDesc.trim(),
          category: mCat.trim(),
        });
        closeModal();
        router.refresh();
      },
    });
  }

  async function handleDeleteBookmark(id: string) {
    if (!confirm("Remove this bookmark?")) return;
    await deleteBookmarkAction(id);
    router.refresh();
  }

  const bookmarkCategories = useMemo(
    () => [...new Set(bookmarksData.map((b) => b.category).filter(Boolean))] as string[],
    [bookmarksData]
  );

  const filteredBookmarks = useMemo(
    () => bookmarksData.filter((b) => !bookmarkFilter || b.category === bookmarkFilter),
    [bookmarksData, bookmarkFilter]
  );

  function renderBookmarks() {
    return (
      <div id="section-bookmarks" className={`section${currentSection === "bookmarks" ? " active" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h2>Bookmarks</h2>
          <button className="btn-primary btn-small" onClick={openBookmarkModal}>+ Add Bookmark</button>
        </div>
        <div className="bookmarks-toolbar">
          <select value={bookmarkFilter} onChange={(e) => setBookmarkFilter(e.target.value)}>
            <option value="">All Categories</option>
            {bookmarkCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="bookmarks-grid" id="bookmarks-grid">
          {filteredBookmarks.length === 0 ? (
            <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
              <h3>No bookmarks yet</h3>
              <p>Save your favorite recipes, articles, and websites here.</p>
            </div>
          ) : (
            filteredBookmarks.map((b) => {
              let domain = "";
              try { domain = new URL(b.url).hostname; } catch {}
              return (
                <a
                  key={b.id}
                  className="bookmark-card"
                  href={b.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="bm-header">
                    {domain && (
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                        alt=""
                        width={20}
                        height={20}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <h3>{b.title}</h3>
                    <button
                      className="btn-ghost"
                      style={{ marginLeft: "auto", padding: "4px 8px", minHeight: "28px" }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteBookmark(b.id);
                      }}
                    >
                      &#10005;
                    </button>
                  </div>
                  {b.description && <div className="bm-desc">{b.description}</div>}
                  {b.category && (
                    <span className="badge" style={{ background: "#f0e8de", color: "var(--taupe)" }}>
                      {b.category}
                    </span>
                  )}
                </a>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // SETTINGS
  // =========================================================================
  const nameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleNameChange(name: string) {
    setSettingsName(name);
    if (nameTimeoutRef.current) clearTimeout(nameTimeoutRef.current);
    nameTimeoutRef.current = setTimeout(async () => {
      const fd = new FormData();
      fd.set("name", name);
      await updateName(fd);
      router.refresh();
    }, 500);
  }

  async function handleDashboardPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const base64 = await readFileAsBase64(file);
    await updateDashboardPhoto(base64);
    router.refresh();
  }

  function handleExportData() {
    const data = {
      settings: initialSettings,
      calendars: initialCalendars,
      events: initialEvents,
      journal: initialJournal,
      todos: initialTodos,
      projects: initialProjects,
      goals: initialGoals,
      contacts: initialContacts,
      bookmarks: initialBookmarks,
      notes: initialNotes,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `my-space-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function renderSettings() {
    return (
      <div id="section-settings" className={`section${currentSection === "settings" ? " active" : ""}`}>
        <h2 style={{ marginBottom: "20px" }}>Settings</h2>

        <div className="settings-section">
          <h3>Your Name</h3>
          <div className="form-group">
            <input
              type="text"
              placeholder="Your name"
              value={settingsName}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>
        </div>

        <div className="settings-section">
          <h3>Dashboard Photo</h3>
          <p style={{ color: "var(--text-light)", marginBottom: "12px", fontSize: "0.9rem" }}>
            Change the background photo on your dashboard.
          </p>
          <input type="file" accept="image/*" onChange={handleDashboardPhotoChange} />
        </div>

        <div className="settings-section">
          <h3>Storage</h3>
          <div className="storage-bar">
            <div className="storage-fill" id="storage-fill" style={{ width: "0%" }} />
          </div>
          <div id="storage-label" style={{ fontSize: "0.85rem", color: "var(--text-light)" }}>
            Database storage (managed by server)
          </div>
        </div>

        <div className="settings-section">
          <h3>Data Backup</h3>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button className="btn-secondary" onClick={handleExportData}>Export Data</button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MODAL OVERLAY
  // =========================================================================
  function renderModal() {
    if (!modal) return null;
    return (
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
        <div className="modal-box">
          <h2>{modal.title}</h2>
          {modal.content}
          <div className="modal-actions">
            <button className="btn-outline" onClick={closeModal}>Cancel</button>
            <button className="btn-primary" onClick={modal.onSave}>Save</button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // TOAST CONTAINER
  // =========================================================================
  function renderToasts() {
    if (toasts.length === 0) return null;
    return (
      <div id="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.message}
            <button className="toast-close" onClick={() => dismissToast(t.id)}>&#10005;</button>
          </div>
        ))}
      </div>
    );
  }

  // =========================================================================
  // RENDER
  // =========================================================================
  return (
    <>
      {renderBirthdayScreen()}
      {renderToasts()}
      {renderModal()}

      <div id="app" className={showBirthday ? "" : "active"}>
        {renderSidebar()}
        {renderBottomNav()}
        <main className="main-content">
          {renderDashboard()}
          {renderCalendarGrid()}
          {renderJournal()}
          {renderTodosSection()}
          {renderContacts()}
          {renderBookmarks()}
          {renderSettings()}
        </main>
      </div>
    </>
  );
}

// ===========================================================================
// HELPER: read file as base64
// ===========================================================================
function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===========================================================================
// SUB COMPONENTS - Sticky Note
// ===========================================================================
function StickyNote({
  note,
  colorClass,
  onDelete,
  onSave,
}: {
  note: { id: string; text: string | null };
  colorClass: string;
  onDelete: () => void;
  onSave: (text: string) => void;
}) {
  const textRef = useRef<HTMLDivElement>(null);

  return (
    <div className={`sticky-note ${colorClass}`}>
      <button className="delete-note" onClick={onDelete}>&#10005;</button>
      <div
        className="note-text"
        contentEditable
        suppressContentEditableWarning
        ref={textRef}
        onBlur={() => {
          if (textRef.current) {
            onSave(textRef.current.innerText);
          }
        }}
        dangerouslySetInnerHTML={{ __html: note.text ?? "" }}
      />
    </div>
  );
}

// ===========================================================================
// SUB COMPONENTS - Event Modal Content
// ===========================================================================
function EventModalContent({
  calendars,
  initialDate,
  onChange,
}: {
  calendars: { id: string; name: string; color: string }[];
  initialDate: string;
  onChange: (vals: { title: string; date: string; time: string; color: string; recurrence: string; notes: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState("");
  const [color, setColor] = useState(calendars[0]?.color ?? "#A67C5B");
  const [recurrence, setRecurrence] = useState("none");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    onChange({ title, date, time, color, recurrence, notes });
  });

  return (
    <>
      <div className="form-group"><label>Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="form-group"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div className="form-group"><label>Time</label><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
      <div className="form-group">
        <label>Calendar</label>
        <select value={color} onChange={(e) => setColor(e.target.value)}>
          {calendars.map((c) => <option key={c.id} value={c.color}>{c.name}</option>)}
        </select>
      </div>
      <div className="form-group">
        <label>Recurring</label>
        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value)}>
          <option value="none">None</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>
      <div className="form-group"><label>Notes</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
    </>
  );
}

// ===========================================================================
// SUB COMPONENTS - Calendar Modal Content
// ===========================================================================
function CalendarModalContent({
  onChange,
}: {
  onChange: (vals: { name: string; color: string }) => void;
}) {
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState(CALENDAR_COLORS[0]);

  useEffect(() => {
    onChange({ name, color: selectedColor });
  });

  return (
    <>
      <div className="form-group"><label>Name</label><input type="text" placeholder="e.g. Appointments" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="form-group">
        <label>Color</label>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {CALENDAR_COLORS.map((c) => (
            <div
              key={c}
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: c,
                cursor: "pointer",
                border: selectedColor === c ? "2px solid var(--text)" : "2px solid transparent",
                transition: "border-color 0.15s",
              }}
              onClick={() => setSelectedColor(c)}
            />
          ))}
        </div>
      </div>
    </>
  );
}

// ===========================================================================
// SUB COMPONENTS - Project Modal Content
// ===========================================================================
function ProjectModalContent({
  initial,
  onChange,
}: {
  initial: { name: string; description: string; status: string; due: string };
  onChange: (vals: { name: string; description: string; status: string; due: string }) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState(initial.status);
  const [due, setDue] = useState(initial.due);

  useEffect(() => {
    onChange({ name, description, status, due });
  });

  return (
    <>
      <div className="form-group"><label>Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="form-group"><label>Description</label><textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="form-group">
        <label>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="not started">Not Started</option>
          <option value="in progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>
      <div className="form-group"><label>Due Date</label><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></div>
    </>
  );
}

// ===========================================================================
// SUB COMPONENTS - Goal Modal Content
// ===========================================================================
function GoalModalContent({
  initial,
  onChange,
}: {
  initial: { title: string; category: string; target: string; notes: string };
  onChange: (vals: { title: string; category: string; target: string; notes: string }) => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [category, setCategory] = useState(initial.category);
  const [target, setTarget] = useState(initial.target);
  const [notes, setNotes] = useState(initial.notes);

  useEffect(() => {
    onChange({ title, category, target, notes });
  });

  return (
    <>
      <div className="form-group"><label>Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="form-group">
        <label>Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {["health", "family", "personal", "creative", "financial"].map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="form-group"><label>Target Date</label><input type="date" value={target} onChange={(e) => setTarget(e.target.value)} /></div>
      <div className="form-group"><label>Notes</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
    </>
  );
}

// ===========================================================================
// SUB COMPONENTS - Contact Modal Content
// ===========================================================================
function ContactModalContent({
  initial,
  onChange,
  onPhotoChange,
}: {
  initial: { name: string; relationship: string; birthday: string; phone: string; email: string; address: string; notes: string };
  onChange: (vals: { name: string; relationship: string; birthday: string; phone: string; email: string; address: string; notes: string }) => void;
  onPhotoChange: (file: File) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [relationship, setRelationship] = useState(initial.relationship);
  const [birthday, setBirthday] = useState(initial.birthday);
  const [phone, setPhone] = useState(initial.phone);
  const [email, setEmail] = useState(initial.email);
  const [address, setAddress] = useState(initial.address);
  const [notes, setNotes] = useState(initial.notes);

  useEffect(() => {
    onChange({ name, relationship, birthday, phone, email, address, notes });
  });

  return (
    <>
      <div className="form-group"><label>Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div className="form-group">
        <label>Relationship</label>
        <select value={relationship} onChange={(e) => setRelationship(e.target.value)}>
          {["family", "friend", "doctor", "neighbor", "other"].map((r) => (
            <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
          ))}
        </select>
      </div>
      <div className="form-group"><label>Birthday</label><input type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} /></div>
      <div className="form-group"><label>Phone</label><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div className="form-group"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="form-group"><label>Address</label><input type="text" value={address} onChange={(e) => setAddress(e.target.value)} /></div>
      <div className="form-group"><label>Notes</label><textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
      <div className="form-group">
        <label>Photo</label>
        <input type="file" accept="image/*" onChange={(e) => { if (e.target.files?.[0]) onPhotoChange(e.target.files[0]); }} />
      </div>
    </>
  );
}

// ===========================================================================
// SUB COMPONENTS - Bookmark Modal Content
// ===========================================================================
function BookmarkModalContent({
  onChange,
}: {
  onChange: (vals: { title: string; url: string; description: string; category: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    onChange({ title, url, description, category });
  });

  return (
    <>
      <div className="form-group"><label>Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></div>
      <div className="form-group"><label>URL</label><input type="url" placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} /></div>
      <div className="form-group"><label>Description</label><textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      <div className="form-group"><label>Category</label><input type="text" placeholder="e.g. Recipes, News, Shopping" value={category} onChange={(e) => setCategory(e.target.value)} /></div>
    </>
  );
}
