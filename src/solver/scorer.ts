import { DAYS, type SelectedLesson } from "../models/lesson.js";
import type { TimetablePreferences } from "../models/timetable.js";
import { timeToMinutes } from "../utils/time.js";

export function scoreTimetable(lessons: SelectedLesson[], preferences: TimetablePreferences = {}): number {
  let score = 100;
  const byDay = groupByDay(lessons);
  const usedDays = [...byDay.keys()];
  const freeDays = DAYS.filter((day) => !byDay.has(day));

  if (preferences.preferFreeDay) {
    score += freeDays.length * 8;
  }

  if (preferences.preferCompactDays) {
    score -= usedDays.length * 6;
  }

  for (const day of usedDays) {
    const dayLessons = byDay.get(day) ?? [];
    dayLessons.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));

    if (dayLessons.length > 0) {
      const span = timeToMinutes(dayLessons.at(-1)!.endTime) - timeToMinutes(dayLessons[0].startTime);
      const teaching = dayLessons.reduce((total, lesson) => total + timeToMinutes(lesson.endTime) - timeToMinutes(lesson.startTime), 0);
      const gap = Math.max(0, span - teaching);
      score -= gap / 30;
    }

    for (let index = 0; index < dayLessons.length - 1; index += 1) {
      const current = dayLessons[index];
      const next = dayLessons[index + 1];
      const gap = timeToMinutes(next.startTime) - timeToMinutes(current.endTime);

      if (gap === 0 && preferences.avoidBackToBack) {
        score -= 8;
      }

      if (venuePrefix(current.venue) !== venuePrefix(next.venue)) {
        score -= 3;
      }
    }
  }

  return Math.max(0, Math.round(score));
}

export function summarizeTimetable(lessons: SelectedLesson[], preferences: TimetablePreferences = {}): string {
  const byDay = groupByDay(lessons);
  const notes: string[] = [];

  const avoided = preferences.avoidDays?.filter((day) => !byDay.has(day)) ?? [];
  if (avoided.length > 0) {
    notes.push(`Free ${avoided.join(", ")}`);
  }

  if (preferences.earliestStart) {
    notes.push(`no classes before ${preferences.earliestStart}`);
  }

  if (preferences.latestEnd) {
    notes.push(`ends by ${preferences.latestEnd}`);
  }

  const usedDays = [...byDay.keys()];
  if (preferences.preferCompactDays) {
    notes.push(`${usedDays.length} days on campus`);
  }

  if (notes.length === 0) {
    notes.push(`${lessons.length} lessons across ${usedDays.length} days`);
  }

  return sentenceCase(notes.join(", "));
}

function groupByDay(lessons: SelectedLesson[]): Map<string, SelectedLesson[]> {
  const byDay = new Map<string, SelectedLesson[]>();
  for (const lesson of lessons) {
    const dayLessons = byDay.get(lesson.day) ?? [];
    dayLessons.push(lesson);
    byDay.set(lesson.day, dayLessons);
  }
  return byDay;
}

function venuePrefix(venue: string): string {
  return venue.split("-")[0]?.toUpperCase() ?? venue.toUpperCase();
}

function sentenceCase(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}
