import css from './index.module.scss';

export const Spinner = () => {
  return (
    <div className={css.container}>
      <div className={css.spinner} />
    </div>
  );
};
