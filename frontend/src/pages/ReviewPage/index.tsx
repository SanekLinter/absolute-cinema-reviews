import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { Review } from '../../api/types';
import { getModerationReviews, getReviewById } from '../../api/reviews';
import { Alert } from '../../components/Alert';
import { ReviewCard } from '../../components/ReviewCard';
import { useMe } from '../../context/AuthContext';
import css from './index.module.scss';
import { useNavigate } from 'react-router-dom';
import { approveReview, rejectReview } from '../../api/reviews';
import { getModerationRoute } from '../../lib/routes';

type ReviewViewMode = 'moderation' | 'author' | 'public';

export const ReviewPage = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const reviewIdNumber = reviewId ? Number(reviewId) : undefined;

  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const me = useMe();

  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const navigate = useNavigate();

  useEffect(() => {
    if (!reviewIdNumber || Number.isNaN(reviewIdNumber)) {
      setError('Некорректный id рецензии');
      setLoading(false);
      return;
    }

    const fetchReview = async () => {
      try {
        const data = await getReviewById(reviewIdNumber);
        setReview(data);
      } catch (err: any) {
        setError(err.uiMessage || 'Рецензия не найдена');
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [reviewIdNumber]);

  if (error) {
    return (
      <div className={css.page}>
        <Alert>{error}</Alert>
      </div>
    );
  }

  if (!review || loading) {
    return null;
  }

  const isAdmin = me?.role === 'admin';
  const isAuthor = me?.id === review.author.id;

  const getViewMode = (): ReviewViewMode => {
    if (mode === 'moderation' && isAdmin) return 'moderation';
    if (isAuthor) return 'author';
    return 'public';
  };

  const viewMode = getViewMode();

  const handleApprove = async () => {
    await approveReview(review.id);
    navigate(getModerationRoute());
  };

  const handleReject = async () => {
    await rejectReview(review.id);
    navigate(getModerationRoute());
  };

  const viewConfig = {
    showLikes: viewMode !== 'moderation',
    showStatus: viewMode === 'author',
    showModerationButtons: viewMode === 'moderation',
    showControlButtons: viewMode === 'author',
    onApprove: handleApprove,
    onReject: handleReject,
  };

  return (
    <div className={css.page}>
      <ReviewCard review={review} {...viewConfig} />
    </div>
  );
};
