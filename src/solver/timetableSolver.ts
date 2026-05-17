import type { NusmodsClient } from "../clients/nusmodsClient.js";
import { DAYS, type Day, type LessonSlot, type SelectedLesson } from "../models/lesson.js";
import type { GenerateTimetableRequest, GenerateTimetableResult, LessonGroup, TimetableOption, TimetablePreferences } from "../models/timetable.js";
import { timeToMinutes } from "../utils/time.js";
import { lessonsConflict } from "./conflictChecker.js";
import { exportNusmodsUrl } from "./nusmodsUrl.js";
import { scoreTimetable, summarizeTimetable } from "./scorer.js";

export class TimetableSolver {
  constructor(private readonly client: NusmodsClient) {}

  async generateTimetable(request: GenerateTimetableRequest): Promise<GenerateTimetableResult> {
    const topK = Math.min(Math.max(request.topK ?? 5, 1), 20);
    const preferences = normalizePreferences(request.preferences);
    const reasons: string[] = [];
    const groups: LessonGroup[] = [];

    for (const rawModuleCode of request.modules) {
      const moduleCode = rawModuleCode.trim().toUpperCase();
      const timetable = await this.client.getSemesterTimetable(moduleCode, request.acadYear, request.semester);
      const moduleGroups = buildLessonGroups(moduleCode, timetable, preferences);
      for (const group of moduleGroups) {
        if (group.options.length === 0) {
          reasons.push(`${group.moduleCode} ${group.lessonType} has no lesson slots satisfying hard constraints.`);
        }
      }
      groups.push(...moduleGroups);
    }

    if (reasons.length > 0) {
      return { hasSolutions: false, options: [], reasons };
    }

    groups.sort((a, b) => a.options.length - b.options.length);

    const options: TimetableOption[] = [];
    const dfs = (groupIndex: number, selected: SelectedLesson[]) => {
      if (groupIndex === groups.length) {
        const lessons = sortLessons(selected);
        const option: TimetableOption = {
          score: scoreTimetable(lessons, preferences),
          lessons,
          summary: summarizeTimetable(lessons, preferences),
          nusmodsUrl: exportNusmodsUrl(request.semester, lessons),
        };
        insertOption(options, option, topK);
        return;
      }

      const group = groups[groupIndex];
      const rankedOptions = [...group.options].sort((a, b) => scorePartialOption(a, preferences) - scorePartialOption(b, preferences));
      for (const option of rankedOptions) {
        if (!wouldConflict(selected, option)) {
          dfs(groupIndex + 1, [...selected, ...option]);
        }
      }
    };

    dfs(0, []);

    if (options.length === 0) {
      return {
        hasSolutions: false,
        options: [],
        reasons: ["No valid timetable satisfies all hard constraints."],
      };
    }

    return {
      hasSolutions: true,
      options: options.sort((a, b) => b.score - a.score),
    };
  }
}

function buildLessonGroups(moduleCode: string, lessons: LessonSlot[], preferences: ReturnType<typeof normalizePreferences>): LessonGroup[] {
  const byLessonType = new Map<string, Map<string, LessonSlot[]>>();

  for (const lesson of lessons) {
    const classOptions = byLessonType.get(lesson.lessonType) ?? new Map<string, LessonSlot[]>();
    const classLessons = classOptions.get(lesson.classNo) ?? [];
    classLessons.push(lesson);
    classOptions.set(lesson.classNo, classLessons);
    byLessonType.set(lesson.lessonType, classOptions);
  }

  return [...byLessonType.entries()].map(([lessonType, classOptions]) => {
    const options = [...classOptions.values()]
      .map((classLessons) => sortLessons(classLessons))
      .filter((classLessons) => satisfiesHardConstraints(classLessons, preferences));

    return {
      key: `${moduleCode}|${lessonType}`,
      moduleCode,
      lessonType,
      options,
    };
  });
}

function normalizePreferences(preferences: TimetablePreferences = {}): TimetablePreferences {
  const typed = preferences;

  return {
    ...typed,
    earliestStart: typed.earliestStart ? normalizeTimeForCompare(typed.earliestStart) : undefined,
    latestEnd: typed.latestEnd ? normalizeTimeForCompare(typed.latestEnd) : undefined,
  };
}

function satisfiesHardConstraints(lessons: LessonSlot[], preferences: ReturnType<typeof normalizePreferences>): boolean {
  const avoidedDays = new Set(preferences.avoidDays ?? []);
  const earliest = preferences.earliestStart ? timeToMinutes(preferences.earliestStart) : undefined;
  const latest = preferences.latestEnd ? timeToMinutes(preferences.latestEnd) : undefined;

  return lessons.every((lesson) => {
    if (avoidedDays.has(lesson.day)) {
      return false;
    }

    if (earliest !== undefined && timeToMinutes(lesson.startTime) < earliest) {
      return false;
    }

    if (latest !== undefined && timeToMinutes(lesson.endTime) > latest) {
      return false;
    }

    return true;
  });
}

function wouldConflict(selected: SelectedLesson[], candidate: SelectedLesson[]): boolean {
  for (const existing of selected) {
    for (const lesson of candidate) {
      if (lessonsConflict(existing, lesson)) {
        return true;
      }
    }
  }
  return false;
}

function insertOption(options: TimetableOption[], option: TimetableOption, topK: number): void {
  options.push(option);
  options.sort((a, b) => b.score - a.score);
  if (options.length > topK) {
    options.pop();
  }
}

function scorePartialOption(lessons: SelectedLesson[], preferences: ReturnType<typeof normalizePreferences>): number {
  return -scoreTimetable(lessons, preferences);
}

function sortLessons<T extends SelectedLesson>(lessons: T[]): T[] {
  return [...lessons].sort((a, b) => {
    const dayCompare = dayIndex(a.day) - dayIndex(b.day);
    if (dayCompare !== 0) {
      return dayCompare;
    }
    return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  });
}

function dayIndex(day: Day): number {
  return DAYS.indexOf(day);
}

function normalizeTimeForCompare(value: string): string {
  const match = /^([01]\d|2[0-3]):?([0-5]\d)$/.exec(value);
  if (!match) {
    throw new Error(`Invalid time "${value}". Expected HH:mm or HHmm.`);
  }
  return `${match[1]}:${match[2]}`;
}
