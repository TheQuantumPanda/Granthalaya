// SQL Server DateTime values are persisted in UTC, but serialized without an offset.
export function utcDate(value: string): Date {
  return new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);
}

export function localDate(value: string): string {
  return utcDate(value).toLocaleDateString();
}

export function localDateInput(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dueDateUtc(localDay: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDay)) return null;
  const [year, month, day] = localDay.split('-').map(Number);
  const end = new Date(year, month - 1, day + 1, 0, 0, 0, -1);
  if (end.getFullYear() !== year || end.getMonth() !== month - 1 || end.getDate() !== day) return null;
  return end.getTime() > Date.now() ? end.toISOString() : null;
}

export function isOverdue(record: { returnDate?: string | null; dueDate: string }, now = new Date()): boolean {
  return !record.returnDate && utcDate(record.dueDate).getTime() < now.getTime();
}
