import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { HomeEntry } from './HomeEntry';
import { StoreLayout } from '../layouts/StoreLayout';
import { AccountPage } from '../pages/AccountPage';
import { CartPage } from '../pages/CartPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminOrdersPage } from '../pages/AdminOrdersPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { LoginPage } from '../pages/LoginPage';
import { OrderDetailPage } from '../pages/OrderDetailPage';
import { OrdersPage } from '../pages/OrdersPage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { ProductsPage } from '../pages/ProductsPage';
import { RegisterPage } from '../pages/RegisterPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <StoreLayout />,
    children: [
      { index: true, element: <HomeEntry /> },
      { path: 'products', element: <ProductsPage /> },
      { path: 'products/:idOrSlug', element: <ProductDetailPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'cart', element: <CartPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'account', element: <AccountPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> }
        ]
      },
      {
        element: <RoleRoute allowedRoles={['Admin', 'Staff']} />,
        children: [
          { path: 'admin', element: <AdminDashboardPage /> },
          { path: 'admin/orders', element: <AdminOrdersPage /> }
        ]
      }
    ]
  }
]);
