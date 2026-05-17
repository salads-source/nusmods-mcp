const TIME_PATTERN = /^([01]\d|2[0-3]):?([0-5]\d)$/;

export function normalizeTime(value: string): string {
  const match = TIME_PATTERN.exec(value);
  if (!match) {
    throw new Error(`Invalid time "${value}". Expected HH:mm or HHmm.`);
  }

  return `${match[1]}:${match[2]}`;
}

export function timeToMinutes(value: string): number {
  const normalized = normalizeTime(value);
  const [hours, minutes] = normalized.split(":").map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function normalizeNusmodsTime(value: string): string {
  return normalizeTime(value);
}
