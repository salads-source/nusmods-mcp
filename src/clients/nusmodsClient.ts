import type { LessonSlot } from "../models/lesson.js";
import type { ModuleListItem, ModuleSearchResult, NusmodsModule } from "../models/module.js";
import { normalizeNusmodsTime } from "../utils/time.js";
import { normalizeWeeks } from "../utils/weeks.js";
import { TtlCache } from "./cache.js";

export class NusmodsApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "NusmodsApiError";
  }
}

export interface NusmodsClientOptions {
  baseUrl?: string;
  cacheTtlMs?: number;
  fetchImpl?: typeof fetch;
}

export class NusmodsClient {
  private readonly baseUrl: string;
  private readonly cache: TtlCache;
  private readonly fetchImpl: typeof fetch;

  constructor(options: NusmodsClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.nusmods.com/v2";
    this.cache = new TtlCache(options.cacheTtlMs ?? envNumber("NUSMODS_CACHE_TTL_MS", 12 * 60 * 60 * 1000));
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async getLatestAcadYear(): Promise<string> {
    const configured = process.env.NUSMODS_ACAD_YEAR;
    if (configured) {
      return configured;
    }

    try {
      const html = await this.fetchText(this.baseUrl);
      const years = [...html.matchAll(/href="(\d{4}-\d{4})\/"/g)].map((match) => match[1]);
      years.sort();
      return years.at(-1) ?? "2025-2026";
    } catch {
      return "2025-2026";
    }
  }

  async getModuleList(acadYear?: string): Promise<ModuleListItem[]> {
    const year = acadYear ?? (await this.getLatestAcadYear());
    return this.fetchJson<ModuleListItem[]>(`${year}/moduleList.json`);
  }

  async getModule(moduleCode: string, acadYear?: string): Promise<NusmodsModule> {
    const year = acadYear ?? (await this.getLatestAcadYear());
    const code = normalizeModuleCode(moduleCode);
    return this.fetchJson<NusmodsModule>(`${year}/modules/${encodeURIComponent(code)}.json`);
  }

  async getSemesterTimetable(moduleCode: string, acadYear: string | undefined, semester: number): Promise<LessonSlot[]> {
    const module = await this.getModule(moduleCode, acadYear);
    const normalizedCode = normalizeModuleCode(moduleCode);
    const semesterData = module.semesterData?.find((data) => data.semester === semester);
    if (!semesterData) {
      const offered = module.semesterData?.map((data) => data.semester).sort((a, b) => a - b) ?? [];
      throw new NusmodsApiError(`${normalizedCode} is not offered in semester ${semester}. Offered semesters: ${offered.join(", ") || "none"}.`, 404);
    }

    return (semesterData.timetable ?? []).map((lesson) => ({
      moduleCode: normalizedCode,
      classNo: lesson.classNo,
      lessonType: lesson.lessonType,
      day: lesson.day,
      startTime: normalizeNusmodsTime(lesson.startTime),
      endTime: normalizeNusmodsTime(lesson.endTime),
      venue: lesson.venue,
      weeks: normalizeWeeks(lesson.weeks),
    }));
  }

  async searchModules(query: string, acadYear?: string): Promise<ModuleSearchResult[]> {
    const normalizedQuery = query.trim().toLowerCase();
    const moduleList = await this.getModuleList(acadYear);

    if (!normalizedQuery) {
      return [];
    }

    const startsWithMatches = moduleList.filter((item) => item.moduleCode.toLowerCase().startsWith(normalizedQuery));
    const containsMatches = moduleList.filter((item) => {
      const code = item.moduleCode.toLowerCase();
      const title = item.title.toLowerCase();
      return !code.startsWith(normalizedQuery) && (code.includes(normalizedQuery) || title.includes(normalizedQuery));
    });

    const matches = [...startsWithMatches, ...containsMatches].slice(0, 25);
    const details = await Promise.all(
      matches.map(async (item) => {
        try {
          return await this.getModule(item.moduleCode, acadYear);
        } catch {
          return undefined;
        }
      }),
    );

    return matches.map((item, index) => ({
      moduleCode: item.moduleCode,
      title: item.title,
      department: details[index]?.department,
      semesters: item.semesters,
    }));
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const cacheKey = `json:${path}`;
    const cached = this.cache.get<T>(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${this.baseUrl.replace(/\/$/, "")}/${path}`;
    const response = await this.fetchImpl(url);
    if (!response.ok) {
      throw new NusmodsApiError(`NUSMods API request failed for ${path}.`, response.status);
    }

    const data = (await response.json()) as T;
    this.cache.set(cacheKey, data);
    return data;
  }

  private async fetchText(url: string): Promise<string> {
    const cacheKey = `text:${url}`;
    const cached = this.cache.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    const response = await this.fetchImpl(url);
    if (!response.ok) {
      throw new NusmodsApiError(`NUSMods API request failed for ${url}.`, response.status);
    }

    const text = await response.text();
    this.cache.set(cacheKey, text);
    return text;
  }
}

export function normalizeModuleCode(moduleCode: string): string {
  return moduleCode.trim().toUpperCase();
}

function envNumber(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
