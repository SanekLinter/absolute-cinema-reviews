import { Button } from '../Button';
import css from './index.module.scss';

type DeleteConfirmModalProps = {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
};

export const DeleteConfirmModal = ({
  isOpen,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteConfirmModalProps) => {
  if (!isOpen) return null;

  return (
    <div className={css.overlay}>
      <div className={css.modal}>
        <h3 className={css.title}>Удаление рецензии</h3>

        <p className={css.message}>
          Вы уверены, что хотите удалить эту рецензию? Это действие нельзя отменить.
        </p>
        <div className={css.buttons}>
          <Button onClick={onConfirm} loading={loading}>
            Удалить
          </Button>
          <Button onClick={onCancel} color="white" loading={loading}>
            Отмена
          </Button>
        </div>
      </div>
    </div>
  );
};
