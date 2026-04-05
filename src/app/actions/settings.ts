"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { userSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getSettings(userId: string) {
  const rows = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId));

  if (rows.length === 0) {
    // Create default settings row
    const inserted = await db
      .insert(userSettings)
      .values({ userId, name: "" })
      .returning();
    return inserted[0];
  }

  return rows[0];
}

export async function updateName(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const name = formData.get("name") as string;

  await db
    .update(userSettings)
    .set({ name, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId));

  revalidatePath("/");
}

export async function updateDashboardPhoto(url: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(userSettings)
    .set({ dashboardPhotoUrl: url, updatedAt: new Date() })
    .where(eq(userSettings.userId, userId));

  revalidatePath("/");
}
