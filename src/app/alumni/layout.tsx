import { Globe, LogOut } from "lucide-react";
import { AlumniNav } from "@/components/alumni/alumni-nav";
import { AButton, Avatar } from "@/components/alumni/ui";
import { BrandMark } from "@/components/layout/brand-mark";
import { getAlumniProfile } from "@/lib/alumni/queries";
import { logoutAction } from "@/lib/auth/actions";
import { requireProfile } from "@/lib/auth/session";

// A distinct dark "Alumni Network" shell, separate from the member portal and the public site.
export default async function AlumniLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile("/alumni");
  const alumnus = await getAlumniProfile(profile.id);
  return (
    <div className="min-h-dvh bg-ivory lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
      <aside className="bg-hero-glow flex flex-col gap-6 px-4 py-6 text-ivory lg:sticky lg:top-0 lg:h-dvh lg:px-6 lg:py-8">
        <BrandMark light />
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 ring-1 ring-inset ring-white/10">
          <Avatar name={profile.full_name} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-white">{profile.full_name}</p>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-accent-400">
              {alumnus ? `Class of ${alumnus.graduation_year}` : "Alumni Network"}
            </p>
          </div>
        </div>
        <AlumniNav />
        <div className="flex flex-wrap gap-2 lg:mt-auto lg:flex-col">
          <AButton href="/opportunities" variant="dark"><Globe aria-hidden className="size-4" /> Live opportunities</AButton>
          <form action={logoutAction} className="contents">
            <AButton type="submit" variant="glow" className="lg:w-full"><LogOut aria-hidden className="size-4" /> Sign out</AButton>
          </form>
        </div>
      </aside>
      <main id="main" className="min-w-0 px-4 py-8 sm:px-8 lg:px-12 lg:py-12">{children}</main>
    </div>
  );
}
