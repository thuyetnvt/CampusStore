import {
  BookOpen,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Percent,
  ShieldCheck,
  Tags,
  Users,
  X
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../api/auth';
import { useAuthUser } from '../routes/authSession';

type AdminNavItem = {
  to: string;
  label: string;
  adminOnly?: boolean;
  icon: typeof LayoutDashboard;
};

const adminNavItems: AdminNavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList },
  { to: '/admin/products', label: 'Sản phẩm', icon: Package },
  { to: '/admin/categories', label: 'Danh mục', icon: Tags },
  { to: '/admin/inventory', label: 'Tồn kho', icon: Boxes },
  { to: '/admin/customers', label: 'Khách hàng', icon: Users },
  { to: '/admin/coupons', label: 'Voucher', icon: Percent },
  { to: '/admin/users', label: 'Tài khoản/quản trị viên', adminOnly: true, icon: ShieldCheck }
];

export function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: user } = useAuthUser();
  const isAdmin = Boolean(user?.roles.includes('Admin'));

  const visibleNavItems = useMemo(
    () => adminNavItems.filter((item) => !item.adminOnly || isAdmin),
    [isAdmin]
  );

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: () => {
      queryClient.removeQueries({ queryKey: ['me'] });
      navigate('/login', { replace: true });
    }
  });

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <button
            type="button"
            className="inline-flex rounded-md p-2 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Mở menu quản trị"
          >
            <Menu aria-hidden="true" />
          </button>
          <Link to="/admin" className="flex items-center gap-2 text-lg font-bold text-emerald-700">
            <BookOpen aria-hidden="true" />
            <span>CampusStore Admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right text-sm sm:block">
              <div className="font-semibold text-slate-950">{user?.fullName}</div>
              <div className="text-slate-500">{isAdmin ? 'Admin' : 'Staff'}</div>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white p-4 lg:block">
          <AdminNav items={visibleNavItems} />
        </aside>

        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 bg-slate-950/40 lg:hidden" onMouseDown={() => setMobileMenuOpen(false)}>
            <aside
              className="h-full w-[86%] max-w-xs bg-white p-4 shadow-xl"
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="font-bold text-slate-950">Quản trị</span>
                <button
                  type="button"
                  className="rounded-md p-2 hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Đóng menu quản trị"
                >
                  <X aria-hidden="true" />
                </button>
              </div>
              <AdminNav items={visibleNavItems} onNavigate={() => setMobileMenuOpen(false)} />
            </aside>
          </div>
        ) : null}

        <main className="min-w-0 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function AdminNav({ items, onNavigate }: { items: AdminNavItem[]; onNavigate?: () => void }) {
  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/admin'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold ${
                isActive
                  ? 'bg-emerald-50 text-emerald-800'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
              }`
            }
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
