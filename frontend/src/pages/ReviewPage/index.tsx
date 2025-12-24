import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { Review } from '../../api/types';
import { deleteReview, getReviewById } from '../../api/reviews';
import { Alert } from '../../components/Alert';
import { ReviewCard } from '../../components/ReviewCard';
import { useMe } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { approveReview, rejectReview } from '../../api/reviews';
import { getModerationRoute, getMyReviewsRoute } from '../../lib/routes';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';
import { Spinner } from '../../components/Spinner';
import css from './index.module.scss';

type ReviewViewMode = 'moderation' | 'author' | 'public';

export const ReviewPage = () => {
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const me = useMe();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const navigate = useNavigate();
  const { reviewId } = useParams<{ reviewId: string }>();
  const reviewIdNumber = reviewId ? Number(reviewId) : undefined;

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
    return <Spinner />;
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
    try {
      setActionLoading(true);
      setActionError(null);
      await approveReview(review.id);
      navigate(getModerationRoute());
    } catch (err: any) {
      setActionError(err.uiMessage || 'Не удалось одобрить рецензию');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setActionLoading(true);
      setActionError(null);
      await rejectReview(review.id);
      navigate(getModerationRoute());
    } catch (err: any) {
      setActionError(err.uiMessage || 'Не удалось отклонить рецензию');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleteLoading(true);
      await deleteReview(review.id);
      navigate(getMyReviewsRoute());
    } catch (err: any) {
      setDeleteError(err.uiMessage || 'Не удалось удалить рецензию');
      setDeleteLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!deleteLoading) {
      setDeleteConfirmOpen(false);
    }
  };

  const viewConfig = {
    showLikes: viewMode !== 'moderation',
    showStatus: viewMode === 'author',
    showModerationButtons: viewMode === 'moderation',
    showControlButtons: viewMode === 'author',
    onApprove: handleApprove,
    onReject: handleReject,
    onDelete: handleDeleteClick,
    actionError: actionError,
    deleteError: deleteError,
    disableActions: actionLoading || deleteLoading,
  };

  return (
    <div className={css.page}>
      <ReviewCard review={review} {...viewConfig} disableActions={actionLoading} />
      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        loading={deleteLoading}
      />
    </div>
  );
};
