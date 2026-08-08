import { BookOpen, LogIn, Menu, PackageSearch, Search, ShieldCheck, ShoppingCart, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/auth';
import { getCategories } from '../api/catalog';

export function StoreLayout() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false
  });

  const canManageOrders = user?.roles.includes('Staff') || user?.roles.includes('Admin');

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/products?keyword=${encodeURIComponent(keyword)}`);
  }

  return (
    <div className="min-h-screen bg-[#f7faf9] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-emerald-700">
            <BookOpen aria-hidden="true" />
            CampusStore
          </Link>
          <form onSubmit={handleSearch} className="hidden flex-1 md:block">
            <div className="flex items-center rounded-md border border-slate-300 bg-white px-3">
              <Search className="h-5 w-5 text-slate-500" aria-hidden="true" />
              <input
                aria-label="Tìm kiếm sản phẩm"
                className="w-full border-0 px-3 py-2 outline-none"
                placeholder="Tìm bút, vở, balo..."
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
          </form>
          <nav className="ml-auto flex items-center gap-2">
            {canManageOrders ? (
              <Link className="rounded-md p-2 hover:bg-slate-100" to="/admin" aria-label="Quản trị">
                <ShieldCheck aria-hidden="true" />
              </Link>
            ) : null}
            <Link className="rounded-md p-2 hover:bg-slate-100" to="/orders" aria-label="Đơn hàng">
              <PackageSearch aria-hidden="true" />
            </Link>
            <Link className="rounded-md p-2 hover:bg-slate-100" to="/cart" aria-label="Giỏ hàng">
              <ShoppingCart aria-hidden="true" />
            </Link>
            {user ? (
              <Link
                className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold hover:bg-slate-100"
                to="/account"
                aria-label="Tài khoản"
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
                <span className="hidden max-w-32 truncate sm:inline">{user.fullName}</span>
              </Link>
            ) : (
              <Link
                className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                to="/login"
                aria-label="Đăng nhập"
              >
                <LogIn className="h-5 w-5" aria-hidden="true" />
                <span className="hidden sm:inline">Đăng nhập</span>
              </Link>
            )}
            <button className="rounded-md p-2 hover:bg-slate-100 md:hidden" aria-label="Menu">
              <Menu aria-hidden="true" />
            </button>
          </nav>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?categorySlug=${encodeURIComponent(category.slug)}`}
              className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm hover:border-emerald-400"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="border-t border-slate-200 bg-white px-4 py-8 text-sm text-slate-600">
        <div className="mx-auto max-w-7xl">CampusStore - Văn phòng phẩm và học liệu cho sinh viên.</div>
      </footer>
    </div>
  );
}
