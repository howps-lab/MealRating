const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Returns today's date in local ISO format 'YYYY-MM-DD'
 */
export function getTodayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current month-year string in 'MMM-yyyy' format (e.g., 'Oct-2026')
 */
export function getCurrentMonthYear(): string {
  const now = new Date();
  const monthName = MONTH_NAMES_SHORT[now.getMonth()];
  return `${monthName}-${now.getFullYear()}`;
}

/**
 * Converts an ISO date string ('YYYY-MM-DD') into 'MMM-yyyy' (e.g., 'Oct-2026')
 */
export function isoToMonthYear(isoDate: string): string {
  if (!isoDate) return getCurrentMonthYear();
  const parts = isoDate.split('-');
  if (parts.length < 2) return getCurrentMonthYear();
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const monthName = MONTH_NAMES_SHORT[monthIndex] || 'Jan';
  return `${monthName}-${year}`;
}

/**
 * Converts an ISO date string ('YYYY-MM-DD') into 'dd MMM yyyy' (e.g., '09 Oct 2026')
 */
export function formatDisplayDate(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length < 3) return isoDate;
  const year = parts[0];
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, '0');
  const monthName = MONTH_NAMES_SHORT[monthIndex] || 'Jan';
  return `${day} ${monthName} ${year}`;
}

/**
 * Checks if an ISO date string matches a given 'MMM-yyyy' selection
 */
export function isDateInMonthYear(isoDate: string, targetMonthYear: string): boolean {
  return isoToMonthYear(isoDate) === targetMonthYear;
}

/**
 * Extracts and sorts all unique month-year strings from meals plus the current month-year.
 * Returns sorted chronologically descending (newest month first).
 */
export function getAvailableMonths(mealDates: string[], currentMonthYear: string): string[] {
  const monthSet = new Set<string>();
  monthSet.add(currentMonthYear);

  for (const dateStr of mealDates) {
    if (dateStr) {
      monthSet.add(isoToMonthYear(dateStr));
    }
  }

  const monthsArray = Array.from(monthSet);

  // Sort chronologically descending
  return monthsArray.sort((a, b) => {
    const [monthA, yearA] = a.split('-');
    const [monthB, yearB] = b.split('-');
    const idxA = MONTH_NAMES_SHORT.indexOf(monthA);
    const idxB = MONTH_NAMES_SHORT.indexOf(monthB);
    const numYearA = parseInt(yearA, 10);
    const numYearB = parseInt(yearB, 10);

    if (numYearA !== numYearB) {
      return numYearB - numYearA;
    }
    return idxB - idxA;
  });
}
