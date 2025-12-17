import { useEffect, useState } from 'react';
import type { Review } from '../../api/types';
import { ReviewList } from '../../components/ReviewList';
import { Alert } from '../../components/Alert';
import { getPublicReviews } from '../../api/reviews';
import { Button } from '../../components/Button';
import css from './index.module.scss';

type SortOption = 'date_desc' | 'date_asc' | 'likes_desc';

const SORT_MAP: Record<SortOption, { sort: 'created_at' | 'likes'; order: 'asc' | 'desc' }> = {
  date_desc: { sort: 'created_at', order: 'desc' },
  date_asc: { sort: 'created_at', order: 'asc' },
  likes_desc: { sort: 'likes', order: 'desc' },
};

export const AllReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');

  const loadReviews = async (page: number, sort: SortOption) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPublicReviews({
        page,
        limit: 20,
        ...SORT_MAP[sort],
      });

      setReviews(data.reviews);
      setTotalPages(data.pagination.total_pages);
    } catch (err: any) {
      setError(err.uiMessage || 'Не получилось загрузить рецензии');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(page, sortOption);
  }, [page, sortOption]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPage(1);
    setSortOption(e.target.value as SortOption);
  };

  return (
    <div className={css.page}>
      <select value={sortOption} onChange={handleSortChange} className={css.sortSelect}>
        <option value="date_desc">Сначала новые</option>
        <option value="date_asc">Сначала старые</option>
        <option value="likes_desc">Сначала популярные</option>
      </select>

      {error ? <Alert>{error}</Alert> : <ReviewList reviews={reviews} />}

      {totalPages > 1 && (
        <div className={css.pagination}>
          <Button
            color="orange"
            onClick={() => setPage((p) => p - 1)}
            loading={page === 1 || loading}
          >
            ⬅
          </Button>

          <span className={css.pageInfo}>
            Страница {page} из {totalPages}
          </span>

          <Button
            color="orange"
            onClick={() => setPage((p) => p + 1)}
            loading={page === totalPages || loading}
          >
            ➡
          </Button>
        </div>
      )}
      <div />
    </div>
  );
};
