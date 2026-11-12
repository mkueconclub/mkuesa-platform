/** A certificate code is 32 lowercase hex characters. Returns the cleaned code, or null if it cannot be one. */
export function normalizeVerificationCode(input: string | null | undefined): string | null {
  const code = (input ?? "").trim().toLowerCase();
  return /^[0-9a-f]{32}$/.test(code) ? code : null;
}

/** Splits a code into groups of 8 so a person can read it aloud or compare it by eye. */
export const formatVerificationCode = (code: string): string => code.match(/.{1,8}/g)?.join(" ") ?? code;

export type VerifiedCertificate = {
  status: "valid" | "revoked";
  title: string;
  certificate_type: string;
  issued_at: string;
  holder: string;
  event_title: string | null;
};
