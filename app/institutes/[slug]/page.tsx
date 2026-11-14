import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BadgeCheck, MapPin, Star, Users, Clock, CalendarDays, GraduationCap, Lock, PlayCircle, Phone, Globe, Mail,
  CheckCircle2, Award, BookOpen, IndianRupee, Navigation, MessageCircle, Sparkles,
} from "lucide-react";
import Gallery from "@/components/Gallery";
import VideoPlayer from "@/components/VideoPlayer";
import CompareButton from "@/components/CompareButton";
import ShortlistButton from "@/components/ShortlistButton";
import QueryForm from "@/components/QueryForm";
import Reviews from "@/components/Reviews";
import { getSession } from "@/lib/supabase/server";
import { PUBLIC_COLS } from "@/lib/constants";
import { feeRange, inr, initials, type Institute } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const { supabase } = await getSession();
  const { data } = await supabase.from("institutes").select("name,area,city,tagline").eq("slug", slug).maybeSingle();
  if (!data) return { title: "Institute not found" };
  return { title: `${data.name}, ${data.area}`, description: data.tagline || `Fees, faculty, facilities and demo lectures of ${data.name}, ${data.area}, ${data.city}.` };
}

export default async function InstitutePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { supabase, user, profile } = await getSession();
  const { data } = await supabase.from("institutes").select(user ? "*" : PUBLIC_COLS).eq("slug", slug).maybeSingle();
  if (!data) notFound();
  const inst = data as unknown as Institute;
  await supabase.rpc("increment_views", { iid: inst.id });

  const loggedIn = !!user;
  const isStudent = profile?.role === "student";
  const isOwner = !!user && inst.owner_id === user.id;

  let shortlisted = false;
  let lastQuery: string | null = null;
  let reviews: any[] = [];
  if (loggedIn) {
    const [s, q, r] = await Promise.all([
      supabase.from("shortlists").select("institute_id").eq("student_id", user!.id).eq("institute_id", inst.id).maybeSingle(),
      supabase.from("queries").select("created_at").eq("student_id", user!.id).eq("institute_id", inst.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("reviews").select("*").eq("institute_id", inst.id).order("created_at", { ascending: false }),
    ]);
    shortlisted = !!s.data;
    lastQuery = q.data?.[0]?.created_at ?? null;
    reviews = r.data || [];
  }

  const images = [inst.cover_image, ...(inst.photos || [])].filter(Boolean) as string[];
  const nextUrl = `/institutes/${inst.slug}`;
  const mapsHref = inst.map_url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${inst.name} ${inst.address || inst.area} ${inst.city}`)}`;

  const sections = loggedIn
    ? [["overview", "Overview"], ["demos", `Demo lectures (${inst.demo_count})`], ["faculty", `Faculty (${inst.faculty_count})`], ["batches", "Batches & fees"], ["facilities", "Facilities"], ["reviews", `Reviews (${inst.review_count})`], ["location", "Location"]]
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link href="/institutes" className="hover:text-teal">Institutes</Link> /{" "}
        <Link href={`/institutes?area=${encodeURIComponent(inst.area)}`} className="hover:text-teal">{inst.area}</Link> /{" "}
        <span className="text-slate-800">{inst.name}</span>
      </nav>

      {inst.status !== "approved" && (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          This listing is <b>{inst.status}</b> and is not visible to students yet.{inst.rejection_reason ? ` Reason: ${inst.rejection_reason}` : ""}
        </div>
      )}
      {inst.is_sample && (
        <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          Sample listing for demonstration — details are illustrative.
        </div>
      )}

      <Gallery images={images} name={inst.name} locked={!loggedIn} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  {inst.is_featured && <span className="badge bg-amber-100 text-amber-800"><Sparkles size={12} /> Featured</span>}
                  {inst.is_verified && <span className="badge bg-teal-50 text-teal"><BadgeCheck size={12} /> Nextute verified</span>}
                  <span className="badge bg-slate-100 text-slate-700">{inst.mode}</span>
                  {inst.gender && inst.gender !== "Co-ed" && <span className="badge bg-pink-50 text-pink-700">{inst.gender}</span>}
                </div>
                <h1 className="mt-3 text-2xl font-extrabold text-navy md:text-3xl">{inst.name}</h1>
                {inst.tagline && <p className="mt-1 text-slate-600">{inst.tagline}</p>}
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={15} /> {inst.area}, {inst.city}</span>
                  {inst.established_year && <span className="flex items-center gap-1"><CalendarDays size={15} /> Since {inst.established_year}</span>}
                  {inst.batch_size && <span className="flex items-center gap-1"><Users size={15} /> ~{inst.batch_size} students/batch</span>}
                </p>
              </div>
              <div className="text-right">
                {inst.review_count > 0 ? (
                  <>
                    <p className="flex items-center justify-end gap-1 text-2xl font-extrabold"><Star className="fill-amber-400 text-amber-400" size={22} /> {Number(inst.rating).toFixed(1)}</p>
                    <p className="text-xs text-slate-500">{inst.review_count} review{inst.review_count > 1 ? "s" : ""}</p>
                  </>
                ) : <p className="text-xs text-slate-500">No reviews yet</p>}
              </div>
            </div>
            <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Classes</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{inst.classes.map((c) => <span key={c} className="chip">{c}</span>)}</div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Courses / Exams</p>
                <div className="mt-2 flex flex-wrap gap-1.5">{inst.exams.map((c) => <span key={c} className="chip-active">{c}</span>)}</div>
              </div>
              {inst.subjects?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Subjects</p>
                  <p className="mt-2 text-sm text-slate-700">{inst.subjects.join(", ")}</p>
                </div>
              )}
              {inst.boards?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Boards</p>
                  <p className="mt-2 text-sm text-slate-700">{inst.boards.join(", ")}</p>
                </div>
              )}
            </div>
          </div>

          {!loggedIn ? (
            <>
              <div className="card p-6">
                <h2 className="text-lg font-bold">Facilities</h2>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {inst.facilities.map((f) => <span key={f} className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-leaf" /> {f}</span>)}
                </div>
              </div>
              <div className="card relative overflow-hidden p-8 text-center">
                <div className="pointer-events-none absolute inset-0 select-none p-6 opacity-40 blur-[6px]" aria-hidden>
                  <div className="grid grid-cols-3 gap-3">{[1, 2, 3].map((i) => <div key={i} className="aspect-video rounded-xl bg-slate-300" />)}</div>
                  <div className="mt-4 space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-4 rounded bg-slate-300" />)}</div>
                </div>
                <div className="relative">
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl brand-gradient text-white"><Lock /></span>
                  <h2 className="mt-4 text-xl font-extrabold text-navy">Sign up free to see full details</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
                    Watch {inst.demo_count > 0 ? `${inst.demo_count} demo lecture${inst.demo_count > 1 ? "s" : ""}` : "demo lectures"}, see {inst.faculty_count > 0 ? `${inst.faculty_count} faculty profiles` : "faculty profiles"} with qualifications, batch-wise fees & timings, all photos, reviews and contact details.
                  </p>
                  <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link href={`/signup?next=${encodeURIComponent(nextUrl)}`} className="btn-primary px-6">Create free account</Link>
                    <Link href={`/login?next=${encodeURIComponent(nextUrl)}`} className="btn-outline px-6">I already have an account</Link>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="no-scrollbar sticky top-16 z-20 -mx-4 flex gap-1 overflow-x-auto border-b border-slate-200 bg-[#f7f9fb]/95 px-4 py-2 backdrop-blur">
                {sections.map(([id, l]) => <a key={id} href={`#${id}`} className="btn-ghost shrink-0 py-1.5 text-xs">{l}</a>)}
              </div>

              <section id="overview" className="card scroll-mt-32 p-6">
                <h2 className="text-lg font-bold">About {inst.name}</h2>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-700">{inst.description || "The institute hasn't added a description yet."}</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {inst.timings && <p className="flex items-center gap-2 text-sm"><Clock size={16} className="text-teal" /> {inst.timings}</p>}
                  {inst.scholarship && <p className="flex items-center gap-2 text-sm"><Award size={16} className="text-teal" /> {inst.scholarship}</p>}
                </div>
                {inst.results && inst.results.length > 0 && (
                  <div className="mt-5 rounded-xl bg-leaf-50 p-4">
                    <p className="text-sm font-semibold text-green-900">Results & achievements</p>
                    <ul className="mt-2 space-y-1 text-sm text-green-900">{inst.results.map((r, i) => <li key={i}>• {r.year && <b>{r.year}: </b>}{r.text}</li>)}</ul>
                  </div>
                )}
              </section>

              <section id="demos" className="card scroll-mt-32 p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold"><PlayCircle size={20} className="text-teal" /> Demo lectures</h2>
                {inst.demo_videos && inst.demo_videos.length > 0 ? (
                  <div className="mt-4 grid gap-5 md:grid-cols-2">
                    {inst.demo_videos.map((v, i) => (
                      <div key={i}>
                        <VideoPlayer url={v.url} title={v.title} />
                        <p className="mt-2 text-sm font-semibold">{v.title}</p>
                        <p className="text-xs text-slate-500">{[v.teacher, v.subject].filter(Boolean).join(" · ")}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-3 text-sm text-slate-500">No demo lectures uploaded yet. Send an enquiry to ask for a free demo class.</p>}
              </section>

              <section id="faculty" className="card scroll-mt-32 p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold"><GraduationCap size={20} className="text-teal" /> Faculty</h2>
                {inst.faculty && inst.faculty.length > 0 ? (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {inst.faculty.map((t, i) => (
                      <div key={i} className="flex gap-3 rounded-xl border border-slate-200 p-4">
                        {t.photo ? <img src={t.photo} alt={t.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" /> : (
                          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-teal-50 font-bold text-teal">{initials(t.name)}</span>
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold">{t.name}</p>
                          <p className="text-sm text-teal">{t.subject}</p>
                          <p className="mt-1 text-xs text-slate-600">{t.qualification}</p>
                          {t.experience && <p className="text-xs text-slate-500">{t.experience} experience</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-3 text-sm text-slate-500">Faculty details not added yet.</p>}
              </section>

              <section id="batches" className="card scroll-mt-32 p-6">
                <h2 className="flex items-center gap-2 text-lg font-bold"><BookOpen size={20} className="text-teal" /> Batches & fees</h2>
                {inst.batches && inst.batches.length > 0 ? (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="text-xs uppercase text-slate-500"><tr><th className="py-2">Batch</th><th>Timing</th><th>Starts</th><th>Seats</th><th className="text-right">Fee</th></tr></thead>
                      <tbody>
                        {inst.batches.map((b, i) => (
                          <tr key={i} className="border-t border-slate-100">
                            <td className="py-3 font-medium">{b.name}</td>
                            <td>{b.timing || "—"}</td>
                            <td>{b.start ? new Date(b.start).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</td>
                            <td>{b.seats || "—"}</td>
                            <td className="text-right font-semibold">{b.fee ? inr(b.fee) : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : <p className="mt-3 text-sm text-slate-500">Batch details not added yet.</p>}
                <p className="mt-3 text-sm text-slate-600"><b>Fee range:</b> {feeRange(inst.fee_min, inst.fee_max)} per year{inst.fee_note ? ` · ${inst.fee_note}` : ""}</p>
              </section>

              <section id="facilities" className="card scroll-mt-32 p-6">
                <h2 className="text-lg font-bold">Facilities</h2>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {inst.facilities.map((f) => <span key={f} className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-leaf" /> {f}</span>)}
                </div>
              </section>

              <section id="reviews" className="card scroll-mt-32 p-6">
                <h2 className="text-lg font-bold">Student reviews</h2>
                <div className="mt-4">
                  <Reviews instituteId={inst.id} reviews={reviews} me={user ? { id: user.id, name: profile?.full_name || "Student" } : null} canReview={isStudent} />
                </div>
              </section>

              <section id="location" className="card scroll-mt-32 p-6">
                <h2 className="text-lg font-bold">Location & contact</h2>
                <p className="mt-3 flex items-start gap-2 text-sm"><MapPin size={16} className="mt-0.5 shrink-0 text-teal" /> {inst.address || `${inst.area}, ${inst.city}`}{inst.pincode ? ` – ${inst.pincode}` : ""}</p>
                <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                  <iframe
                    title="Map"
                    className="h-64 w-full"
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${encodeURIComponent(`${inst.name}, ${inst.address || inst.area}, ${inst.city}`)}&output=embed`}
                  />
                </div>
                <a href={mapsHref} target="_blank" rel="noreferrer" className="btn-outline mt-3"><Navigation size={16} /> Get directions</a>
              </section>
            </>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <p className="text-xs uppercase tracking-wide text-slate-400">Fees per year</p>
            <p className="mt-1 flex items-center text-3xl font-extrabold text-navy"><IndianRupee size={24} />{feeRange(inst.fee_min, inst.fee_max).replace(/₹/g, "")}</p>
            {loggedIn && inst.fee_note && <p className="mt-1 text-xs text-slate-500">{inst.fee_note}</p>}
            <div className="mt-5 space-y-2">
              {!loggedIn ? (
                <Link href={`/signup?next=${encodeURIComponent(nextUrl)}`} className="btn-primary w-full py-3 text-base">Sign up to enquire</Link>
              ) : isStudent ? (
                <QueryForm
                  instituteId={inst.id}
                  instituteName={inst.name}
                  batches={inst.batches || []}
                  exams={inst.exams}
                  profile={{ id: user!.id, full_name: profile?.full_name ?? null, phone: profile?.phone ?? null, email: profile?.email ?? user!.email ?? null, class_level: profile?.class_level ?? null }}
                  alreadySentOn={lastQuery}
                />
              ) : (
                <p className="rounded-xl bg-slate-50 p-3 text-center text-xs text-slate-500">Admission enquiries can be sent from a student account.</p>
              )}
              <div className="grid grid-cols-1 gap-2">
                <CompareButton id={inst.id} name={inst.name} area={inst.area} className="w-full" />
                {loggedIn && isStudent && <ShortlistButton instituteId={inst.id} userId={user!.id} initial={shortlisted} className="w-full" />}
              </div>
            </div>
            {isOwner && <Link href="/institute/listing" className="btn-dark mt-3 w-full">Edit this listing</Link>}
            {profile?.role === "admin" && <Link href={`/admin/institutes/${inst.id}`} className="btn-dark mt-3 w-full">Edit in admin</Link>}
          </div>

          {loggedIn && (inst.phone || inst.email || inst.website || inst.whatsapp) && (
            <div className="card space-y-2 p-5 text-sm">
              <p className="font-semibold">Contact {inst.contact_name ? `· ${inst.contact_name}` : ""}</p>
              {inst.phone && <a href={`tel:${inst.phone}`} className="flex items-center gap-2 hover:text-teal"><Phone size={15} /> {inst.phone}</a>}
              {inst.whatsapp && <a href={`https://wa.me/91${inst.whatsapp.replace(/\D/g, "").slice(-10)}`} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-teal"><MessageCircle size={15} /> WhatsApp</a>}
              {inst.email && <a href={`mailto:${inst.email}`} className="flex items-center gap-2 hover:text-teal"><Mail size={15} /> {inst.email}</a>}
              {inst.website && <a href={inst.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-teal"><Globe size={15} /> Website</a>}
            </div>
          )}

          <div className="card p-5 text-sm">
            <p className="font-semibold">At a glance</p>
            <ul className="mt-3 space-y-2 text-slate-600">
              <li className="flex justify-between"><span>Mode</span><b className="text-slate-900">{inst.mode}</b></li>
              <li className="flex justify-between"><span>Demo lectures</span><b className="text-slate-900">{inst.demo_count}</b></li>
              <li className="flex justify-between"><span>Faculty members</span><b className="text-slate-900">{inst.faculty_count}</b></li>
              <li className="flex justify-between"><span>Facilities</span><b className="text-slate-900">{inst.facilities.length}</b></li>
              {inst.batch_size && <li className="flex justify-between"><span>Batch size</span><b className="text-slate-900">~{inst.batch_size}</b></li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
