import { describe, expect, it } from "vitest";
import { abbreviateLessonType, exportNusmodsUrl } from "../src/solver/nusmodsUrl.js";
import { lesson } from "./fixtures.js";

describe("exportNusmodsUrl", () => {
  it("maps common lesson types and class numbers into a share URL", () => {
    const url = exportNusmodsUrl(1, [
      lesson("CS2106", "Lecture", "1", "Tuesday", "10:00", "12:00", "LT15"),
      lesson("CS2106", "Tutorial", "02", "Wednesday", "14:00", "15:00", "COM1"),
      lesson("CS2103T", "Sectional Teaching", "1", "Monday", "09:00", "10:00", "I3"),
      lesson("CS2103T", "Laboratory", "03", "Thursday", "10:00", "12:00", "COM1"),
      lesson("CS2103T", "Recitation", "04", "Friday", "10:00", "12:00", "COM1"),
    ]);

    expect(decodeURIComponent(url)).toBe(
      "https://nusmods.com/timetable/sem-1/share?CS2103T=LAB:(03),REC:(04),SEC:(1)&CS2106=LEC:(1),TUT:(02)",
    );
  });

  it("abbreviates fallback lesson names deterministically", () => {
    expect(abbreviateLessonType("Custom Lesson Type")).toBe("CUSTOMLESSONTYPE");
  });
});
