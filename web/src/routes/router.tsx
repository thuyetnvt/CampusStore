import { createBrowserRouter } from 'react-router';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';
import { AdminOnlyRoute } from './AdminOnlyRoute';
import { HomeEntry } from './HomeEntry';
import { AdminLayout } from '../layouts/AdminLayout';
import { StoreLayout } from '../layouts/StoreLayout';
import { AccountPage } from '../pages/AccountPage';
import { CartPage } from '../pages/CartPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminOrdersPage } from '../pages/AdminOrdersPage';
import { AdminCategoriesPage } from '../pages/admin/AdminCategoriesPage';
import { AdminCouponsPage } from '../pages/admin/AdminCouponsPage';
import { AdminCustomersPage } from '../pages/admin/AdminCustomersPage';
import { AdminInventoryPage } from '../pages/admin/AdminInventoryPage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { ForbiddenPage } from '../pages/ForbiddenPage';
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
      { path: '403', element: <ForbiddenPage /> },
      {
        element: <ProtectedRoute />,
        children: [{ path: 'account', element: <AccountPage /> }]
      },
      {
        element: <RoleRoute allowedRoles={['Customer']} />,
        children: [
          { path: 'cart', element: <CartPage /> },
          { path: 'checkout', element: <CheckoutPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> }
        ]
      }
    ]
  },
  {
    path: '/admin',
    element: <RoleRoute allowedRoles={['Staff', 'Admin']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'categories', element: <AdminCategoriesPage /> },
          { path: 'inventory', element: <AdminInventoryPage /> },
          { path: 'customers', element: <AdminCustomersPage /> },
          { path: 'coupons', element: <AdminCouponsPage /> },
          {
            element: <AdminOnlyRoute />,
            children: [{ path: 'users', element: <AdminUsersPage /> }]
          }
        ]
      }
    ]
  }
]);
