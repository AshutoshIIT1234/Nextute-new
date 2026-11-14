import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CompareProvider } from "@/components/CompareContext";
import CompareBar from "@/components/CompareBar";
import { LangProvider } from "@/components/LangProvider";
import { getLang } from "@/lib/lang-server";
import { SITE_URL } from "@/lib/site";
import { getSession } from "@/lib/supabase/server";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  openGraph: { siteName: "Nextute", type: "website", locale: "en_IN" },
  title: { default: "Nextute — Find the best coaching institutes near you", template: "%s | Nextute" },
  description:
    "Discover, compare and connect with local coaching institutes in Patna and Bihar. See fees, facilities, faculty, photos and demo lectures before you join.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  const { profile } = await getSession();
  const studentNav = !profile || profile.role === "student";
  return (
    <html lang={lang} className={jakarta.variable}>
      <body className="min-h-screen font-sans antialiased">
        <LangProvider lang={lang}>
        <CompareProvider>
          <Navbar />
          <main className="min-h-[70vh]">{children}</main>
          <Footer />
          {studentNav && <CompareBar />}
        </CompareProvider>
        </LangProvider>
      </body>
    </html>
  );
}
