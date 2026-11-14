import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 md:grid-cols-2 md:py-16">
      <div className="hidden flex-col justify-center md:flex">
        <img src="/logo.svg" alt="Nextute" className="h-10 w-auto self-start" />
        <h2 className="mt-8 text-3xl font-extrabold leading-tight text-navy">Choose your coaching with confidence.</h2>
        <ul className="mt-6 space-y-3 text-slate-600">
          {["Full institute details, photos & faculty", "Watch demo lectures before visiting", "Compare institutes side by side", "Send admission enquiries in one click"].map((t) => (
            <li key={t} className="flex items-center gap-2"><CheckCircle2 size={18} className="text-leaf" /> {t}</li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-slate-500">Run an institute? <Link href="/signup?role=institute" className="font-semibold text-teal">Register it free</Link></p>
      </div>
      <div className="card p-6 md:p-8">
        <h1 className="text-2xl font-extrabold text-navy">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
