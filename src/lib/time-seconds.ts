const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;

export function minutesToSeconds(minutes: number): number {
  return minutes * SECONDS_IN_MINUTE;
}

export function hoursToSeconds(hours: number): number {
  return hours * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;
}

export function daysToSeconds(days: number): number {
  return days * HOURS_IN_DAY * MINUTES_IN_HOUR * SECONDS_IN_MINUTE;
}
