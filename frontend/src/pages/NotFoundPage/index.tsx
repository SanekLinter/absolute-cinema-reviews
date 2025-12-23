// pages/NotFoundPage/index.tsx
import { LinkButton } from '../../components/Button';
import { getAllReviewsRoute } from '../../lib/routes';
import css from './index.module.scss';

export const NotFoundPage = () => {
  return (
    <div className={css.page}>
      <h1 className={css.title}>404</h1>
      <p className={css.description}>Страница не найдена ☹</p>
      <p className={css.description}>
        Возможно, она была удалена или вы перешли по неверной ссылке.
      </p>
      <LinkButton to={getAllReviewsRoute()} color="orange">
        Вернуться на главную
      </LinkButton>
    </div>
  );
};
