import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function ConnectTabs({ active }: { active: "discussions" | "people" }) {
  const tabs = [{ id: "discussions", href: "/alumni/connect", label: "Discussions" }, { id: "people", href: "/alumni/connect/people", label: "Meet alumni" }] as const;
  return (
    <nav aria-label="Alumni Connect" className="mb-8 flex w-full max-w-full gap-1 overflow-x-auto rounded-full sm:inline-flex sm:w-auto bg-brand-50 p-1 ring-1 ring-inset ring-brand-200">
      {tabs.map((t) => (
        <Link key={t.id} href={t.href} aria-current={t.id === active ? "page" : undefined} className={cn("min-h-10 flex-1 whitespace-nowrap rounded-full px-5 py-2 text-center text-sm font-semibold transition sm:flex-none", t.id === active ? "bg-white text-brand-900 shadow" : "text-brand-800 hover:bg-white/60")}>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
