import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LogIn } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { login } from '../api/auth';
import { returnToKey } from '../routes/authSession';

export function LoginPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState('customer@campusstore.local');
  const [password, setPassword] = useState('DemoPassword123');

  const loginMutation = useMutation({
    mutationFn: () => login({ email, password }),
    onSuccess: (user) => {
      queryClient.setQueryData(['me'], user);
      const returnTo = sessionStorage.getItem(returnToKey);
      sessionStorage.removeItem(returnToKey);
      navigate(returnTo && returnTo !== '/login' ? returnTo : '/', { replace: true });
    }
  });

  return (
    <section className="mx-auto flex max-w-7xl justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <LogIn className="h-6 w-6 text-emerald-700" aria-hidden="true" />
          <h1 className="text-2xl font-bold text-slate-950">Đăng nhập</h1>
        </div>
        <p className="mt-2 text-sm text-slate-600">Dùng tài khoản demo hoặc tài khoản bạn đã đăng ký.</p>

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            loginMutation.mutate();
          }}
        >
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
            <span className="mb-1 block text-sm font-medium">Mật khẩu</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full rounded-md bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            Đăng nhập
          </button>
        </form>

        {loginMutation.isError ? (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Email hoặc mật khẩu không đúng.
          </div>
        ) : null}

        <div className="mt-5 text-sm text-slate-600">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-semibold text-emerald-700 hover:underline">
            Đăng ký
          </Link>
        </div>
      </div>
    </section>
  );
}
