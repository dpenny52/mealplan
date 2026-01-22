import {
  getExtendedDateRange,
  getExtendedWeeks,
  getExtendedWeekLabel,
  formatWeekRangeShort,
} from '../dateUtils';

describe('dateUtils', () => {
  describe('getExtendedDateRange', () => {
    it('returns date range spanning 2 weeks back to 2 weeks forward', () => {
      const { startDate, endDate, totalWeeks } = getExtendedDateRange();

      expect(totalWeeks).toBe(5); // 2 past + current + 2 future
      expect(new Date(startDate)).toBeInstanceOf(Date);
      expect(new Date(endDate)).toBeInstanceOf(Date);
    });

    it('returns thisWeekIndex as 2', () => {
      const { thisWeekIndex } = getExtendedDateRange();
      expect(thisWeekIndex).toBe(2);
    });

    it('spans approximately 35 days (5 weeks)', () => {
      const { startDate, endDate } = getExtendedDateRange();
      const start = new Date(startDate);
      const end = new Date(endDate);
      const daysDiff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      // 5 weeks = 35 days, but we count from start to end inclusive so it's 34 days difference
      expect(daysDiff).toBe(34);
    });
  });

  describe('getExtendedWeeks', () => {
    it('returns 5 weeks', () => {
      const weeks = getExtendedWeeks();
      expect(weeks).toHaveLength(5);
    });

    it('each week has 7 days', () => {
      const weeks = getExtendedWeeks();
      weeks.forEach((week) => {
        expect(week.days).toHaveLength(7);
      });
    });
  });

  describe('getExtendedWeekLabel', () => {
    it('returns correct labels for all 5 weeks', () => {
      expect(getExtendedWeekLabel(0)).toBe('2 WEEKS AGO');
      expect(getExtendedWeekLabel(1)).toBe('LAST WEEK');
      expect(getExtendedWeekLabel(2)).toBe('THIS WEEK');
      expect(getExtendedWeekLabel(3)).toBe('NEXT WEEK');
      expect(getExtendedWeekLabel(4)).toBe('IN 2 WEEKS');
    });

    it('returns empty string for out-of-range index', () => {
      expect(getExtendedWeekLabel(5)).toBe('');
      expect(getExtendedWeekLabel(-1)).toBe('');
    });
  });

  describe('formatWeekRangeShort', () => {
    it('formats date range as "JAN 19-25" style', () => {
      const weekStart = new Date(2026, 0, 19); // Jan 19, 2026
      const result = formatWeekRangeShort(weekStart);

      expect(result).toBe('JAN 19-25');
    });

    it('handles month boundary', () => {
      const weekStart = new Date(2026, 0, 26); // Jan 26, 2026
      const result = formatWeekRangeShort(weekStart);

      expect(result).toBe('JAN 26-FEB 1');
    });
  });
});
