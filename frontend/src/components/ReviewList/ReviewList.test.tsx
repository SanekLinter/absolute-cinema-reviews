import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../ReviewMiniCard', () => ({
  ReviewMiniCard: ({ review }: any) => <div>{review.title}</div>,
}));

import { ReviewList } from './index';

describe('ReviewList', () => {
  it('показывает сообщение если пусто', () => {
    render(<ReviewList reviews={[]} />);
    expect(screen.getByText('Рецензии не найдены ☹')).toBeInTheDocument();
  });

  it('рендерит список карточек', () => {
    const reviews = [
      { id: 1, title: 'Test', content: '', status: 'approved' },
      { id: 2, title: 'Test2', content: '', status: 'approved' },
    ] as any;

    render(<ReviewList reviews={reviews} />);

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Test2')).toBeInTheDocument();
  });
});
