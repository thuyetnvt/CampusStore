import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LogOut, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { getMe, logout } from '../api/auth';

export function AccountPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['me'] });
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/login');
    }
  });

  if (meQuery.isLoading) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-40 rounded-md bg-slate-100" />
      </section>
    );
  }

  if (meQuery.isError || !meQuery.data) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-5 text-sm text-amber-800">
          Bạn chưa đăng nhập.
        </div>
        <Link to="/login" className="mt-4 inline-block font-semibold text-emerald-700 hover:underline">
          Đăng nhập
        </Link>
      </section>
    );
  }

  const user = meQuery.data;
  const canManageOrders = user.roles.includes('Staff') || user.roles.includes('Admin');

  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <div className="rounded-md border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-emerald-50 p-3 text-emerald-700">
              <UserRound aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-950">{user.fullName}</h1>
              <p className="mt-1 text-sm text-slate-600">{user.email}</p>
              <p className="mt-1 text-sm text-slate-500">{user.roles.join(', ')}</p>
            </div>
          </div>
          <button
            type="button"
            disabled={logoutMutation.isPending}
            onClick={() => logoutMutation.mutate()}
            className="inline-flex items-center gap-2 rounded-md border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Đăng xuất
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Link className="rounded-md border border-slate-200 bg-white px-4 py-5 font-semibold hover:border-emerald-500" to="/orders">
          Đơn hàng của tôi
        </Link>
        <Link className="rounded-md border border-slate-200 bg-white px-4 py-5 font-semibold hover:border-emerald-500" to="/cart">
          Giỏ hàng
        </Link>
        {canManageOrders ? (
          <Link className="rounded-md border border-slate-200 bg-white px-4 py-5 font-semibold hover:border-emerald-500" to="/admin">
            Bảng quản trị
          </Link>
        ) : null}
      </div>
    </section>
  );
}
