import { describe, it, expect } from 'vitest';
import { printFileSize } from './index';

describe('printFileSize', () => {
  it('formats bytes', () => {
    expect(printFileSize(500)).toBe('500.00 B');
  });

  it('formats kilobytes', () => {
    expect(printFileSize(1024)).toBe('1.00 KB');
  });

  it('formats megabytes', () => {
    expect(printFileSize(1024 * 1024 * 2.5)).toBe('2.50 MB');
  });

  it('formats gigabytes', () => {
    expect(printFileSize(1024 ** 3)).toBe('1.00 GB');
  });
});
