"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { goals } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getGoals(userId: string) {
  return db
    .select()
    .from(goals)
    .where(eq(goals.userId, userId));
}

export async function addGoal(data: {
  title: string;
  category?: string;
  target?: string;
  notes?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(goals)
    .values({
      userId,
      title: data.title,
      category: data.category ?? "personal",
      target: data.target ?? null,
      notes: data.notes ?? "",
    })
    .returning();

  revalidatePath("/");
  return result[0];
}

export async function updateGoal(
  id: string,
  data: {
    title?: string;
    category?: string;
    target?: string | null;
    notes?: string;
    progress?: number;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(goals)
    .set(data)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));

  revalidatePath("/");
}

export async function deleteGoal(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(goals)
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));

  revalidatePath("/");
}

export async function updateGoalProgress(id: string, progress: number) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(goals)
    .set({ progress })
    .where(and(eq(goals.id, id), eq(goals.userId, userId)));

  revalidatePath("/");
}
