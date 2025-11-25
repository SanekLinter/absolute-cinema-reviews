import { Outlet } from 'react-router-dom';
import { Navbar } from '../Navbar';
import css from './index.module.scss';

export const MainLayout = () => {
  return (
    <div className={css.layout}>
      <Navbar />
      <main className={css.content}>
        <Outlet />
      </main>
    </div>
  );
};
