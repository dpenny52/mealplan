/**
 * Date utilities for the 4-week meal planner calendar.
 *
 * The calendar shows a rolling 4-week window:
 * - 2 weeks ago
 * - Last week
 * - This week (auto-scrolled on open)
 * - Next week
 *
 * All weeks start on Monday and end on Sunday.
 *
 * Example output for get4WeekWindow() if today is Wed Jan 15, 2025:
 *   - Week 0: Mon Jan 6 - Sun Jan 12 (2 weeks ago)
 *   - Week 1: Mon Jan 13 - Sun Jan 19 (last week)
 *   - Week 2: Mon Jan 20 - Sun Jan 26 (this week - includes today Jan 22)
 *   - Week 3: Mon Jan 27 - Sun Feb 2 (next week)
 */

import {
  startOfWeek,
  subWeeks,
  addWeeks,
  eachDayOfInterval,
  format,
  parseISO,
  isToday as isDateToday,
  isBefore,
  startOfDay,
  isSameMonth,
} from 'date-fns';

/**
 * Data for a single day in the calendar.
 */
export interface DayData {
  /** The actual Date object */
  date: Date;
  /** YYYY-MM-DD format string for Convex storage key */
  dateKey: string;
  /** True if this day is today */
  isToday: boolean;
  /** True if this day is in the past (before today) */
  isPast: boolean;
}

/**
 * Data for a week row in the calendar.
 */
export interface WeekData {
  /** Monday of this week */
  weekStart: Date;
  /** Week index (0 = 2 weeks ago, 1 = last week, 2 = this week, 3 = next week) */
  weekIndex: number;
  /** Array of 7 days (Mon-Sun) */
  days: DayData[];
}

/** Index of "this week" in the 4-week window */
export const THIS_WEEK_INDEX = 2;

/**
 * Returns array of 28 Date objects spanning 2 weeks ago through next week.
 * Always starts on Monday.
 *
 * Example: If today is Wed Jan 15, returns Mon Jan 6 through Sun Feb 2.
 */
export function get4WeekWindow(): Date[] {
  const today = new Date();
  const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const windowStart = subWeeks(thisWeekStart, 2); // 2 weeks ago
  const windowEnd = addWeeks(thisWeekStart, 1); // Start of next week + 6 days
  const actualEnd = new Date(windowEnd);
  actualEnd.setDate(actualEnd.getDate() + 6); // End on Sunday

  return eachDayOfInterval({ start: windowStart, end: actualEnd });
}

/**
 * Formats a Date to YYYY-MM-DD string for Convex storage.
 *
 * Example: new Date(2025, 0, 15) => "2025-01-15"
 */
export function formatDateKey(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parses a YYYY-MM-DD string back to a Date object.
 *
 * Example: "2025-01-15" => Date object for Jan 15, 2025
 */
export function parseDateKey(dateKey: string): Date {
  return parseISO(dateKey);
}

/**
 * Groups 28 days into 4 WeekData objects.
 * Each week contains Mon-Sun.
 *
 * Example output for week 2 (this week):
 * {
 *   weekStart: Date(Mon Jan 20),
 *   weekIndex: 2,
 *   days: [
 *     { date: Date(Mon Jan 20), dateKey: "2025-01-20", isToday: false, isPast: true },
 *     { date: Date(Tue Jan 21), dateKey: "2025-01-21", isToday: false, isPast: true },
 *     { date: Date(Wed Jan 22), dateKey: "2025-01-22", isToday: true, isPast: false },
 *     ...
 *   ]
 * }
 */
export function groupIntoWeeks(days: Date[]): WeekData[] {
  const weeks: WeekData[] = [];
  const todayStart = startOfDay(new Date());

  for (let weekIndex = 0; weekIndex < 4; weekIndex++) {
    const weekDays = days.slice(weekIndex * 7, (weekIndex + 1) * 7);
    const weekStart = weekDays[0];

    weeks.push({
      weekStart,
      weekIndex,
      days: weekDays.map((date) => ({
        date,
        dateKey: formatDateKey(date),
        isToday: isDateToday(date),
        isPast: isBefore(date, todayStart),
      })),
    });
  }

  return weeks;
}

/**
 * Returns human-readable date range for a week.
 * Handles month boundary (different format when week spans months).
 *
 * Examples:
 *   - Same month: "Jan 13 - Jan 19"
 *   - Spans months: "Jan 27 - Feb 2"
 */
export function formatWeekRange(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const startFormat = format(weekStart, 'MMM d');
  const endFormat = isSameMonth(weekStart, weekEnd)
    ? format(weekEnd, 'd')
    : format(weekEnd, 'MMM d');

  return `${startFormat} - ${endFormat}`;
}

/**
 * Returns human label for week position in the 4-week window.
 *
 * Example:
 *   0 => "2 weeks ago"
 *   1 => "Last week"
 *   2 => "This week"
 *   3 => "Next week"
 */
export function getWeekLabel(weekIndex: number): string {
  const labels = ['2 weeks ago', 'Last week', 'This week', 'Next week'];
  return labels[weekIndex] ?? '';
}
