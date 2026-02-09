import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Alert } from './index';

describe('Alert', () => {
  it('рендерит переданный текст', () => {
    render(<Alert>Ошибка!</Alert>);
    expect(screen.getByText('Ошибка!')).toBeInTheDocument();
  });
});
