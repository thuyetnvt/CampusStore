import { Navigate, Outlet, useLocation } from 'react-router';
import { returnToKey, useAuthUser } from './authSession';

type RoleRouteProps = {
  allowedRoles: string[];
};

function storeReturnTo(pathname: string, search: string, hash: string) {
  sessionStorage.setItem(returnToKey, `${pathname}${search}${hash}`);
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const location = useLocation();
  const { data: user, isLoading, isError } = useAuthUser();

  if (isLoading) {
    return null;
  }

  if (isError || !user) {
    storeReturnTo(location.pathname, location.search, location.hash);
    return <Navigate to="/login" replace />;
  }

  const canAccess = allowedRoles.some((role) => user.roles.includes(role));
  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
