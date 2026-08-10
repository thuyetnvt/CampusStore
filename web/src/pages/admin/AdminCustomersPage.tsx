import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { getAdminCustomers, setAdminCustomerStatus, type AdminCustomerListItem, type UserStatus } from '../../api/adminCustomers';
import { formatCurrency } from '../../utils/format';

const DEFAULT_PAGE_SIZE = 12;

export function AdminCustomersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | UserStatus>('all');

  const customersQuery = useQuery({
    queryKey: ['admin-customers', page, keyword, status],
    queryFn: () =>
      getAdminCustomers({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        keyword: keyword || undefined,
        status: status === 'all' ? undefined : status
      }),
    retry: false
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: UserStatus }) => setAdminCustomerStatus(id, nextStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-customers'] })
  });

  const customers = customersQuery.data?.items ?? [];

  function toggleStatus(customer: AdminCustomerListItem) {
    statusMutation.mutate({
      id: customer.id,
      nextStatus: customer.status === 1 ? 2 : 1
    });
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin / Staff</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Danh sách khách hàng</h1>
        <p className="mt-2 text-sm text-slate-600">Theo dõi thông tin khách hàng, số đơn, tổng chi tiêu và trạng thái tài khoản.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-bold text-slate-950">Bộ lọc</h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Tìm kiếm</span>
              <input value={keyword} onChange={(event) => { setKeyword(event.target.value); setPage(1); }} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" placeholder="Tên, email, số điện thoại" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-slate-700">Trạng thái</span>
              <select value={status} onChange={(event) => { setStatus(event.target.value === 'all' ? 'all' : Number(event.target.value) as UserStatus); setPage(1); }} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="all">Tất cả</option>
                <option value={1}>Đang hoạt động</option>
                <option value={2}>Đã khóa</option>
                <option value={3}>Đã vô hiệu</option>
              </select>
            </label>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {customersQuery.isLoading ? 'Đang tải khách hàng...' : `${customersQuery.data?.totalItems ?? 0} khách hàng`}
          </div>
          {customersQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
          ) : customersQuery.isError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Không tải được danh sách khách hàng.</div>
          ) : customers.length ? (
            <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Khách hàng</th>
                    <th className="px-4 py-3">Liên hệ</th>
                    <th className="px-4 py-3">Đơn hàng</th>
                    <th className="px-4 py-3">Tổng chi tiêu</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((customer) => (
                    <tr key={customer.id}>
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-950">{customer.fullName}</div>
                        <div className="text-xs text-slate-500">ID: {customer.id}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div>{customer.email}</div>
                        <div className="text-slate-500">{customer.phoneNumber ?? 'Chưa có số điện thoại'}</div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-950">{customer.orderCount}</td>
                      <td className="px-4 py-4 font-semibold text-emerald-700">{formatCurrency(customer.totalSpent)}</td>
                      <td className="px-4 py-4">
                        <StatusPill status={customer.status} />
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-white ${customer.status === 1 ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'}`}
                          onClick={() => toggleStatus(customer)}
                          disabled={statusMutation.isPending}
                        >
                          {customer.status === 1 ? <Lock className="h-3.5 w-3.5" aria-hidden="true" /> : <Unlock className="h-3.5 w-3.5" aria-hidden="true" />}
                          {customer.status === 1 ? 'Khóa' : 'Mở khóa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
              <h2 className="text-lg font-bold text-slate-950">Không có khách hàng phù hợp</h2>
              <p className="mt-2 text-sm text-slate-600">Thử đổi từ khóa hoặc bộ lọc trạng thái.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2">
        <PagerButton label="Trước" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))} />
        <span className="text-sm text-slate-600">Trang {customersQuery.data?.page ?? page} / {customersQuery.data?.totalPages ?? 1}</span>
        <PagerButton label="Sau" disabled={page >= (customersQuery.data?.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)} />
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: UserStatus }) {
  const label = status === 1 ? 'Đang hoạt động' : status === 2 ? 'Đã khóa' : 'Đã vô hiệu';
  const color = status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}

function PagerButton({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
  return (
    <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50" disabled={disabled} onClick={onClick}>
      {label}
    </button>
  );
}
