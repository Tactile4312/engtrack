import type { ISODate } from '../types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = (n: number) => String(n).padStart(2, '0');

/** All dates are handled as local calendar days (no time zone shifts). */
export function toISO(d: Date): ISODate {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(s: ISODate): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayISO(): ISODate {
  return toISO(new Date());
}

export function addDays(s: ISODate, n: number): ISODate {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

/** Whole days from a to b (b - a). */
export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / 864e5);
}

export function fmt(s: ISODate | null | undefined, withYear = false): string {
  if (!s) return '—';
  const d = parseISO(s);
  return `${pad(d.getDate())} ${MONTHS[d.getMonth()]}${withYear ? ' ' + d.getFullYear() : ''}`;
}

export function fmtLong(s: ISODate): string {
  const d = parseISO(s);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthLabel(s: ISODate): string {
  const d = parseISO(s);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function monthShort(s: ISODate): string {
  return MONTHS[parseISO(s).getMonth()];
}

export function dayName(s: ISODate): string {
  return DAYS[parseISO(s).getDay()];
}

/** Monday of the week containing s. */
export function startOfWeek(s: ISODate): ISODate {
  const d = parseISO(s);
  const dow = (d.getDay() + 6) % 7;
  return addDays(s, -dow);
}

export function startOfMonth(s: ISODate): ISODate {
  return s.slice(0, 8) + '01';
}

export function addMonths(s: ISODate, n: number): ISODate {
  const d = parseISO(startOfMonth(s));
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

export function relTime(iso: string, now = new Date()): string {
  const mins = Math.round((now.getTime() - new Date(iso).getTime()) / 6e4);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return `${d} d ago`;
}

/** Shows a stored value; ISO dates become "24 Oct 2026". */
export function showVal(v: string | undefined | null): string {
  if (!v) return '—';
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? fmt(v, true) : v;
}
