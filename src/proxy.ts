import { NextResponse } from "next/server";

// Next.js 16 "proxy" (formerly middleware).
// Phase 3 adds Supabase session refresh and coarse route gating here.
// This is a UX convenience only: real authorisation is enforced by Row Level
// Security and by checks inside every Server Action.
export function proxy() {
  return NextResponse.next();
}

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] };
