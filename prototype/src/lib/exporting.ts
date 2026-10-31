export type Cell = string | number | null | undefined;

/**
 * CSV with a byte-order mark so Excel opens it as UTF-8.
 * Text starting with a formula character gets a leading apostrophe, so a typed name can't run as a spreadsheet formula.
 */
export function toCSV(header: string[], rows: Cell[][]): string {
  const q = (v: Cell) => {
    let s = v == null ? '' : String(v);
    if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '﻿' + [header, ...rows].map((r) => r.map(q).join(',')).join('\r\n');
}

/** Returns false where the page is not allowed to start a download (e.g. a sandboxed preview). */
export function download(filename: string, text: string, type = 'text/csv;charset=utf-8'): boolean {
  try {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    return true;
  } catch {
    return false;
  }
}
