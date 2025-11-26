import { forwardRef } from 'react';
import cn from 'classnames';
import css from './index.module.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase();

    return (
      <div className={css.wrapper}>
        {label && (
          <label htmlFor={inputId} className={css.label}>
            {label}
          </label>
        )}

        <input
          ref={ref}
          id={inputId}
          className={cn(css.input, { [css.inputError]: error }, className)}
          {...props}
        />

        {error && <div className={css.error}>{error}</div>}
      </div>
    );
  }
);

Input.displayName = 'Input';
