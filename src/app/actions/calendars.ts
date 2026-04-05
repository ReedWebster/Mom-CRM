"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { calendars } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const DEFAULT_CALENDARS = [
  { name: "Personal", color: "#A67C5B" },
  { name: "Family", color: "#5B8FA6" },
  { name: "Health", color: "#8B9E82" },
  { name: "Work", color: "#B07AA1" },
  { name: "Other", color: "#BFA98A" },
];

export async function getCalendars(userId: string) {
  return db
    .select()
    .from(calendars)
    .where(eq(calendars.userId, userId));
}

export async function ensureDefaultCalendars(userId: string) {
  const existing = await db
    .select()
    .from(calendars)
    .where(eq(calendars.userId, userId));

  if (existing.length === 0) {
    for (const cal of DEFAULT_CALENDARS) {
      await db
        .insert(calendars)
        .values({ userId, name: cal.name, color: cal.color });
    }
  }

  return getCalendars(userId);
}

export async function addCalendar(name: string, color: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(calendars)
    .values({ userId, name, color })
    .returning();

  revalidatePath("/");
  return result[0];
}

export async function toggleCalendarVisibility(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rows = await db
    .select()
    .from(calendars)
    .where(and(eq(calendars.id, id), eq(calendars.userId, userId)));

  if (rows.length === 0) throw new Error("Calendar not found");

  await db
    .update(calendars)
    .set({ visible: !rows[0].visible })
    .where(and(eq(calendars.id, id), eq(calendars.userId, userId)));

  revalidatePath("/");
}

export async function deleteCalendar(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(calendars)
    .where(and(eq(calendars.id, id), eq(calendars.userId, userId)));

  revalidatePath("/");
}
