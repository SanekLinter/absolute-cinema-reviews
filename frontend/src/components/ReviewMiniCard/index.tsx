import { Link } from 'react-router-dom';
import type { Review } from '../../api/types';
import { formatDate } from '../../utils/date';
import { getReviewRoute, getUserProfileRoute } from '../../lib/routes';
import css from './index.module.scss';
import { Likes } from '../Likes';

type ReviewMiniCardProps = {
  review: Review;
  showLikes?: boolean;
  showStatus?: boolean;
  moderation?: boolean;
  onLikeUpdate?: (eviewId: number, newLikes: number, newIsLiked: boolean) => void;
};

export const ReviewMiniCard = ({
  review,
  showLikes = true,
  showStatus = false,
  moderation = false,
  onLikeUpdate,
}: ReviewMiniCardProps) => {
  showLikes = showLikes && review.status !== 'pending' && review.status !== 'rejected';
  return (
    <div className={css.card}>
      <Link
        to={
          moderation ? getReviewRoute(review.id, { mode: 'moderation' }) : getReviewRoute(review.id)
        }
        className={css.title}
      >
        {review.title}
      </Link>

      <div className={css.meta}>
        <span className={css.movie}>{review.movie_title}</span>

        {review.author && (
          <Link to={getUserProfileRoute(review.author.id)} className={css.author}>
            {review.author.username}
          </Link>
        )}

        <span className={css.date}>{formatDate(review.created_at)}</span>
      </div>
      <Link
        to={
          moderation ? getReviewRoute(review.id, { mode: 'moderation' }) : getReviewRoute(review.id)
        }
      >
        <p className={css.preview}>
          {review.content.length > 300 ? review.content.slice(0, 300) + '…' : review.content}
        </p>
      </Link>

      <div className={css.meta}>
        {showLikes && (
          <Likes
            reviewId={review.id}
            likes={review.likes}
            isLiked={review.is_liked}
            onUpdate={onLikeUpdate}
          />
        )}
        {showStatus && <span className={css.status}>{review.status}</span>}
      </div>
    </div>
  );
};
