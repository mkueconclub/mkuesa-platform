import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 "proxy" (formerly middleware): keeps the Supabase session fresh.
// Only routes that touch authentication are matched, so public pages stay fast.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/login", "/register", "/reset-password/:path*", "/auth/:path*"],
};
