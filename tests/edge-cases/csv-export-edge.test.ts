import { describe, it, expect } from 'vitest';

// Extracted from app/api/export/route.ts
function escapeCSV(val: any): string {
  const str = val == null ? '' : String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

describe('CSV escaping', () => {
  it('reason_text with double quotes: He said "hello" → "He said ""hello"""', () => {
    const result = escapeCSV('He said "hello"');
    expect(result).toBe('"He said ""hello"""');
  });

  it('reason_text with commas and newlines is properly wrapped', () => {
    const result = escapeCSV('work late, deadline\nstressed out');
    expect(result).toBe('"work late, deadline\nstressed out"');
    // Value is wrapped in double quotes, so commas and newlines are safe for CSV parsers
    expect(result.startsWith('"')).toBe(true);
    expect(result.endsWith('"')).toBe(true);
  });
});
