export function AdminPlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <section className="rounded-md border border-dashed border-slate-300 bg-white p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Đang chờ triển khai</p>
      <h1 className="mt-2 text-2xl font-bold text-slate-950">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">{description}</p>
    </section>
  );
}
