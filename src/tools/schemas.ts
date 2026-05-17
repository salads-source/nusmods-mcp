import { z } from "zod";
import { DAYS } from "../models/lesson.js";

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):?([0-5]\d)$/, "Expected HH:mm or HHmm.");
const daySchema = z.enum(DAYS);
const semesterSchema = z.number().int().min(1).max(4);
const acadYearSchema = z.string().regex(/^\d{4}-\d{4}$/).optional();
const moduleCodeSchema = z.string().min(2).max(16).transform((value) => value.trim().toUpperCase());

export const lessonSelectionSchema = z.object({
  moduleCode: moduleCodeSchema,
  classNo: z.string().min(1),
  lessonType: z.string().min(1),
  day: daySchema,
  startTime: timeSchema,
  endTime: timeSchema,
  venue: z.string(),
  weeks: z.array(z.number().int().min(1)).default([]),
});

export const searchModulesSchema = {
  query: z.string().min(1),
  acadYear: acadYearSchema,
};

export const getModuleDetailsSchema = {
  moduleCode: moduleCodeSchema,
  acadYear: acadYearSchema,
};

export const getModuleTimetableSchema = {
  moduleCode: moduleCodeSchema,
  semester: semesterSchema,
  acadYear: acadYearSchema,
};

export const checkConflictsSchema = {
  selections: z.array(lessonSelectionSchema),
};

export const generateTimetableSchema = {
  modules: z.array(moduleCodeSchema).min(1).max(10),
  semester: semesterSchema,
  acadYear: acadYearSchema,
  preferences: z
    .object({
      avoidDays: z.array(daySchema).optional(),
      earliestStart: timeSchema.optional(),
      latestEnd: timeSchema.optional(),
      preferCompactDays: z.boolean().optional(),
      avoidBackToBack: z.boolean().optional(),
      preferFreeDay: z.boolean().optional(),
    })
    .optional(),
  topK: z.number().int().min(1).max(20).optional(),
};

export const exportNusmodsUrlSchema = {
  semester: semesterSchema,
  selectedLessons: z.array(lessonSelectionSchema),
};
