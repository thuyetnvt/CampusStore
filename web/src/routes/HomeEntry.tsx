import { Navigate } from 'react-router';
import { HomePage } from '../pages/HomePage';
import { returnToKey, useAuthUser } from './authSession';

export function HomeEntry() {
  const { data: user, isLoading } = useAuthUser();
  const returnTo = sessionStorage.getItem(returnToKey);

  if (returnTo && !isLoading && user) {
    sessionStorage.removeItem(returnToKey);
    return <Navigate to={returnTo} replace />;
  }

  if (returnTo && isLoading) {
    return null;
  }

  return <HomePage />;
}
