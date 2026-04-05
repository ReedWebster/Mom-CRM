"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { events } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getEvents(userId: string) {
  return db
    .select()
    .from(events)
    .where(eq(events.userId, userId));
}

export async function addEvent(data: {
  title: string;
  date: string;
  time?: string;
  color?: string;
  recurrence?: string;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(events)
    .values({
      userId,
      title: data.title,
      date: data.date,
      time: data.time ?? "",
      color: data.color ?? "#A67C5B",
      recurrence: data.recurrence ?? "none",
      notes: data.notes ?? "",
    })
    .returning();

  revalidatePath("/");
  return result[0];
}

export async function deleteEvent(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)));

  revalidatePath("/");
}
