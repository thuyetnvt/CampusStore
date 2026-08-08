import { BookOpen, LogIn, Menu, PackageSearch, Search, ShieldCheck, ShoppingCart, UserRound } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { getMe } from '../api/auth';
import { getCart } from '../api/cart';
import { getCategories } from '../api/catalog';

export function StoreLayout() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories
  });
  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    retry: false,
    staleTime: 5 * 60 * 1000
  });
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    retry: false,
    staleTime: 30 * 1000
  });

  const canManageOrders = user?.roles.includes('Staff') || user?.roles.includes('Admin');
  const cartCount = cart?.totalQuantity ?? 0;

  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(`/products?keyword=${encodeURIComponent(keyword)}`);
    setMobileMenuOpen(false);
  }

  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }

  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (mobileMenuRef.current && target && !mobileMenuRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [mobileMenuOpen]);

  const mobileNavLinks = useMemo(
    () => [
      { to: '/account', label: user ? 'Tài khoản của tôi' : 'Đăng nhập', show: true },
      { to: '/cart', label: `Giỏ hàng (${cartCount})`, show: true },
      { to: '/orders', label: 'Đơn hàng của tôi', show: Boolean(user) },
      { to: '/admin', label: 'Quản trị', show: Boolean(canManageOrders) }
    ],
    [canManageOrders, cartCount, user]
  );

  return (
    <div className="min-h-screen bg-[#f7faf9] text-slate-900">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 text-lg font-bold text-emerald-700" onClick={closeMobileMenu}>
            <BookOpen aria-hidden="true" />
            <span>CampusStore</span>
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
          <nav className="ml-auto hidden items-center gap-2 md:flex">
            {canManageOrders ? (
              <Link className="rounded-md p-2 hover:bg-slate-100" to="/admin" aria-label="Quản trị">
                <ShieldCheck aria-hidden="true" />
              </Link>
            ) : null}
            <Link className="rounded-md p-2 hover:bg-slate-100" to="/orders" aria-label="Đơn hàng">
              <PackageSearch aria-hidden="true" />
            </Link>
            <Link className="relative rounded-md p-2 hover:bg-slate-100" to="/cart" aria-label="Giỏ hàng">
              <ShoppingCart aria-hidden="true" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-semibold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </Link>
            {user ? (
              <Link
                className="inline-flex max-w-44 items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold hover:bg-slate-100"
                to="/account"
                aria-label="Tài khoản"
              >
                <UserRound className="h-5 w-5" aria-hidden="true" />
                <span className="truncate">{user.fullName}</span>
              </Link>
            ) : (
              <Link
                className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
                to="/login"
                aria-label="Đăng nhập"
              >
                <LogIn className="h-5 w-5" aria-hidden="true" />
                <span>Đăng nhập</span>
              </Link>
            )}
          </nav>
          <button
            type="button"
            onClick={() => setMobileMenuOpen((value) => !value)}
            className="inline-flex items-center justify-center rounded-md p-2 hover:bg-slate-100 md:hidden"
            aria-label="Menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu aria-hidden="true" />
          </button>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-3">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?categorySlug=${encodeURIComponent(category.slug)}`}
              onClick={closeMobileMenu}
              className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm hover:border-emerald-400"
            >
              {category.name}
            </Link>
          ))}
        </div>
        {mobileMenuOpen ? (
          <div className="fixed inset-0 z-50 bg-slate-950/30 md:hidden">
            <div ref={mobileMenuRef} className="ml-auto flex h-full w-[88%] max-w-sm flex-col bg-white shadow-xl">
              <div className="border-b border-slate-200 p-4">
                <form onSubmit={handleSearch}>
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
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {mobileNavLinks
                    .filter((item) => item.show)
                    .map((item) => (
                      <Link
                        key={item.to + item.label}
                        to={item.to}
                        onClick={closeMobileMenu}
                        className="block rounded-md border border-slate-200 px-3 py-3 text-sm font-medium text-slate-800 hover:border-emerald-400 hover:bg-emerald-50"
                      >
                        {item.label}
                      </Link>
                    ))}
                </div>
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <div className="mb-3 text-sm font-semibold text-slate-700">Danh mục</div>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <Link
                        key={category.id}
                        to={`/products?categorySlug=${encodeURIComponent(category.slug)}`}
                        onClick={closeMobileMenu}
                        className="block rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-emerald-400 hover:bg-emerald-50"
                      >
                        {category.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
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
