import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 "proxy" (formerly middleware): keeps the Supabase session fresh.
// Only routes that touch authentication are matched, so public pages stay fast.
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Safety net: if Supabase sends an email link to the home page (for example because the redirect URL is not
  // on the allow-list, so it falls back to the Site URL), forward it to the confirm route instead of
  // silently landing on the landing page.
  if (pathname === "/") {
    if (searchParams.has("code") || searchParams.has("token_hash") || searchParams.has("error_code")) {
      const target = request.nextUrl.clone();
      target.pathname = "/auth/confirm";
      return NextResponse.redirect(target);
    }
    return NextResponse.next();
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/admin/:path*", "/login", "/register", "/reset-password/:path*", "/auth/:path*"],
};
