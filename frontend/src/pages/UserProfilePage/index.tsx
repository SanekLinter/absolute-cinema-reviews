import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ReviewFeed } from '../../components/ReviewFeed';
import { getPublicReviews } from '../../api/reviews';
import { getUserById } from '../../api/users';
import type { UserBase } from '../../api/types';
import { Alert } from '../../components/Alert';
import { Spinner } from '../../components/Spinner';
import css from './index.module.scss';

export const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const userIdNumber = userId ? Number(userId) : undefined;

  const [user, setUser] = useState<UserBase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userIdNumber || Number.isNaN(userIdNumber)) {
      setError('Некорректный id пользователя');
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await getUserById(userIdNumber);
        setUser(data);
      } catch (err: any) {
        setError(err.uiMessage || 'Пользователь не найден');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userIdNumber]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className={css.page}>
      {error ? (
        <Alert>{error}</Alert>
      ) : (
        <>
          {user && (
            <h1 className={css.header}>
              Рецензии пользователя <span className={css.username}>{user.username}</span>
            </h1>
          )}
          {user && <ReviewFeed loadReviews={getPublicReviews} authorId={user.id} />}
        </>
      )}
    </div>
  );
};
