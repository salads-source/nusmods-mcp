import type { NusmodsLesson } from "./lesson.js";

export interface ModuleListItem {
  moduleCode: string;
  title: string;
  semesters: number[];
}

export interface SemesterData {
  semester: number;
  examDate?: string;
  examDuration?: number;
  timetable?: NusmodsLesson[];
  covidZones?: string[];
}

export interface NusmodsModule {
  acadYear?: string;
  moduleCode: string;
  title: string;
  description?: string;
  moduleCredit?: string;
  department?: string;
  faculty?: string;
  prerequisite?: string;
  preclusion?: string;
  corequisite?: string;
  workload?: number[];
  semesterData?: SemesterData[];
}

export interface ModuleSearchResult {
  moduleCode: string;
  title: string;
  department?: string;
  semesters: number[];
}
