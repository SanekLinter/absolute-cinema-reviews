import { useState } from 'react';
import { toggleLike } from '../../api/reviews';
import css from './index.module.scss';
import { Alert } from '../Alert';
import { useAuth } from '../../context/AuthContext';

type LikesProps = {
  reviewId: number;
  likes: number;
  isLiked: boolean;
  onUpdate?: (reviewId: number, newLikes: number, newIsLiked: boolean) => void;
};

export const Likes = ({
  reviewId,
  likes: initialLikes,
  isLiked: initialIsLiked,
  onUpdate,
}: LikesProps) => {
  const { isAuthenticated } = useAuth();

  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    if (!isAuthenticated) return;

    const newIsLiked = !isLiked;
    const newLikes = newIsLiked ? likes + 1 : likes - 1;

    setIsLiked(newIsLiked);
    setLikes(newLikes);
    onUpdate?.(reviewId, newLikes, newIsLiked);

    try {
      const response = await toggleLike(reviewId);
      setLikes(response.likes);
      setIsLiked(response.is_liked);
      onUpdate?.(reviewId, response.likes, response.is_liked);
    } catch (err: any) {
      setIsLiked(isLiked);
      setLikes(likes);
      onUpdate?.(reviewId, likes, isLiked);
      setError(err.uiMessage || 'Не удалось изменить лайк');
    }
  };

  return (
    <>
      <button
        className={css.button}
        onClick={handleToggle}
        disabled={!isAuthenticated}
        title={!isAuthenticated ? 'Войдите, чтобы ставить лайки' : undefined}
      >
        {isLiked ? (
          <img src="/liked.svg" alt="Лайкнут" className={css.icon} />
        ) : (
          <img src="/not_liked.svg" alt="Не лайкнут" className={css.icon} />
        )}{' '}
        {likes}
      </button>

      {error && <Alert>{error}</Alert>}
    </>
  );
};
