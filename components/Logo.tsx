import Link from "next/link";
export default function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <Link href="/" aria-label="Nextute home" className="inline-flex items-center">
      <img src="/logo.svg" alt="Nextute" className={className + " w-auto"} />
    </Link>
  );
}
