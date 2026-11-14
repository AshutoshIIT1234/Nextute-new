import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { getSession } from "@/lib/supabase/server";
import ContactForm from "./ContactForm";
import { SUPPORT_EMAIL, SUPPORT_PHONE } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Help & support" };

export default async function Contact() {
  const { user, profile } = await getSession();
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold text-navy">Help & support</h1>
      <p className="mt-2 text-slate-600">Facing an issue listing your institute, or need help choosing a coaching? We&apos;re a call away.</p>
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-4">
          {[
            [Phone, "Call / WhatsApp", `+91 ${SUPPORT_PHONE}`, `tel:+91${SUPPORT_PHONE}`],
            [Mail, "Email", SUPPORT_EMAIL, `mailto:${SUPPORT_EMAIL}`],
            [MapPin, "Office", "Patna, Bihar", null],
            [Clock, "Hours", "Mon–Sat, 10 AM – 7 PM", null],
          ].map(([I, l, v, href]) => {
            const Icon = I as typeof Phone;
            return (
              <div key={l as string} className="card flex items-center gap-4 p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal"><Icon size={20} /></span>
                <div><p className="text-xs text-slate-500">{l as string}</p>{href ? <a href={href as string} className="font-semibold hover:text-teal">{v as string}</a> : <p className="font-semibold">{v as string}</p>}</div>
              </div>
            );
          })}
          <a href={`https://wa.me/91${SUPPORT_PHONE}?text=${encodeURIComponent("Hi Nextute, I need help with")}`} target="_blank" rel="noreferrer" className="btn w-full bg-green-600 py-3 text-white hover:bg-green-700">Chat on WhatsApp</a>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold">Raise a support ticket</h2>
          <p className="text-sm text-slate-500">We usually respond within a few hours.</p>
          <div className="mt-5">
            <ContactForm userId={user?.id ?? null} defaults={{ name: profile?.full_name || "", email: user?.email || "", phone: profile?.phone || "", category: profile?.role === "institute" ? "Institute listing" : "General" }} />
          </div>
        </div>
      </div>
    </div>
  );
}
