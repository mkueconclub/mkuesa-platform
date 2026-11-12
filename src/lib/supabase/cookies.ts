/**
 * Options for the Supabase session cookie, shared by the browser, server and proxy clients.
 * - maxAge: the session cookie lasts 400 days (the browser maximum), so people stay signed in between visits.
 *   The short-lived access token inside it is renewed automatically; signing out ends the session.
 * - secure: HTTPS-only in production (plain http://localhost still works in development).
 * - sameSite=lax: the cookie is not sent on cross-site POSTs, which blocks cross-site request forgery.
 * The cookie is readable by the browser client on purpose (that is how @supabase/ssr keeps the session fresh),
 * so the app must never render untrusted HTML. Tests enforce that.
 */
export const authCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 400,
};
