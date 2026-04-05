"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { bookmarks } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getBookmarks(userId: string) {
  return db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, userId))
    .orderBy(desc(bookmarks.createdAt));
}

export async function addBookmark(data: {
  title: string;
  url: string;
  description?: string;
  category?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(bookmarks)
    .values({
      userId,
      title: data.title,
      url: data.url,
      description: data.description ?? "",
      category: data.category ?? "",
    })
    .returning();

  revalidatePath("/");
  return result[0];
}

export async function deleteBookmark(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(bookmarks)
    .where(and(eq(bookmarks.id, id), eq(bookmarks.userId, userId)));

  revalidatePath("/");
}
