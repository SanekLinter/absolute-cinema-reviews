import type { Review } from '../../api/types';
import { ReviewMiniCard } from '../ReviewMiniCard';
import css from './index.module.scss';

type ReviewListProps = {
  reviews: Review[];
  cardProps?: {
    showLikes?: boolean;
    showStatus?: boolean;
  };
  onLikeUpdate?: (reviewId: number, newLikes: number, newIsLiked: boolean) => void;
};

export const ReviewList = ({ reviews, cardProps, onLikeUpdate }: ReviewListProps) => {
  if (reviews.length === 0) {
    return <p className={css.empty}>Рецензии не найдены ☹</p>;
  }

  return (
    <div className={css.list}>
      {reviews.map((review) => (
        <ReviewMiniCard
          key={review.id}
          review={review}
          {...cardProps}
          onLikeUpdate={onLikeUpdate}
        />
      ))}
    </div>
  );
};
