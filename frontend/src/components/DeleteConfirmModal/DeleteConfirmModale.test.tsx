import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DeleteConfirmModal } from './index';

describe('DeleteConfirmModal', () => {
  it('не рендерится если закрыт', () => {
    const { container } = render(
      <DeleteConfirmModal isOpen={false} onConfirm={() => {}} onCancel={() => {}} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('вызывает confirm', () => {
    const onConfirm = vi.fn();

    render(<DeleteConfirmModal isOpen={true} onConfirm={onConfirm} onCancel={() => {}} />);

    fireEvent.click(screen.getByText('Удалить'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('вызывает cancel', () => {
    const onCancel = vi.fn();

    render(<DeleteConfirmModal isOpen={true} onConfirm={() => {}} onCancel={onCancel} />);

    fireEvent.click(screen.getByText('Отмена'));
    expect(onCancel).toHaveBeenCalled();
  });
});
