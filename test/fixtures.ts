import type { LessonSlot } from "../src/models/lesson.js";
import type { ModuleListItem, NusmodsModule } from "../src/models/module.js";

export const moduleListFixture: ModuleListItem[] = [
  { moduleCode: "CS2106", title: "Introduction to Operating Systems", semesters: [1, 2] },
  { moduleCode: "CS2103T", title: "Software Engineering", semesters: [1, 2] },
  { moduleCode: "ST2334", title: "Probability and Statistics", semesters: [1, 2] },
];

export const cs2106Fixture: NusmodsModule = {
  moduleCode: "CS2106",
  title: "Introduction to Operating Systems",
  department: "Computer Science",
  description: "Operating systems concepts.",
  moduleCredit: "4",
  prerequisite: "CS2100",
  semesterData: [
    {
      semester: 1,
      examDate: "2025-11-25T01:00:00.000Z",
      examDuration: 120,
      timetable: [
        lesson("CS2106", "Lecture", "1", "Tuesday", "10:00", "12:00", "LT15"),
        lesson("CS2106", "Tutorial", "01", "Wednesday", "14:00", "15:00", "COM1-0203"),
        lesson("CS2106", "Tutorial", "02", "Friday", "14:00", "15:00", "COM1-0203"),
      ],
    },
  ],
};

export function lesson(
  moduleCode: string,
  lessonType: string,
  classNo: string,
  day: LessonSlot["day"],
  startTime: string,
  endTime: string,
  venue: string,
  weeks = [1, 2, 3, 4, 5, 6],
): LessonSlot {
  return {
    moduleCode,
    lessonType,
    classNo,
    day,
    startTime,
    endTime,
    venue,
    weeks,
  };
}
