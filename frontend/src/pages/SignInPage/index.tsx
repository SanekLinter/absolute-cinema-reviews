import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useState } from 'react';
import { Alert } from '../../components/Alert';
import css from './index.module.scss';

const signInSchema = z.object({
  username: z
    .string()
    .min(4, 'Минимум 4 символа')
    .max(20, 'Максимум 20 символов')
    .regex(/^[a-zA-Z0-9]+$/, 'Только латиница и цифры'),
  password: z
    .string()
    .min(8, 'Минимум 8 символов')
    .max(16, 'Максимум 16 символов')
    .regex(/^[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+$/, 'Только латиница, цифры и символы'),
});

type SignInFormData = z.infer<typeof signInSchema>;

export const SignInPage = () => {
  const { login: loginUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: SignInFormData) => {
    try {
      setServerError(null);
      await loginUser(data.username, data.password);
      navigate('/');
    } catch (err: any) {
      setServerError(err.uiMessage || 'Ошибка входа');
    }
  };

  return (
    <div className={css.page}>
      <form onSubmit={handleSubmit(onSubmit)} className={css.form}>
        <Input
          label="Логин"
          placeholder="username"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />

        <Input
          label="Пароль"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && <Alert>{serverError}</Alert>}

        <div className={css.button}>
          <Button loading={isSubmitting}>{isSubmitting ? 'Входим...' : 'Войти'}</Button>
        </div>
      </form>
    </div>
  );
};
