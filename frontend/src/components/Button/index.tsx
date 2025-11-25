import cn from 'classnames';
import { Link } from 'react-router-dom';
import css from './index.module.scss';

export type ButtonProps = {
  children: React.ReactNode;
  loading?: boolean;
  color?: 'orange' | 'white';
  type?: 'button' | 'submit';
  onClick?: () => void;
};

export const Button = ({
  children,
  loading = false,
  color = 'orange',
  type = 'submit',
  onClick,
}: ButtonProps) => {
  return (
    <button
      className={cn(css.button, loading && css.disabled, loading && css.loading, css[color])}
      type={type}
      disabled={loading}
      onClick={onClick}
    >
      <span className={css.text}>{children}</span>
    </button>
  );
};

export const LinkButton = ({
  children,
  to,
  color = 'orange',
}: {
  children: React.ReactNode;
  to: string;
  color?: 'white' | 'orange';
}) => {
  return (
    <Link className={cn(css.button, css[color])} to={to}>
      {children}
    </Link>
  );
};
