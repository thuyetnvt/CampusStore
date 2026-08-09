import { ShieldAlert } from 'lucide-react';
import { Link } from 'react-router';

export function ForbiddenPage() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-7xl items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-6 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-700" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold text-slate-950">Không có quyền truy cập</h1>
        <p className="mt-2 text-sm text-slate-600">
          Tài khoản hiện tại không được phép mở khu vực này.
        </p>
        <Link
          to="/"
          className="mt-5 inline-flex rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
        >
          Về trang chủ
        </Link>
      </div>
    </section>
  );
}
