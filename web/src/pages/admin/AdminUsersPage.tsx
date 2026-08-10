import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Lock, Plus, ShieldCheck, Unlock, UserCog } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import {
  createAdminStaff,
  getAdminUsers,
  setAdminUserRoles,
  setAdminUserStatus,
  type AdminCreateStaffRequest,
  type AdminUserListItem
} from '../../api/adminUsers';
import type { UserStatus } from '../../api/adminCustomers';
import { useAuthUser } from '../../routes/authSession';

const DEFAULT_PAGE_SIZE = 12;
const ROLE_OPTIONS = ['Customer', 'Staff', 'Admin'] as const;

type StatusFilter = 'all' | UserStatus;

type StaffFormState = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useAuthUser();
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [role, setRole] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingRolesUser, setEditingRolesUser] = useState<AdminUserListItem | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [staffForm, setStaffForm] = useState<StaffFormState>(getEmptyStaffForm());
  const [formError, setFormError] = useState('');
  const [roleError, setRoleError] = useState('');

  const usersQuery = useQuery({
    queryKey: ['admin-users', page, keyword, status, role],
    queryFn: () =>
      getAdminUsers({
        page,
        pageSize: DEFAULT_PAGE_SIZE,
        keyword: keyword || undefined,
        status: status === 'all' ? undefined : status,
        role: role || undefined
      }),
    retry: false
  });

  const createMutation = useMutation({
    mutationFn: (payload: AdminCreateStaffRequest) => createAdminStaff(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      closeCreateForm();
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, nextStatus }: { id: number; nextStatus: UserStatus }) => setAdminUserStatus(id, nextStatus),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] })
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, roles }: { id: number; roles: string[] }) => setAdminUserRoles(id, roles),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingRolesUser(null);
      setSelectedRoles([]);
      setRoleError('');
    }
  });

  const users = usersQuery.data?.items ?? [];

  function openCreateForm() {
    setStaffForm(getEmptyStaffForm());
    setFormError('');
    setIsCreateOpen(true);
  }

  function closeCreateForm() {
    setIsCreateOpen(false);
    setStaffForm(getEmptyStaffForm());
    setFormError('');
  }

  function openRoleForm(user: AdminUserListItem) {
    setEditingRolesUser(user);
    setSelectedRoles(user.roles);
    setRoleError('');
  }

  function closeRoleForm() {
    setEditingRolesUser(null);
    setSelectedRoles([]);
    setRoleError('');
  }

  async function handleCreateStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeStaffForm(staffForm);
    if ('message' in normalized) {
      setFormError(normalized.message);
      return;
    }

    setFormError('');
    try {
      await createMutation.mutateAsync(normalized.data);
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Không thể tạo tài khoản nhân sự.'));
    }
  }

  async function handleSaveRoles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingRolesUser) {
      return;
    }
    if (selectedRoles.length === 0) {
      setRoleError('Tài khoản phải có ít nhất một vai trò.');
      return;
    }
    if (editingRolesUser.id === currentUser?.id && !selectedRoles.includes('Admin')) {
      setRoleError('Bạn không thể tự gỡ vai trò Admin của chính mình.');
      return;
    }

    setRoleError('');
    try {
      await roleMutation.mutateAsync({ id: editingRolesUser.id, roles: selectedRoles });
    } catch (error) {
      setRoleError(getApiErrorMessage(error, 'Không thể cập nhật vai trò.'));
    }
  }

  function toggleStatus(user: AdminUserListItem) {
    if (user.id === currentUser?.id) {
      return;
    }

    statusMutation.mutate({
      id: user.id,
      nextStatus: user.status === 1 ? 2 : 1
    });
  }

  function toggleSelectedRole(roleName: string) {
    setSelectedRoles((current) =>
      current.includes(roleName)
        ? current.filter((item) => item !== roleName)
        : [...current, roleName]
    );
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Admin</p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950">Tài khoản và quản trị viên</h1>
          <p className="mt-2 text-sm text-slate-600">
            Quản lý trạng thái tài khoản, tạo Staff và cấp hoặc thu hồi vai trò.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Tạo Staff
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-base font-bold text-slate-950">Bộ lọc</h2>
          <div className="mt-4 space-y-4">
            <Field label="Tìm kiếm">
              <input
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="Tên, email, số điện thoại"
              />
            </Field>
            <Field label="Trạng thái">
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value === 'all' ? 'all' : Number(event.target.value) as UserStatus);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Tất cả</option>
                <option value={1}>Đang hoạt động</option>
                <option value={2}>Đã khóa</option>
                <option value={3}>Đã vô hiệu</option>
              </select>
            </Field>
            <Field label="Vai trò">
              <select
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setPage(1);
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Tất cả</option>
                {ROLE_OPTIONS.map((roleName) => (
                  <option key={roleName} value={roleName}>{roleName}</option>
                ))}
              </select>
            </Field>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
            {usersQuery.isLoading ? 'Đang tải tài khoản...' : `${usersQuery.data?.totalItems ?? 0} tài khoản`}
          </div>

          {usersQuery.isLoading ? (
            <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
          ) : usersQuery.isError ? (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Không tải được danh sách tài khoản.
            </div>
          ) : users.length ? (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Tài khoản</th>
                      <th className="px-4 py-3">Liên hệ</th>
                      <th className="px-4 py-3">Vai trò</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-950">{user.fullName}</div>
                          <div className="text-xs text-slate-500">ID: {user.id}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div>{user.email}</div>
                          <div className="text-slate-500">{user.phoneNumber ?? 'Chưa có số điện thoại'}</div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {user.roles.map((roleName) => (
                              <span key={roleName} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                {roleName}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4"><StatusPill status={user.status} /></td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50"
                              onClick={() => openRoleForm(user)}
                            >
                              <UserCog className="h-3.5 w-3.5" aria-hidden="true" />
                              Vai trò
                            </button>
                            <button
                              type="button"
                              className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-xs font-semibold text-white ${user.status === 1 ? 'bg-rose-700 hover:bg-rose-800' : 'bg-emerald-700 hover:bg-emerald-800'}`}
                              onClick={() => toggleStatus(user)}
                              disabled={statusMutation.isPending || user.id === currentUser?.id}
                              title={user.id === currentUser?.id ? 'Không thể khóa chính mình' : undefined}
                            >
                              {user.status === 1 ? <Lock className="h-3.5 w-3.5" aria-hidden="true" /> : <Unlock className="h-3.5 w-3.5" aria-hidden="true" />}
                              {user.status === 1 ? 'Khóa' : 'Mở khóa'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination
                page={usersQuery.data?.page ?? page}
                totalPages={usersQuery.data?.totalPages ?? 1}
                onPrevious={() => setPage((value) => Math.max(value - 1, 1))}
                onNext={() => setPage((value) => value + 1)}
              />
            </>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center">
              <h2 className="text-lg font-bold text-slate-950">Không có tài khoản phù hợp</h2>
              <p className="mt-2 text-sm text-slate-600">Thử đổi từ khóa, trạng thái hoặc vai trò.</p>
            </div>
          )}
        </div>
      </div>

      {isCreateOpen ? (
        <Modal title="Tạo tài khoản Staff" onClose={closeCreateForm}>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateStaff}>
            <Field label="Họ tên">
              <input value={staffForm.fullName} onChange={(event) => setStaffForm((current) => ({ ...current, fullName: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </Field>
            <Field label="Email">
              <input type="email" value={staffForm.email} onChange={(event) => setStaffForm((current) => ({ ...current, email: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </Field>
            <Field label="Số điện thoại">
              <input value={staffForm.phoneNumber} onChange={(event) => setStaffForm((current) => ({ ...current, phoneNumber: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </Field>
            <Field label="Mật khẩu">
              <input type="password" value={staffForm.password} onChange={(event) => setStaffForm((current) => ({ ...current, password: event.target.value }))} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm" />
            </Field>
            {formError ? <div className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{formError}</div> : null}
            <div className="md:col-span-2 flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button type="button" className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold" onClick={closeCreateForm} disabled={createMutation.isPending}>Hủy</button>
              <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={createMutation.isPending}>{createMutation.isPending ? 'Đang tạo...' : 'Tạo Staff'}</button>
            </div>
          </form>
        </Modal>
      ) : null}

      {editingRolesUser ? (
        <Modal title={`Cập nhật vai trò: ${editingRolesUser.fullName}`} onClose={closeRoleForm}>
          <form className="space-y-4" onSubmit={handleSaveRoles}>
            <div className="grid gap-2 sm:grid-cols-3">
              {ROLE_OPTIONS.map((roleName) => (
                <label key={roleName} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(roleName)}
                    onChange={() => toggleSelectedRole(roleName)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-700"
                  />
                  {roleName === 'Admin' ? <ShieldCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" /> : null}
                  {roleName}
                </label>
              ))}
            </div>
            {roleError ? <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{roleError}</div> : null}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
              <button type="button" className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold" onClick={closeRoleForm} disabled={roleMutation.isPending}>Hủy</button>
              <button type="submit" className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={roleMutation.isPending}>{roleMutation.isPending ? 'Đang lưu...' : 'Lưu vai trò'}</button>
            </div>
          </form>
        </Modal>
      ) : null}
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6" onMouseDown={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl" onMouseDown={(event) => event.stopPropagation()}>
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: UserStatus }) {
  const label = status === 1 ? 'Đang hoạt động' : status === 2 ? 'Đã khóa' : 'Đã vô hiệu';
  const color = status === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700';
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${color}`}>{label}</span>;
}

function Pagination({ page, totalPages, onPrevious, onNext }: { page: number; totalPages: number; onPrevious: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50" disabled={page <= 1} onClick={onPrevious}>
        Trước
      </button>
      <span className="text-sm text-slate-600">Trang {page} / {totalPages}</span>
      <button type="button" className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold disabled:opacity-50" disabled={page >= totalPages} onClick={onNext}>
        Sau
      </button>
    </div>
  );
}

function getEmptyStaffForm(): StaffFormState {
  return {
    fullName: '',
    email: '',
    phoneNumber: '',
    password: ''
  };
}

function normalizeStaffForm(state: StaffFormState): { data: AdminCreateStaffRequest } | { message: string } {
  const fullName = state.fullName.trim();
  const email = state.email.trim();
  const phoneNumber = state.phoneNumber.trim();
  const password = state.password;

  if (!fullName) {
    return { message: 'Họ tên không được để trống.' };
  }
  if (!email) {
    return { message: 'Email không được để trống.' };
  }
  if (password.length < 8) {
    return { message: 'Mật khẩu phải có ít nhất 8 ký tự.' };
  }

  return {
    data: {
      fullName,
      email,
      phoneNumber: phoneNumber || null,
      password,
      roles: ['Staff']
    }
  };
}

function getApiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
      return data.message;
    }
    return error.message || fallback;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}
