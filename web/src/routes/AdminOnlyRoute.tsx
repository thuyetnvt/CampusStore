import { Navigate, Outlet, useLocation } from 'react-router';
import { returnToKey, useAuthUser } from './authSession';

function storeReturnTo(pathname: string, search: string, hash: string) {
  sessionStorage.setItem(returnToKey, `${pathname}${search}${hash}`);
}

export function AdminOnlyRoute() {
  const location = useLocation();
  const { data: user, isLoading, isError } = useAuthUser();

  if (isLoading) {
    return null;
  }

  if (isError || !user) {
    storeReturnTo(location.pathname, location.search, location.hash);
    return <Navigate to="/login" replace />;
  }

  if (!user.roles.includes('Admin')) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
