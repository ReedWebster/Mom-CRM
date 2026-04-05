import { pgTable, text, boolean, integer, date, timestamp, uuid } from "drizzle-orm/pg-core";

// ============================================================
// User Settings
// ============================================================
export const userSettings = pgTable("user_settings", {
  userId: text("user_id").primaryKey(),
  name: text("name").default(""),
  dashboardPhotoUrl: text("dashboard_photo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ============================================================
// Calendars
// ============================================================
export const calendars = pgTable("calendars", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  visible: boolean("visible").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// Events
// ============================================================
export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  time: text("time").default(""),
  color: text("color").notNull().default("#A67C5B"),
  recurrence: text("recurrence").notNull().default("none"), // none|daily|weekly|monthly|yearly
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// Journal Entries
// ============================================================
export const journalEntries = pgTable("journal_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").default(""),
  date: text("date").notNull(),
  mood: text("mood").default(""),
  body: text("body").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// Todos
// ============================================================
export const todos = pgTable("todos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  text: text("text").notNull(),
  done: boolean("done").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// Projects
// ============================================================
export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description").default(""),
  status: text("status").notNull().default("not started"), // not started|in progress|done
  due: text("due"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subtasks = pgTable("subtasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  done: boolean("done").default(false),
  sortOrder: integer("sort_order").default(0),
});

// ============================================================
// Goals
// ============================================================
export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  category: text("category").default("personal"),
  progress: integer("progress").default(0),
  target: text("target"),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// Contacts
// ============================================================
export const contacts = pgTable("contacts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  relationship: text("relationship").default("other"),
  birthday: text("birthday"),
  phone: text("phone").default(""),
  email: text("email").default(""),
  address: text("address").default(""),
  notes: text("notes").default(""),
  photoUrl: text("photo_url"),
  lastContacted: text("last_contacted"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// Bookmarks
// ============================================================
export const bookmarks = pgTable("bookmarks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  description: text("description").default(""),
  category: text("category").default(""),
  createdAt: timestamp("created_at").defaultNow(),
});

// ============================================================
// Sticky Notes
// ============================================================
export const stickyNotes = pgTable("sticky_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  text: text("text").default(""),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});
