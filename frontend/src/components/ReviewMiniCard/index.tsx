import { Link } from 'react-router-dom';
import type { Review } from '../../api/types';
import { formatDate } from '../../utils/date';
import { getReviewRoute, getUserProfileRoute } from '../../lib/routes';
import css from './index.module.scss';

type ReviewMiniCardProps = {
  review: Review;
  showLikes?: boolean;
  showStatus?: boolean;
};

export const ReviewMiniCard = ({
  review,
  showLikes = true,
  showStatus = false,
}: ReviewMiniCardProps) => {
  return (
    <div className={css.card}>
      <Link to={getReviewRoute(review.id)} className={css.title}>
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

      <p className={css.preview}>
        {review.content.length > 300 ? review.content.slice(0, 300) + '…' : review.content}
      </p>

      <div className={css.meta}>
        {showLikes && <div className={css.likes}>🧡 {review.likes}</div>}
        {showStatus && <span className={css.status}>{review.status}</span>}
      </div>
    </div>
  );
};
