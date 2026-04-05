"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { journalEntries } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getJournalEntries(userId: string) {
  return db
    .select()
    .from(journalEntries)
    .where(eq(journalEntries.userId, userId))
    .orderBy(desc(journalEntries.createdAt));
}

export async function createJournalEntry() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const today = new Date().toISOString().split("T")[0];

  const result = await db
    .insert(journalEntries)
    .values({
      userId,
      title: "",
      date: today,
      mood: "",
      body: "",
    })
    .returning();

  revalidatePath("/");
  return result[0];
}

export async function updateJournalEntry(
  id: string,
  data: { title?: string; date?: string; mood?: string; body?: string }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(journalEntries)
    .set(data)
    .where(
      and(eq(journalEntries.id, id), eq(journalEntries.userId, userId))
    );

  revalidatePath("/");
}

export async function deleteJournalEntry(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(journalEntries)
    .where(
      and(eq(journalEntries.id, id), eq(journalEntries.userId, userId))
    );

  revalidatePath("/");
}
