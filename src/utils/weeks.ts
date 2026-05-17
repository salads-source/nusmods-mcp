import type { WeekRange } from "../models/lesson.js";

export function normalizeWeeks(weeks: number[] | WeekRange | undefined): number[] {
  if (!weeks) {
    return [];
  }

  if (Array.isArray(weeks)) {
    return [...weeks].sort((a, b) => a - b);
  }

  const start = Number.parseInt(weeks.start, 10);
  const end = Number.parseInt(weeks.end, 10);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return [];
  }

  const result: number[] = [];
  for (let week = start; week <= end; week += 1) {
    result.push(week);
  }
  return result;
}

export function weeksOverlap(a: number[], b: number[]): boolean {
  if (a.length === 0 || b.length === 0) {
    return true;
  }

  const weekSet = new Set(a);
  return b.some((week) => weekSet.has(week));
}
