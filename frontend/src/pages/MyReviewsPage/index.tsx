import { ReviewFeed } from '../../components/ReviewFeed';
import { getMyReviews } from '../../api/reviews';
import css from './index.module.scss';
import { LinkButton } from '../../components/Button';
import { getNewReviewRoute } from '../../lib/routes';

export const MyReviewsPage = () => {
  return (
    <div className={css.page}>
      <div className={css.header}>
        Мои рецензии
        <LinkButton to={getNewReviewRoute()} color="orange">
          + Добавить новую рецензию
        </LinkButton>
      </div>
      <ReviewFeed loadReviews={getMyReviews} reviewCardProps={{ showStatus: true }} />
    </div>
  );
};
