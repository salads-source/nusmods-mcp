import { describe, expect, it } from "vitest";
import { checkTimetableConflicts } from "../src/solver/conflictChecker.js";
import { lesson } from "./fixtures.js";

describe("checkTimetableConflicts", () => {
  it("detects exact overlaps", () => {
    const result = checkTimetableConflicts([
      lesson("CS2106", "Lecture", "1", "Monday", "10:00", "12:00", "LT15"),
      lesson("CS2103T", "Lecture", "1", "Monday", "10:00", "12:00", "I3-AUD"),
    ]);

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toHaveLength(1);
  });

  it("allows adjacent lessons", () => {
    const result = checkTimetableConflicts([
      lesson("CS2106", "Lecture", "1", "Monday", "10:00", "12:00", "LT15"),
      lesson("CS2103T", "Lecture", "1", "Monday", "12:00", "14:00", "I3-AUD"),
    ]);

    expect(result.hasConflicts).toBe(false);
  });

  it("allows different days", () => {
    const result = checkTimetableConflicts([
      lesson("CS2106", "Lecture", "1", "Monday", "10:00", "12:00", "LT15"),
      lesson("CS2103T", "Lecture", "1", "Tuesday", "10:00", "12:00", "I3-AUD"),
    ]);

    expect(result.hasConflicts).toBe(false);
  });

  it("allows non-overlapping teaching weeks", () => {
    const result = checkTimetableConflicts([
      lesson("CS2106", "Lecture", "1", "Monday", "10:00", "12:00", "LT15", [1, 3, 5]),
      lesson("CS2103T", "Lecture", "1", "Monday", "10:00", "12:00", "I3-AUD", [2, 4, 6]),
    ]);

    expect(result.hasConflicts).toBe(false);
  });

  it("detects multi-week clashes", () => {
    const result = checkTimetableConflicts([
      lesson("CS2106", "Lecture", "1", "Monday", "10:00", "12:00", "LT15", [1, 2, 3]),
      lesson("CS2103T", "Lecture", "1", "Monday", "11:00", "13:00", "I3-AUD", [3, 4, 5]),
    ]);

    expect(result.hasConflicts).toBe(true);
  });
});
