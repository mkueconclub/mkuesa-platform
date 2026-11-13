"use client";

import { PortalNav } from "@/components/layout/portal-nav";
import type { AdminNavItem } from "@/lib/auth/permissions";

/** Compact menu on phones and tablets, sidebar from lg. The overview link only matches its own page. */
export function AdminNav({ items }: { items: AdminNavItem[] }) {
  return <PortalNav label="Administration" items={items.map((i) => ({ ...i, exact: i.href === "/admin" }))} />;
}
