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
import { AdminPlaceholderPage } from '../pages/admin/AdminPlaceholderPage';
import { AdminProductsPage } from '../pages/admin/AdminProductsPage';
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
          {
            path: 'categories',
            element: <AdminPlaceholderPage title="Quản lý danh mục" description="Chức năng danh mục chưa có màn hình riêng trong code hiện tại." />
          },
          {
            path: 'inventory',
            element: <AdminPlaceholderPage title="Quản lý tồn kho" description="Chức năng tồn kho chưa có màn hình riêng trong code hiện tại." />
          },
          {
            path: 'customers',
            element: <AdminPlaceholderPage title="Danh sách khách hàng" description="Chức năng khách hàng chưa có màn hình riêng trong code hiện tại." />
          },
          {
            path: 'coupons',
            element: <AdminPlaceholderPage title="Quản lý voucher" description="Chức năng voucher chưa có màn hình riêng trong code hiện tại." />
          },
          {
            element: <AdminOnlyRoute />,
            children: [
              {
                path: 'users',
                element: <AdminPlaceholderPage title="Tài khoản quản trị viên" description="Chức năng quản lý user/role Admin-only chưa có API trong code hiện tại." />
              }
            ]
          }
        ]
      }
    ]
  }
]);
