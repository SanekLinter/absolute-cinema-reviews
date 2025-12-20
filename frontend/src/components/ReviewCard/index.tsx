import { Link } from 'react-router-dom';
import type { Review } from '../../api/types';
import { formatDate } from '../../utils/date';
import { getUserProfileRoute } from '../../lib/routes';
import { Button } from '../Button';
import css from './index.module.scss';

type ReviewCardProps = {
  review: Review;
  showLikes?: boolean;
  showStatus?: boolean;
  showModerationButtons?: boolean;
  showControlButtons?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
};

export const ReviewCard = ({
  review,
  showLikes = true,
  showStatus = true,
  showModerationButtons = false,
  showControlButtons = true,
  onApprove,
  onReject,
}: ReviewCardProps) => {
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
          {showLikes && <div className={css.likes}>🧡 {review.likes}</div>}
        </div>
        {showModerationButtons && (
          <div className={css.buttons}>
            <Button onClick={onApprove}>Одобрить</Button>
            <Button onClick={onReject} color="white">
              Отклонить
            </Button>
          </div>
        )}
        {showControlButtons && (
          <div className={css.buttons}>
            <Button>Редактировать</Button>
            <Button color="white">Удалить</Button>
          </div>
        )}
      </div>
    </div>
  );
};
