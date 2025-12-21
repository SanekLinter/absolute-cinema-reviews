import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getReviewById, updateReview } from '../../api/reviews';
import { Input } from '../../components/Input';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { getReviewRoute } from '../../lib/routes';
import css from './index.module.scss';

const editReviewSchema = z.object({
  title: z
    .string()
    .min(5, 'Минимум 5 символов')
    .max(100, 'Максимум 100 символов')
    .regex(
      /^[a-zA-Zа-яА-ЯёЁ0-9\s\p{P}\p{Z}]*$/u,
      'Только кириллица, латиница, цифры и спецсимволы'
    ),
  movie_title: z
    .string()
    .min(5, 'Минимум 5 символов')
    .max(100, 'Максимум 100 символов')
    .regex(
      /^[a-zA-Zа-яА-ЯёЁ0-9\s\p{P}\p{Z}]*$/u,
      'Только кириллица, латиница, цифры и спецсимволы'
    ),
  content: z
    .string()
    .min(100, 'Минимум 100 символов')
    .max(5000, 'Максимум 5000 символов')
    .regex(
      /^[a-zA-Zа-яА-ЯёЁ0-9\s\p{P}\p{Z}]*$/u,
      'Только кириллица, латиница, цифры и спецсимволы'
    ),
});

type EditReviewFormData = z.infer<typeof editReviewSchema>;

export const EditReviewPage = () => {
  const { reviewId } = useParams<{ reviewId: string }>();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditReviewFormData>({
    resolver: zodResolver(editReviewSchema),
    mode: 'onChange',
  });

  const contentValue = useWatch({ control, name: 'content' });

  useEffect(() => {
    const fetchReview = async () => {
      if (!reviewId) return;
      const id = Number(reviewId);
      if (isNaN(id)) {
        setServerError('Некорректный ID рецензии');
        setLoading(false);
        return;
      }

      try {
        const review = await getReviewById(id);
        reset({
          title: review.title,
          movie_title: review.movie_title,
          content: review.content,
        });
      } catch (err: any) {
        setServerError(err.uiMessage || 'Не удалось загрузить рецензию');
      } finally {
        setLoading(false);
      }
    };

    fetchReview();
  }, [reviewId, reset]);

  const onSubmit = async (data: EditReviewFormData) => {
    if (!reviewId) return;
    setServerError(null);

    try {
      const updatedReview = await updateReview(
        Number(reviewId),
        data.title.trim(),
        data.movie_title.trim(),
        data.content.trim()
      );
      navigate(getReviewRoute(updatedReview.id));
    } catch (err: any) {
      setServerError(err.uiMessage || 'Не удалось сохранить изменения');
    }
  };

  if (loading) {
    return <div className={css.page}>Загрузка рецензии...</div>;
  }

  return (
    <div className={css.page}>
      <h1 className={css.heading}>Редактирование рецензии</h1>

      <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
        {serverError && <Alert>{serverError}</Alert>}

        <Input label="Заголовок рецензии" error={errors.title?.message} {...register('title')} />

        <Input
          label="Название фильма"
          error={errors.movie_title?.message}
          {...register('movie_title')}
        />

        <div className={css.textareaWrapper}>
          <label className={css.textareaLabel}>Текст рецензии</label>
          <textarea className={css.textarea} rows={12} {...register('content')} />
          {errors.content && <div className={css.textareaError}>{errors.content.message}</div>}
          <div className={css.counter}>{contentValue?.length || 0} / 5000</div>
        </div>

        <div className={css.button}>
          <Button loading={isSubmitting}>
            {isSubmitting ? 'Отправляем...' : 'Отправить на модерацию'}
          </Button>
        </div>
      </form>
    </div>
  );
};
