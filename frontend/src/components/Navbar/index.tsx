import { Link } from 'react-router-dom';
import { LinkButton, Button } from '../Button';
import css from './index.module.scss';
import { useAuth } from '../../context/AuthContext';
import {
  getAllReviewsRoute,
  getModerationRoute,
  getSignUpRoute,
  getSignInRoute,
  getMyReviewsRoute,
} from '../../lib/routes';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className={css.navbar}>
      <div className={css.left}>
        <img src="/logo.png" alt="Logo" className={css.logo} />
        <ul className={css.menu}>
          <li>
            <Link className={css.link} to={getAllReviewsRoute()}>
              Все рецензии
            </Link>
          </li>

          {isAuthenticated && (
            <>
              <li>
                <Link className={css.link} to={getMyReviewsRoute()}>
                  Мои рецензии
                </Link>
              </li>

              {user?.role === 'admin' && (
                <li>
                  <Link className={css.link} to={getModerationRoute()}>
                    Модерация
                  </Link>
                </li>
              )}
            </>
          )}
        </ul>
      </div>

      <div className={css.right}>
        {isAuthenticated ? (
          <>
            <Button color="white" onClick={logout}>
              Выйти
            </Button>
            <div className={css.username}>
              {user?.username}
              <img src="/user.png" alt="Logo" className={css.logoUser} />
            </div>
          </>
        ) : (
          <>
            <LinkButton to={getSignUpRoute()} color="white">
              Регистрация
            </LinkButton>
            <LinkButton to={getSignInRoute()} color="white">
              Вход
            </LinkButton>
          </>
        )}
      </div>
    </nav>
  );
};
