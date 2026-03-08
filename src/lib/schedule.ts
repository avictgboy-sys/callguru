import type { DaySchedule } from "@/hooks/useServices";

const DAYS_MAP: Record<number, string> = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
};

/**
 * Check if a service is currently available based on its schedule.
 * Returns true if no schedule is set (always available).
 */
export const isWithinSchedule = (
  schedule: Record<string, DaySchedule> | null | undefined
): boolean => {
  if (!schedule || Object.keys(schedule).length === 0) return true;

  const now = new Date();
  const dayName = DAYS_MAP[now.getDay()];
  const daySchedule = schedule[dayName];

  if (!daySchedule || !daySchedule.enabled) return false;

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return currentTime >= daySchedule.start && currentTime <= daySchedule.end;
};

/**
 * Get a human-readable schedule status message.
 */
export const getScheduleStatus = (
  schedule: Record<string, DaySchedule> | null | undefined
): { available: boolean; message: string } => {
  if (!schedule || Object.keys(schedule).length === 0) {
    return { available: true, message: "Always available" };
  }

  const now = new Date();
  const dayName = DAYS_MAP[now.getDay()];
  const daySchedule = schedule[dayName];

  if (!daySchedule || !daySchedule.enabled) {
    // Find next available day
    for (let i = 1; i <= 7; i++) {
      const nextDay = DAYS_MAP[(now.getDay() + i) % 7];
      if (schedule[nextDay]?.enabled) {
        return {
          available: false,
          message: `Next: ${nextDay} ${schedule[nextDay].start}`,
        };
      }
    }
    return { available: false, message: "No schedule set" };
  }

  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  if (currentTime < daySchedule.start) {
    return { available: false, message: `Available from ${daySchedule.start}` };
  }

  if (currentTime > daySchedule.end) {
    // Find next available slot
    for (let i = 1; i <= 7; i++) {
      const nextDay = DAYS_MAP[(now.getDay() + i) % 7];
      if (schedule[nextDay]?.enabled) {
        return {
          available: false,
          message: `Next: ${nextDay} ${schedule[nextDay].start}`,
        };
      }
    }
    return { available: false, message: "Closed for today" };
  }

  return { available: true, message: `Until ${daySchedule.end}` };
};
