export const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

export type Day = (typeof DAYS)[number];

export interface NusmodsLesson {
  classNo: string;
  lessonType: string;
  day: Day;
  startTime: string;
  endTime: string;
  venue: string;
  weeks: number[] | WeekRange;
  size?: number;
  covidZone?: string;
}

export interface WeekRange {
  start: string;
  end: string;
}

export interface LessonSlot {
  moduleCode: string;
  classNo: string;
  lessonType: string;
  day: Day;
  startTime: string;
  endTime: string;
  venue: string;
  weeks: number[];
}

export interface SelectedLesson extends LessonSlot {}

export interface Conflict {
  lessonA: SelectedLesson;
  lessonB: SelectedLesson;
  reason: string;
}
