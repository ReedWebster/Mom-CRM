"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { todos } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getTodos(userId: string) {
  return db
    .select()
    .from(todos)
    .where(eq(todos.userId, userId))
    .orderBy(asc(todos.sortOrder));
}

export async function addTodo(text: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(todos)
    .values({ userId, text })
    .returning();

  revalidatePath("/");
  return result[0];
}

export async function toggleTodo(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rows = await db
    .select()
    .from(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)));

  if (rows.length === 0) throw new Error("Todo not found");

  await db
    .update(todos)
    .set({ done: !rows[0].done })
    .where(and(eq(todos.id, id), eq(todos.userId, userId)));

  revalidatePath("/");
}

export async function deleteTodo(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(todos)
    .where(and(eq(todos.id, id), eq(todos.userId, userId)));

  revalidatePath("/");
}

export async function resetTodos() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db.delete(todos).where(eq(todos.userId, userId));

  revalidatePath("/");
}
