import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Input } from './index';

describe('Input', () => {
  it('рендерит label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('input связан с label через htmlFor', () => {
    render(<Input label="Email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toBeInTheDocument();
  });

  it('показывает сообщение об ошибке', () => {
    render(<Input error="Ошибка" />);
    expect(screen.getByText('Ошибка')).toBeInTheDocument();
  });

  it('не показывает ошибку если error не передан', () => {
    render(<Input />);
    expect(screen.queryByText('Ошибка')).not.toBeInTheDocument();
  });
});
