import { describe, expect, it } from "vitest";
import type { NusmodsClient } from "../src/clients/nusmodsClient.js";
import { TimetableSolver } from "../src/solver/timetableSolver.js";
import { lesson } from "./fixtures.js";

describe("TimetableSolver", () => {
  it("selects every required lesson type once", async () => {
    const solver = new TimetableSolver(mockClient());
    const result = await solver.generateTimetable({ modules: ["CS2106"], semester: 1 });

    expect(result.hasSolutions).toBe(true);
    expect(result.options[0].lessons.map((slot) => `${slot.lessonType}:${slot.classNo}`).sort()).toEqual(["Lecture:1", "Tutorial:01"]);
  });

  it("avoids Friday as a hard constraint", async () => {
    const solver = new TimetableSolver(mockClient());
    const result = await solver.generateTimetable({
      modules: ["CS2106"],
      semester: 1,
      preferences: { avoidDays: ["Friday"] },
    });

    expect(result.hasSolutions).toBe(true);
    expect(result.options[0].lessons.every((slot) => slot.day !== "Friday")).toBe(true);
  });

  it("respects earliest and latest hard constraints", async () => {
    const solver = new TimetableSolver(mockClient());
    const result = await solver.generateTimetable({
      modules: ["CS2106"],
      semester: 1,
      preferences: { earliestStart: "10:00", latestEnd: "16:00" },
    });

    expect(result.hasSolutions).toBe(true);
    expect(result.options[0].lessons.every((slot) => slot.startTime >= "10:00" && slot.endTime <= "16:00")).toBe(true);
  });

  it("ranks compact schedules higher", async () => {
    const solver = new TimetableSolver(mockClient());
    const result = await solver.generateTimetable({
      modules: ["CS2106", "ST2334"],
      semester: 1,
      preferences: { preferCompactDays: true, preferFreeDay: true },
      topK: 2,
    });

    expect(result.hasSolutions).toBe(true);
    expect(result.options[0].score).toBeGreaterThanOrEqual(result.options[1].score);
  });

  it("returns no options for impossible constraints", async () => {
    const solver = new TimetableSolver(mockClient());
    const result = await solver.generateTimetable({
      modules: ["CS2106"],
      semester: 1,
      preferences: { avoidDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] },
    });

    expect(result.hasSolutions).toBe(false);
    expect(result.options).toEqual([]);
  });
});

function mockClient(): NusmodsClient {
  return {
    getSemesterTimetable: async (moduleCode: string) => {
      if (moduleCode === "CS2106") {
        return [
          lesson("CS2106", "Lecture", "1", "Tuesday", "10:00", "12:00", "LT15"),
          lesson("CS2106", "Tutorial", "01", "Wednesday", "14:00", "15:00", "COM1"),
          lesson("CS2106", "Tutorial", "02", "Friday", "14:00", "15:00", "COM1"),
        ];
      }

      return [
        lesson("ST2334", "Lecture", "1", "Tuesday", "12:00", "14:00", "LT20"),
        lesson("ST2334", "Lecture", "2", "Thursday", "12:00", "14:00", "LT20"),
      ];
    },
  } as NusmodsClient;
}
