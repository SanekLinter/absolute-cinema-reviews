import { useEffect, useState } from 'react';
import type { Review } from '../../api/types';
import { ReviewList } from '../ReviewList';
import { Button } from '../Button';
import { Alert } from '../Alert';
import { Spinner } from '../Spinner';
import css from './index.module.scss';

type SortOption = 'date_desc' | 'date_asc' | 'likes_desc';

const SORT_MAP: Record<SortOption, { sort: 'created_at' | 'likes'; order: 'asc' | 'desc' }> = {
  date_desc: { sort: 'created_at', order: 'desc' },
  date_asc: { sort: 'created_at', order: 'asc' },
  likes_desc: { sort: 'likes', order: 'desc' },
};

type ReviewFeedProps = {
  loadReviews: (params: {
    page: number;
    limit?: number;
    search?: string;
    sort?: 'created_at' | 'likes';
    order?: 'asc' | 'desc';
    author_id?: number;
  }) => Promise<{ reviews: Review[]; pagination: { total_pages: number } }>;

  withControls?: boolean;
  authorId?: number;

  reviewCardProps?: {
    showLikes?: boolean;
    showStatus?: boolean;
    moderation?: boolean;
  };
};

export const ReviewFeed = ({
  loadReviews,
  withControls = false,
  reviewCardProps,
  authorId,
}: ReviewFeedProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortOption, setSortOption] = useState<SortOption>('date_desc');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = {
          page,
          limit: 20,
          author_id: authorId,
          ...(withControls && {
            search: searchQuery || undefined,
            sort: SORT_MAP[sortOption].sort,
            order: SORT_MAP[sortOption].order,
          }),
        };

        const data = await loadReviews(params);
        setReviews(data.reviews);
        setTotalPages(data.pagination.total_pages || 1);
      } catch (err: any) {
        setError(err.uiMessage || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [page, authorId, withControls, loadReviews, searchQuery, sortOption]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPage(1);
    setSortOption(e.target.value as SortOption);
  };

  const handleLikeUpdate = (reviewId: number, newLikes: number, newIsLiked: boolean) => {
    setReviews((prevReviews) => {
      const updatedReviews = prevReviews.map((r) =>
        r.id === reviewId ? { ...r, likes: newLikes, is_liked: newIsLiked } : r
      );

      if (sortOption !== 'likes_desc') {
        return updatedReviews;
      }

      return [...updatedReviews].sort((a, b) => b.likes - a.likes);
    });
  };

  return (
    <>
      {withControls && (
        <div className={css.controls}>
          <form className={css.searchForm} onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Искать рецензии..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className={css.searchInput}
            />
            <button type="submit" className={css.searchButton} />
          </form>

          <select value={sortOption} onChange={handleSortChange} className={css.sortSelect}>
            <option value="date_desc">Сначала новые</option>
            <option value="date_asc">Сначала старые</option>
            <option value="likes_desc">Сначала популярные</option>
          </select>
        </div>
      )}

      {error ? (
        <Alert>{error}</Alert>
      ) : loading ? (
        <Spinner />
      ) : (
        <ReviewList reviews={reviews} cardProps={reviewCardProps} onLikeUpdate={handleLikeUpdate} />
      )}

      {totalPages > 1 && (
        <div className={css.pagination}>
          <Button
            color="orange"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            loading={page === 1 || loading}
          >
            ⬅
          </Button>
          <span className={css.pageInfo}>
            Страница {page} из {totalPages}
          </span>
          <Button
            color="orange"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            loading={page === totalPages || loading}
          >
            ➡
          </Button>
        </div>
      )}
    </>
  );
};
