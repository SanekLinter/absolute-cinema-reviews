import { Navigate, Outlet } from 'react-router-dom';
import * as routes from '../../lib/routes';
import { useAuth } from '../../context/AuthContext';

interface RequireAuthProps {
  children?: React.ReactNode;
}

export const RequireAuth = ({ children }: RequireAuthProps) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={routes.getSignInRoute()} replace state={{ from: location.pathname }} />;
  }

  return children ? <>{children}</> : <Outlet />;
};

interface RequireAdminProps {
  children?: React.ReactNode;
}

export const RequireAdmin = ({ children }: RequireAdminProps) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to={routes.getSignInRoute()} replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to={routes.getAllReviewsRoute()} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
