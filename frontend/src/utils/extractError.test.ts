import { describe, it, expect } from 'vitest';
import { extractError } from './extractError';

describe('extractError', () => {
  it('возвращает detail строку', () => {
    const err = {
      response: {
        data: {
          detail: 'Ошибка авторизации',
        },
      },
    };

    expect(extractError(err)).toBe('Ошибка авторизации');
  });

  it('возвращает detail из массива', () => {
    const err = {
      response: {
        data: {
          detail: [{ msg: 'Неверный email' }],
        },
      },
    };

    expect(extractError(err)).toBe('Неверный email');
  });

  it('возвращает message если есть', () => {
    const err = {
      response: {
        data: {
          message: 'Server error',
        },
      },
    };

    expect(extractError(err)).toBe('Server error');
  });

  it('возвращает message из Error instance', () => {
    const err = new Error('JS error');
    expect(extractError(err)).toBe('JS error');
  });

  it('возвращает "Ошибка" если detail массив пуст', () => {
    const err = {
      response: {
        data: {
          detail: [],
        },
      },
    };

    expect(extractError(err)).toBe('Ошибка');
  });

  it('возвращает неизвестную ошибку если ничего нет', () => {
    expect(extractError({})).toBe('Неизвестная ошибка');
  });

  it('возвращает неизвестную ошибку если null', () => {
    expect(extractError(null)).toBe('Неизвестная ошибка');
  });
});
