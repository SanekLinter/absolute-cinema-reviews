import { useEffect, useState } from 'react';
import type { Review } from '../../api/types';
import { ReviewList } from '../../components/ReviewList';
import { Alert } from '../../components/Alert';
import { getPublicReviews } from '../../api/reviews';
import { Button } from '../../components/Button';
import css from './index.module.scss';

export const AllReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadReviews = async (page: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await getPublicReviews({
        page,
        limit: 20,
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
    loadReviews(page);
  }, [page]);

  return (
    <div className={css.page}>
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
