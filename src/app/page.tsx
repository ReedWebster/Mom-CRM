import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  userSettings, calendars, events, journalEntries,
  todos, projects, subtasks, goals, contacts, bookmarks, stickyNotes,
} from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import CrmApp from "@/components/crm-app";

const DEFAULT_CALENDARS = [
  { name: "Personal", color: "#A67C5B" },
  { name: "Family", color: "#5B8FA6" },
  { name: "Health", color: "#8B9E82" },
  { name: "Work", color: "#B07AA1" },
  { name: "Other", color: "#BFA98A" },
];

const ALLOWED_EMAILS = [
  "reedwebster7284@gmail.com",
  "lauriebwebster@gmail.com",
];

export default async function Home() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Check email allowlist
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (!email || !ALLOWED_EMAILS.includes(email.toLowerCase())) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FAF7F2",
        fontFamily: "-apple-system, system-ui, sans-serif",
        color: "#2C2520",
        textAlign: "center",
        padding: "40px",
      }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "12px" }}>Access Restricted</h1>
          <p style={{ color: "#8C8078", marginBottom: "24px" }}>
            This space is private. If you think you should have access,<br />
            reach out to the person who shared it with you.
          </p>
          <a href="/sign-in" style={{ color: "#A67C5B", textDecoration: "underline" }}>Sign in with a different account</a>
        </div>
      </div>
    );
  }

  // Ensure user settings exist
  let [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
  if (!settings) {
    [settings] = await db.insert(userSettings).values({ userId, name: "" }).returning();
  }

  // Ensure default calendars exist
  let cals = await db.select().from(calendars).where(eq(calendars.userId, userId));
  if (cals.length === 0) {
    cals = await db.insert(calendars).values(
      DEFAULT_CALENDARS.map((c) => ({ userId, name: c.name, color: c.color, visible: true }))
    ).returning();
  }

  // Fetch all data in parallel
  const [evts, entries, todoList, projectList, goalList, contactList, bookmarkList, noteList] = await Promise.all([
    db.select().from(events).where(eq(events.userId, userId)),
    db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.createdAt)),
    db.select().from(todos).where(eq(todos.userId, userId)).orderBy(todos.sortOrder),
    db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt)),
    db.select().from(goals).where(eq(goals.userId, userId)).orderBy(desc(goals.createdAt)),
    db.select().from(contacts).where(eq(contacts.userId, userId)).orderBy(contacts.name),
    db.select().from(bookmarks).where(eq(bookmarks.userId, userId)).orderBy(desc(bookmarks.createdAt)),
    db.select().from(stickyNotes).where(eq(stickyNotes.userId, userId)).orderBy(stickyNotes.sortOrder),
  ]);

  // Fetch subtasks for all projects
  const projectIds = projectList.map((p) => p.id);
  let allSubtasks: typeof subtasks.$inferSelect[] = [];
  if (projectIds.length > 0) {
    allSubtasks = await db.select().from(subtasks).where(inArray(subtasks.projectId, projectIds));
  }

  const projectsWithSubtasks = projectList.map((p) => ({
    ...p,
    subtasks: allSubtasks.filter((st) => st.projectId === p.id),
  }));

  return (
    <CrmApp
      initialSettings={settings}
      initialCalendars={cals}
      initialEvents={evts}
      initialJournal={entries}
      initialTodos={todoList}
      initialProjects={projectsWithSubtasks}
      initialGoals={goalList}
      initialContacts={contactList}
      initialBookmarks={bookmarkList}
      initialNotes={noteList}
    />
  );
}
