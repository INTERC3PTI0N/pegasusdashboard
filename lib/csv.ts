/** CSV, every cell quoted; values that look like formulas are prefixed so spreadsheets don't run them. */
export function toCsv(rows: unknown[][]): string {
  const cell = (v: unknown) => {
    let s = v instanceof Date ? v.toISOString() : String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  };
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n'); // BOM: Excel reads it as UTF-8
}

export function csvResponse(csv: string, name: string): Response {
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}-${new Date().toISOString().slice(0, 10)}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
