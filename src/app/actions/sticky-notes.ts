"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { stickyNotes } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getStickyNotes(userId: string) {
  return db
    .select()
    .from(stickyNotes)
    .where(eq(stickyNotes.userId, userId))
    .orderBy(asc(stickyNotes.sortOrder));
}

export async function addStickyNote() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(stickyNotes)
    .values({ userId, text: "" })
    .returning();

  revalidatePath("/");
  return result[0];
}

export async function updateStickyNote(id: string, text: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(stickyNotes)
    .set({ text })
    .where(and(eq(stickyNotes.id, id), eq(stickyNotes.userId, userId)));

  revalidatePath("/");
}

export async function deleteStickyNote(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(stickyNotes)
    .where(and(eq(stickyNotes.id, id), eq(stickyNotes.userId, userId)));

  revalidatePath("/");
}
