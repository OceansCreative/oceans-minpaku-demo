/**
 * Shared, pure CSV primitives (RFC 4180). No DOM, no `new Date()`, no network —
 * the UI turns the returned string into a download. Used by the reservation and
 * sales exporters so escaping behaves identically everywhere.
 */

/**
 * Escape a single field per RFC 4180: wrap in double quotes only when the value
 * contains a comma, double quote, CR, or LF, doubling any interior quotes.
 * Plain values pass through untouched.
 */
export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

/** Join one row of already-stringified cells into an escaped CSV line. */
export function toCsvRow(cells: readonly string[]): string {
  return cells.map(escapeCsvField).join(',');
}

/** Render rows of cells into a `\n`-separated CSV document. */
export function toCsv(rows: readonly (readonly string[])[]): string {
  return rows.map(toCsvRow).join('\n');
}
