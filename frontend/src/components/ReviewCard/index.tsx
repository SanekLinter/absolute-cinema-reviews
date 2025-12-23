import { Link } from 'react-router-dom';
import type { Review } from '../../api/types';
import { formatDate } from '../../utils/date';
import { getEditReviewRoute, getUserProfileRoute } from '../../lib/routes';
import { Button, LinkButton } from '../Button';
import css from './index.module.scss';
import { Alert } from '../Alert';
import { Likes } from '../Likes';

type ReviewCardProps = {
  review: Review;
  showLikes?: boolean;
  showStatus?: boolean;
  showModerationButtons?: boolean;
  showControlButtons?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onDelete?: () => void;
  disableActions?: boolean;
  actionError?: string | null;
  deleteError?: string | null;
};

export const ReviewCard = ({
  review,
  showLikes = true,
  showStatus = true,
  showModerationButtons = false,
  showControlButtons = true,
  onApprove,
  onReject,
  onDelete,
  disableActions,
  actionError = null,
  deleteError = null,
}: ReviewCardProps) => {
  showLikes = showLikes && review.status === 'approved';

  return (
    <div className={css.card}>
      {showStatus && <div className={css.status}>{review.status}</div>}
      <h1 className={css.title}>{review.title}</h1>

      <div className={css.meta}>
        <div className={css.movie}>
          <img src="/movie_icon.png" className={css.movieIcon} />
          <p>{review.movie_title}</p>
        </div>
        <Link to={getUserProfileRoute(review.author.id)} className={css.author}>
          <img src="/user_orange.png" className={css.logoUser} />
          {review.author.username}
        </Link>
      </div>

      <p className={css.content}>{review.content}</p>

      <div className={css.footer}>
        <div className={css.left}>
          <p className={css.date}>{formatDate(review.created_at)}</p>
          {showLikes && (
            <Likes reviewId={review.id} likes={review.likes} isLiked={review.is_liked} />
          )}
        </div>
        {showModerationButtons && (
          <div className={css.buttons}>
            <Button onClick={onApprove} loading={disableActions}>
              Одобрить
            </Button>
            <Button onClick={onReject} loading={disableActions} color="white">
              Отклонить
            </Button>
          </div>
        )}
        {showControlButtons && (
          <div className={css.buttons}>
            <LinkButton to={getEditReviewRoute(review.id)}>Редактировать</LinkButton>
            <Button onClick={onDelete} color="white">
              Удалить
            </Button>
          </div>
        )}
      </div>
      {actionError && <Alert>{actionError}</Alert>}
      {deleteError && <Alert>{deleteError}</Alert>}
    </div>
  );
};
