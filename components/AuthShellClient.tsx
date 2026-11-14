export default function AuthShellClient({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="card p-8">
        <img src="/logo.svg" alt="Nextute" className="mb-6 h-8 w-auto" />
        <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
