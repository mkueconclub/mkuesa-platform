import { describe, expect, it } from "vitest";
import { can, posterSignerRoles } from "@/lib/auth/permissions";
import { userRoles } from "@/lib/auth/roles";
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  cleanBody,
  fitPosterText,
  posterFileName,
  posterReference,
  signatureFontSize,
} from "@/lib/poster/layout";
import { renderAnnouncementPoster } from "@/lib/poster/poster";

describe("poster permissions", () => {
  it("lets only the Chairperson and Treasurer sign posters", () => {
    expect([...posterSignerRoles].sort()).toEqual(["chairperson", "treasurer"]);
    expect(userRoles.filter(can.downloadPoster).sort()).toEqual(["chairperson", "treasurer"]);
  });
});

describe("poster text fitting", () => {
  it("keeps short messages large and whole", () => {
    const fit = fitPosterText("Careers panel", "Registration is now open.\n\nSeats are limited.");
    expect(fit.truncated).toBe(false);
    expect(fit.bodySize).toBeGreaterThanOrEqual(34);
    expect(fit.body).toContain("Seats are limited.");
  });

  it("shrinks text as the message grows, but never below the readable minimum", () => {
    const sizes = [100, 700, 1500, 2500].map((n) => fitPosterText("Title", "word ".repeat(n / 5)).bodySize);
    for (let i = 1; i < sizes.length; i++) expect(sizes[i]).toBeLessThanOrEqual(sizes[i - 1]);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(20);
  });

  it("shortens a message too long for one page and says so", () => {
    const long = Array.from({ length: 60 }, (_, i) => `Sentence number ${i + 1} explains another detail.`).join(" ");
    const fit = fitPosterText("A long announcement", long);
    expect(fit.truncated).toBe(true);
    expect(fit.body.length).toBeLessThan(long.length);
    expect(long.startsWith(fit.body.replace(/…$/, ""))).toBe(true);
  });

  it("normalises line endings and blank lines", () => {
    expect(cleanBody("  a\r\n\r\n\r\n\r\nb  \n")).toBe("a\n\nb");
  });
});

describe("poster helpers", () => {
  it("builds a safe download file name", () => {
    expect(posterFileName("Careers Panel: Registration (2026)!")).toBe("mkuesa-announcement-careers-panel-registration-2026.png");
    expect(posterFileName("!!!")).toBe("mkuesa-announcement-poster.png");
    expect(posterFileName("a".repeat(300)).length).toBeLessThan(100);
  });

  it("derives a stable reference from the id and year (Nairobi time)", () => {
    const id = "a1b2c3d4-0000-4000-8000-000000000000";
    expect(posterReference(id, "2026-11-12T08:00:00Z")).toBe("MKUESA/ANN/2026/A1B2C3");
    expect(posterReference(id, "2026-12-31T22:00:00Z")).toBe("MKUESA/ANN/2027/A1B2C3"); // already 2027 in Nairobi
  });

  it("scales the signature down for long names", () => {
    expect(signatureFontSize("Brian Angwenyi")).toBeGreaterThan(signatureFontSize("Joy Wanjiru Masinde-Kamau"));
    expect(signatureFontSize("x".repeat(80))).toBeGreaterThanOrEqual(34);
  });
});

describe("poster rendering", () => {
  const base = { id: "a1b2c3d4-0000-4000-8000-000000000000", title: "Careers panel", body: "Registration is now open.", issuedAt: "2026-11-12T08:00:00Z" };

  for (const published of [true, false]) {
    it(`renders an A4 PNG (${published ? "published" : "draft"})`, async () => {
      const res = await renderAnnouncementPoster({ ...base, published, signer: { name: "Brian Angwenyi", title: "Chairperson" } });
      const bytes = Buffer.from(await res.arrayBuffer());
      expect([...bytes.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(bytes.readUInt32BE(16)).toBe(POSTER_WIDTH);
      expect(bytes.readUInt32BE(20)).toBe(POSTER_HEIGHT);
    }, 60_000);
  }
});
