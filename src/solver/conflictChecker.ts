import type { Conflict, SelectedLesson } from "../models/lesson.js";
import { timeToMinutes } from "../utils/time.js";
import { weeksOverlap } from "../utils/weeks.js";

export interface ConflictCheckResult {
  hasConflicts: boolean;
  conflicts: Conflict[];
}

export function checkTimetableConflicts(selections: SelectedLesson[]): ConflictCheckResult {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < selections.length; i += 1) {
    for (let j = i + 1; j < selections.length; j += 1) {
      const lessonA = selections[i];
      const lessonB = selections[j];

      if (lessonsConflict(lessonA, lessonB)) {
        conflicts.push({
          lessonA,
          lessonB,
          reason: `${lessonA.moduleCode} ${lessonA.lessonType} ${lessonA.classNo} overlaps with ${lessonB.moduleCode} ${lessonB.lessonType} ${lessonB.classNo}.`,
        });
      }
    }
  }

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
}

export function lessonsConflict(a: SelectedLesson, b: SelectedLesson): boolean {
  if (a.day !== b.day) {
    return false;
  }

  if (!weeksOverlap(a.weeks, b.weeks)) {
    return false;
  }

  return timeToMinutes(a.startTime) < timeToMinutes(b.endTime) && timeToMinutes(b.startTime) < timeToMinutes(a.endTime);
}
