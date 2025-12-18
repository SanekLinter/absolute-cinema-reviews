import { ReviewFeed } from '../../components/ReviewFeed';
import { getModerationReviews } from '../../api/reviews';
import css from './index.module.scss';

export const ModerationReviewsPage = () => {
  return (
    <div className={css.page}>
      <div className={css.header}>Рецензии на модерации</div>
      <ReviewFeed
        loadReviews={getModerationReviews}
        withControls={false}
        reviewCardProps={{ showLikes: false }}
      />
    </div>
  );
};
