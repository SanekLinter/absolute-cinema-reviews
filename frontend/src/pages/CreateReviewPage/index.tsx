import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { createReview } from '../../api/reviews';
import { Input } from '../../components/Input';
import { Alert } from '../../components/Alert';
import { Button } from '../../components/Button';
import { getReviewRoute } from '../../lib/routes';
import { useState } from 'react';
import css from './index.module.scss';

const newReviewSchema = z.object({
  title: z
    .string()
    .min(5, 'Минимум 5 символов')
    .max(100, 'Максимум 100 символов')
    .regex(/^[\p{L}\p{N}\p{P}\p{Z}]+$/u, 'Только буквы, цифры, пробелы и знаки препинания'),
  movie_title: z
    .string()
    .min(5, 'Минимум 5 символов')
    .max(100, 'Максимум 100 символов')
    .regex(/^[\p{L}\p{N}\p{P}\p{Z}]+$/u, 'Только буквы, цифры, пробелы и знаки препинания'),
  content: z.string().min(100, 'Минимум 100 символов').max(5000, 'Максимум 5000 символов'),
});

type NewReviewFormData = z.infer<typeof newReviewSchema>;

export const CreateReviewPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NewReviewFormData>({
    resolver: zodResolver(newReviewSchema),
    mode: 'onChange',
  });

  const contentValue = useWatch({ control, name: 'content' });
  const onSubmit = async (data: NewReviewFormData) => {
    setServerError(null);
    try {
      const review = await createReview(
        data.title.trim(),
        data.movie_title.trim(),
        data.content.trim()
      );
      navigate(getReviewRoute(review.id));
    } catch (err: any) {
      setServerError(err.uiMessage || 'Не удалось создать рецензию');
    }
  };

  return (
    <div className={css.page}>
      <h1 className={css.heading}>Новая рецензия</h1>
      <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
        {serverError && <Alert>{serverError}</Alert>}

        <Input
          label="Заголовок рецензии"
          placeholder="Введите заголовок..."
          autoFocus
          error={errors.title?.message}
          {...register('title')}
        />

        <Input
          label="Название фильма"
          placeholder="Введите название фильма..."
          error={errors.movie_title?.message}
          {...register('movie_title')}
        />

        <div className={css.textareaWrapper}>
          <label className={css.textareaLabel}>Текст рецензии</label>
          <textarea
            className={css.textarea}
            placeholder="Введите текст рецензии..."
            rows={12}
            {...register('content')}
          />
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
