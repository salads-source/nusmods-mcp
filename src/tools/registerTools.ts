import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { NusmodsClient } from "../clients/nusmodsClient.js";
import { normalizeModuleCode } from "../clients/nusmodsClient.js";
import { checkTimetableConflicts } from "../solver/conflictChecker.js";
import { exportNusmodsUrl } from "../solver/nusmodsUrl.js";
import { TimetableSolver } from "../solver/timetableSolver.js";
import { normalizeTime } from "../utils/time.js";
import { errorContent, jsonContent } from "./response.js";
import {
  checkConflictsSchema,
  exportNusmodsUrlSchema,
  generateTimetableSchema,
  getModuleDetailsSchema,
  getModuleTimetableSchema,
  searchModulesSchema,
} from "./schemas.js";

export function registerTools(server: McpServer, client: NusmodsClient): void {
  const solver = new TimetableSolver(client);

  server.registerTool(
    "search_modules",
    {
      description: "Search NUS modules by keyword or module code.",
      inputSchema: searchModulesSchema,
    },
    async ({ query, acadYear }) => {
      try {
        return jsonContent(await client.searchModules(query, acadYear));
      } catch (error) {
        return errorContent(error);
      }
    },
  );

  server.registerTool(
    "get_module_details",
    {
      description: "Fetch full NUSMods details for a module.",
      inputSchema: getModuleDetailsSchema,
    },
    async ({ moduleCode, acadYear }) => {
      try {
        return jsonContent(await client.getModule(moduleCode, acadYear));
      } catch (error) {
        return errorContent(error);
      }
    },
  );

  server.registerTool(
    "get_module_timetable",
    {
      description: "Fetch all lesson slots for a module in a semester.",
      inputSchema: getModuleTimetableSchema,
    },
    async ({ moduleCode, semester, acadYear }) => {
      try {
        return jsonContent(await client.getSemesterTimetable(moduleCode, acadYear, semester));
      } catch (error) {
        return errorContent(error);
      }
    },
  );

  server.registerTool(
    "check_timetable_conflicts",
    {
      description: "Check selected NUSMods lesson slots for timetable clashes.",
      inputSchema: checkConflictsSchema,
    },
    async ({ selections }) => jsonContent(checkTimetableConflicts(selections.map(normalizeSelectedLesson))),
  );

  server.registerTool(
    "generate_timetable",
    {
      description: "Generate ranked valid timetable combinations deterministically from modules and preferences.",
      inputSchema: generateTimetableSchema,
    },
    async ({ modules, semester, acadYear, preferences, topK }) => {
      try {
        return jsonContent(
          await solver.generateTimetable({
            modules,
            semester,
            acadYear,
            preferences: preferences
              ? {
                  ...preferences,
                  earliestStart: preferences.earliestStart ? normalizeTime(preferences.earliestStart) : undefined,
                  latestEnd: preferences.latestEnd ? normalizeTime(preferences.latestEnd) : undefined,
                }
              : undefined,
            topK,
          }),
        );
      } catch (error) {
        return errorContent(error);
      }
    },
  );

  server.registerTool(
    "export_nusmods_url",
    {
      description: "Generate a NUSMods share URL from selected lessons.",
      inputSchema: exportNusmodsUrlSchema,
    },
    async ({ semester, selectedLessons }) =>
      jsonContent({
        url: exportNusmodsUrl(semester, selectedLessons.map(normalizeSelectedLesson)),
      }),
  );
}

function normalizeSelectedLesson<T extends { moduleCode: string; startTime: string; endTime: string }>(lesson: T): T {
  return {
    ...lesson,
    moduleCode: normalizeModuleCode(lesson.moduleCode),
    startTime: normalizeTime(lesson.startTime),
    endTime: normalizeTime(lesson.endTime),
  };
}
