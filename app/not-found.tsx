import Link from "next/link";
export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-6xl font-extrabold brand-text">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-slate-600">The page or institute you&apos;re looking for doesn&apos;t exist or isn&apos;t live yet.</p>
      <Link href="/institutes" className="btn-primary mt-6">Explore institutes</Link>
    </div>
  );
}
