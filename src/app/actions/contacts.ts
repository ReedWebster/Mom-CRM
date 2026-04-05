"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { contacts } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getContacts(userId: string) {
  return db
    .select()
    .from(contacts)
    .where(eq(contacts.userId, userId));
}

export async function addContact(data: {
  name: string;
  relationship?: string;
  birthday?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  photoUrl?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(contacts)
    .values({
      userId,
      name: data.name,
      relationship: data.relationship ?? "other",
      birthday: data.birthday ?? null,
      phone: data.phone ?? "",
      email: data.email ?? "",
      address: data.address ?? "",
      notes: data.notes ?? "",
      photoUrl: data.photoUrl ?? null,
    })
    .returning();

  revalidatePath("/");
  return result[0];
}

export async function updateContact(
  id: string,
  data: {
    name?: string;
    relationship?: string;
    birthday?: string | null;
    phone?: string;
    email?: string;
    address?: string;
    notes?: string;
    photoUrl?: string | null;
    lastContacted?: string | null;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(contacts)
    .set(data)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));

  revalidatePath("/");
}

export async function deleteContact(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(contacts)
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));

  revalidatePath("/");
}

export async function markContacted(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const today = new Date().toISOString().split("T")[0];

  await db
    .update(contacts)
    .set({ lastContacted: today })
    .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));

  revalidatePath("/");
}
