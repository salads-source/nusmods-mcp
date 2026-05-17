import type { SelectedLesson } from "../models/lesson.js";

const LESSON_TYPE_ABBREVIATIONS: Record<string, string> = {
  "Design Lecture": "DLEC",
  Laboratory: "LAB",
  Lecture: "LEC",
  "Packaged Lecture": "PLEC",
  "Packaged Tutorial": "PTUT",
  Recitation: "REC",
  "Sectional Teaching": "SEC",
  Seminar: "SEM",
  "Seminar-Style Module Class": "SEM",
  Tutorial: "TUT",
  "Tutorial Type 2": "TUT2",
  Workshop: "WS",
};

export function exportNusmodsUrl(semester: number, selectedLessons: SelectedLesson[]): string {
  const modules = new Map<string, Map<string, Set<string>>>();

  for (const lesson of selectedLessons) {
    const moduleCode = lesson.moduleCode.toUpperCase();
    const lessonType = abbreviateLessonType(lesson.lessonType);
    const lessonTypes = modules.get(moduleCode) ?? new Map<string, Set<string>>();
    const classNumbers = lessonTypes.get(lessonType) ?? new Set<string>();
    classNumbers.add(lesson.classNo);
    lessonTypes.set(lessonType, classNumbers);
    modules.set(moduleCode, lessonTypes);
  }

  const query = [...modules.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([moduleCode, lessonTypes]) => {
      const selections = [...lessonTypes.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([lessonType, classNumbers]) => {
          const classes = [...classNumbers].sort((a, b) => a.localeCompare(b)).join(",");
          return `${lessonType}:(${classes})`;
        })
        .join(",");
      return `${encodeURIComponent(moduleCode)}=${encodeURIComponent(selections)}`;
    })
    .join("&");

  return `https://nusmods.com/timetable/sem-${semester}/share${query ? `?${query}` : ""}`;
}

export function abbreviateLessonType(lessonType: string): string {
  return LESSON_TYPE_ABBREVIATIONS[lessonType] ?? lessonType.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
}
