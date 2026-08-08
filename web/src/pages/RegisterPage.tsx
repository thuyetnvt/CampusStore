import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { register } from '../api/auth';

export function RegisterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const registerMutation = useMutation({
    mutationFn: () => register({ fullName, email, phoneNumber, password, confirmPassword }),
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user);
      navigate('/');
    }
  });

  const passwordMismatch = Boolean(confirmPassword) && password !== confirmPassword;

  return (
    <section className="mx-auto flex max-w-7xl justify-center px-4 py-10">
      <div className="w-full max-w-lg rounded-md border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <UserPlus className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-950">Đăng ký</h1>
        </div>
        <form
          className="mt-5 grid gap-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!passwordMismatch) {
              registerMutation.mutate();
            }
          }}
        >
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium">Họ tên</span>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Số điện thoại</span>
            <input
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Xác nhận mật khẩu</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          {passwordMismatch ? (
            <div className="sm:col-span-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Mật khẩu xác nhận chưa khớp.
            </div>
          ) : null}
          <button
            type="submit"
            disabled={registerMutation.isPending || passwordMismatch}
            className="sm:col-span-2 rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            Tạo tài khoản
          </button>
        </form>

        {registerMutation.isError ? (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Không đăng ký được. Email có thể đã tồn tại hoặc mật khẩu chưa đủ mạnh.
          </div>
        ) : null}

        <div className="mt-5 text-sm text-slate-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-emerald-700 hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </section>
  );
}
