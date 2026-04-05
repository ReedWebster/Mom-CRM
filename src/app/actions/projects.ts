"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { projects, subtasks } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getProjects(userId: string) {
  const allProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, userId))
    .orderBy(asc(projects.createdAt));

  const projectsWithSubtasks = await Promise.all(
    allProjects.map(async (project) => {
      const subs = await db
        .select()
        .from(subtasks)
        .where(eq(subtasks.projectId, project.id))
        .orderBy(asc(subtasks.sortOrder));
      return { ...project, subtasks: subs };
    })
  );

  return projectsWithSubtasks;
}

export async function addProject(data: {
  name: string;
  description?: string;
  status?: string;
  due?: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const result = await db
    .insert(projects)
    .values({
      userId,
      name: data.name,
      description: data.description ?? "",
      status: data.status ?? "not started",
      due: data.due ?? null,
    })
    .returning();

  revalidatePath("/");
  return result[0];
}

export async function updateProject(
  id: string,
  data: { name?: string; description?: string; status?: string; due?: string | null }
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .update(projects)
    .set(data)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));

  revalidatePath("/");
}

export async function deleteProject(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  await db
    .delete(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));

  revalidatePath("/");
}

export async function addSubtask(projectId: string, text: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Verify the project belongs to this user
  const proj = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

  if (proj.length === 0) throw new Error("Project not found");

  const result = await db
    .insert(subtasks)
    .values({ projectId, text })
    .returning();

  revalidatePath("/");
  return result[0];
}

export async function toggleSubtask(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rows = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.id, id));

  if (rows.length === 0) throw new Error("Subtask not found");

  // Verify ownership via project
  const proj = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, rows[0].projectId), eq(projects.userId, userId))
    );

  if (proj.length === 0) throw new Error("Unauthorized");

  await db
    .update(subtasks)
    .set({ done: !rows[0].done })
    .where(eq(subtasks.id, id));

  revalidatePath("/");
}

export async function deleteSubtask(id: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const rows = await db
    .select()
    .from(subtasks)
    .where(eq(subtasks.id, id));

  if (rows.length === 0) throw new Error("Subtask not found");

  // Verify ownership via project
  const proj = await db
    .select()
    .from(projects)
    .where(
      and(eq(projects.id, rows[0].projectId), eq(projects.userId, userId))
    );

  if (proj.length === 0) throw new Error("Unauthorized");

  await db.delete(subtasks).where(eq(subtasks.id, id));

  revalidatePath("/");
}
