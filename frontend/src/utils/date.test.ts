import { describe, it, expect } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('форматирует ISO дату', () => {
    const result = formatDate('2024-01-01');
    expect(result).toBe('01.01.2024');
  });

  it('форматирует ISO с временем', () => {
    const result = formatDate('2023-05-10T12:00:00Z');
    expect(result).toBe('10.05.2023');
  });

  it('выбрасывает ошибку при некорректной дате', () => {
    expect(() => formatDate('invalid-date')).toThrow();
  });
});
