export interface CalendarDay {
  date: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface CalendarWeek {
  days: CalendarDay[];
}

export function getCalendarWeeks(year: number, month: number): CalendarWeek[] {
  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Monday = 0, Sunday = 6 (ISO week)
  const startDayOfWeek = (firstDay.getDay() + 6) % 7;
  const totalDaysInMonth = lastDay.getDate();

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const weeks: CalendarWeek[] = [];
  let currentWeek: CalendarDay[] = [];

  // Fill leading days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const prevMonth = month - 1;
    const prevYear = prevMonth < 0 ? year - 1 : year;
    const normalizedMonth = prevMonth < 0 ? 11 : prevMonth;
    currentWeek.push({
      date: d,
      month: normalizedMonth,
      year: prevYear,
      isCurrentMonth: false,
      isToday: d === todayDate && normalizedMonth === todayMonth && prevYear === todayYear,
    });
  }

  // Fill days of current month
  for (let d = 1; d <= totalDaysInMonth; d++) {
    currentWeek.push({
      date: d,
      month,
      year,
      isCurrentMonth: true,
      isToday: d === todayDate && month === todayMonth && year === todayYear,
    });
    if (currentWeek.length === 7) {
      weeks.push({ days: currentWeek });
      currentWeek = [];
    }
  }

  // Fill trailing days from next month
  if (currentWeek.length > 0) {
    let nextDay = 1;
    const nextMonth = month + 1;
    const nextYear = nextMonth > 11 ? year + 1 : year;
    const normalizedMonth = nextMonth > 11 ? 0 : nextMonth;
    while (currentWeek.length < 7) {
      currentWeek.push({
        date: nextDay,
        month: normalizedMonth,
        year: nextYear,
        isCurrentMonth: false,
        isToday:
          nextDay === todayDate && normalizedMonth === todayMonth && nextYear === todayYear,
      });
      nextDay++;
    }
    weeks.push({ days: currentWeek });
  }

  return weeks;
}

export function getMonthNames(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
  return Array.from({ length: 12 }, (_, i) => {
    const date = new Date(2024, i, 1);
    return formatter.format(date);
  });
}

export function getDayOfWeekNames(locale: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });
  // Start from Monday (2024-01-01 is a Monday)
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(2024, 0, 1 + i);
    return formatter.format(date);
  });
}
