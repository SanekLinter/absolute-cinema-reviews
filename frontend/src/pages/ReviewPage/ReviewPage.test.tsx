import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, it, vi, expect } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ReviewPage } from './index';
import * as apiReviews from '../../api/reviews';
import { useMe } from '../../context/AuthContext';

vi.mock('./index.module.scss', () => ({ default: {} }));
vi.mock('../../components/ReviewCard', () => ({
  ReviewCard: ({ review, ...props }: any) => (
    <div>
      ReviewCard {review?.id} {review?.title || ''}
      {props.actionError && <div>{props.actionError}</div>}
      {props.deleteError && <div>{props.deleteError}</div>}
    </div>
  ),
}));
vi.mock('../../components/Spinner', () => ({ Spinner: () => <div>Loading...</div> }));
vi.mock('../../components/Alert', () => ({
  Alert: ({ children }: any) => <div>Alert: {children}</div>,
}));
vi.mock('../../components/DeleteConfirmModal', () => ({
  DeleteConfirmModal: ({ isOpen, onConfirm, onCancel }: any) =>
    isOpen ? (
      <button onClick={onConfirm}>Confirm Delete</button>
    ) : (
      <button onClick={onCancel}>Cancel Delete</button>
    ),
}));

vi.mock('../../api/reviews', () => ({
  getReviewById: vi.fn(),
  approveReview: vi.fn(),
  rejectReview: vi.fn(),
  deleteReview: vi.fn(),
}));

vi.mock('../../context/AuthContext', () => ({
  useMe: vi.fn(),
}));

describe('ReviewPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('показывает спиннер при загрузке', () => {
    (apiReviews.getReviewById as any).mockReturnValue(new Promise(() => {})); // никогда не резолвится

    render(
      <MemoryRouter initialEntries={['/review/1']}>
        <Routes>
          <Route path="/review/:reviewId" element={<ReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('рендерит данные рецензии после успешного запроса', async () => {
    const mockReview = { id: 1, title: 'Test Review', author: { id: 2 } };
    (apiReviews.getReviewById as any).mockResolvedValue(mockReview);
    (useMe as any).mockReturnValue({ id: 2, role: 'user' });

    render(
      <MemoryRouter initialEntries={['/review/1']}>
        <Routes>
          <Route path="/review/:reviewId" element={<ReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    expect(screen.getByText(/ReviewCard 1/)).toBeInTheDocument();
  });

  it('показывает ошибку при некорректном reviewId', async () => {
    render(
      <MemoryRouter initialEntries={['/review/abc']}>
        <Routes>
          <Route path="/review/:reviewId" element={<ReviewPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => expect(screen.getByText(/Некорректный id рецензии/i)).toBeInTheDocument());
  });
});
