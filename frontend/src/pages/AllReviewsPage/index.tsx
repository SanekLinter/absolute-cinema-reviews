import { ReviewFeed } from '../../components/ReviewFeed';
import { getPublicReviews } from '../../api/reviews';
import css from './index.module.scss';

export const AllReviewsPage = () => {
  return (
    <div className={css.page}>
      <ReviewFeed loadReviews={getPublicReviews} />
    </div>
  );
};
