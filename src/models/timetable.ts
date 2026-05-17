import type { Day, LessonSlot, SelectedLesson } from "./lesson.js";

export interface TimetablePreferences {
  avoidDays?: Day[];
  earliestStart?: string;
  latestEnd?: string;
  preferCompactDays?: boolean;
  avoidBackToBack?: boolean;
  preferFreeDay?: boolean;
}

export interface TimetableOption {
  score: number;
  lessons: SelectedLesson[];
  summary: string;
  nusmodsUrl?: string;
}

export interface GenerateTimetableRequest {
  modules: string[];
  semester: number;
  acadYear?: string;
  preferences?: TimetablePreferences;
  topK?: number;
}

export interface GenerateTimetableResult {
  hasSolutions: boolean;
  options: TimetableOption[];
  reasons?: string[];
}

export interface LessonGroup {
  key: string;
  moduleCode: string;
  lessonType: string;
  options: LessonSlot[][];
}
