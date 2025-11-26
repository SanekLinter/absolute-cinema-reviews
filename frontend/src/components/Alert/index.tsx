import css from './index.module.scss';

export const Alert = ({ children }: { children: React.ReactNode }) => {
  return <div className={css.alert}>{children}</div>;
};
