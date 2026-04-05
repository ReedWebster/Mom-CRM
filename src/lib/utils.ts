export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function moodLabel(mood: string): string {
  const labels: Record<string, string> = {
    happy: "Happy",
    grateful: "Grateful",
    reflective: "Reflective",
    tired: "Tired",
    excited: "Excited",
  };
  return labels[mood] || mood || "";
}

export function daysUntilBirthday(bdayStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bday = new Date(bdayStr + "T00:00:00");
  const next = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
  if (next < today) next.setFullYear(next.getFullYear() + 1);
  return Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function stripHtml(html: string): string {
  if (typeof document !== "undefined") {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || "";
  }
  return html.replace(/<[^>]*>/g, "");
}

export type EventRecord = {
  id: string;
  title: string;
  date: string;
  time: string;
  color: string;
  recurrence: string;
  notes: string;
};

export function getEventsForDate(events: EventRecord[], dateStr: string, visibleColors?: Set<string>): EventRecord[] {
  const result: EventRecord[] = [];
  const target = new Date(dateStr + "T00:00:00");

  events.forEach((ev) => {
    if (visibleColors && !visibleColors.has(ev.color)) return;
    const base = new Date(ev.date + "T00:00:00");
    if (target < base) return;

    if (ev.date === dateStr) {
      result.push(ev);
      return;
    }

    if (ev.recurrence === "daily") {
      result.push({ ...ev, date: dateStr });
    } else if (ev.recurrence === "weekly") {
      if (target.getDay() === base.getDay()) result.push({ ...ev, date: dateStr });
    } else if (ev.recurrence === "monthly") {
      if (target.getDate() === base.getDate()) result.push({ ...ev, date: dateStr });
    } else if (ev.recurrence === "yearly") {
      if (target.getMonth() === base.getMonth() && target.getDate() === base.getDate())
        result.push({ ...ev, date: dateStr });
    }
  });

  return result;
}

export function getUpcomingEvents(events: EventRecord[], count: number): EventRecord[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const results: EventRecord[] = [];
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 90);

  for (const d = new Date(today); d <= limit && results.length < count; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayEvents = getEventsForDate(events, dateStr);
    dayEvents.forEach((e) => {
      if (results.length < count) results.push({ ...e, date: dateStr });
    });
  }

  return results;
}
