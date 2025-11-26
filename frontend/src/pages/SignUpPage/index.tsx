import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Alert } from '../../components/Alert';
import css from './index.module.scss';
import { useState } from 'react';

const signUpSchema = z.object({
  username: z
    .string()
    .min(4, 'Минимум 4 символа')
    .max(20, 'Максимум 20 символов')
    .regex(/^[a-zA-Z0-9_]+$/, 'Можно только латиницу, цифры и подчёркивание'),
  password: z.string().min(8, 'Минимум 8 символов').max(16, 'Максимум 16 символов'),
});

type SignUpFormData = z.infer<typeof signUpSchema>;

export const SignUpPage = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setServerError(null);
      await registerUser(data.username, data.password);
      navigate('/');
    } catch (err: any) {
      setServerError(err.uiMessage || 'Ошибка регистрации');
    }
  };

  return (
    <div className={css.page}>
      <form className={css.form} onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Логин"
          placeholder="your_name"
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />

        <Input
          label="Пароль"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        {serverError && <Alert>{serverError}</Alert>}

        <div className={css.button}>
          <Button loading={isSubmitting}>
            {isSubmitting ? 'Регистрируем...' : 'Зарегистрироваться'}
          </Button>
        </div>
      </form>
    </div>
  );
};
