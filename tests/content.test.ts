import { describe, expect, it } from "vitest";
import { association, visibleCommittee } from "@/config/association";
import {
  opportunityCategories,
  publicationTypes,
  resourceCategories,
  sampleAnnouncements,
  sampleEvents,
  sampleOpportunities,
  samplePublications,
  sampleResources,
} from "@/config/sample-content";
import { dateParts, formatEventDate } from "@/lib/utils/date";

const lists = {
  events: sampleEvents,
  announcements: sampleAnnouncements,
  resources: sampleResources,
  publications: samplePublications,
  opportunities: sampleOpportunities,
};

describe("sample content", () => {
  it.each(Object.entries(lists))("%s are all flagged sample and have unique slugs", (_name, items) => {
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.sample === true)).toBe(true);
    const slugs = items.map((i) => i.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("every category has at least one item and none is orphaned", () => {
    for (const c of resourceCategories) expect(sampleResources.some((r) => r.category === c.id)).toBe(true);
    for (const t of publicationTypes) expect(samplePublications.some((p) => p.type === t.id)).toBe(true);
    for (const c of opportunityCategories) expect(sampleOpportunities.some((o) => o.category === c.id)).toBe(true);
    const resIds: string[] = resourceCategories.map((c) => c.id);
    expect(sampleResources.every((r) => resIds.includes(r.category))).toBe(true);
  });

  it("has both upcoming and past events", () => {
    expect(sampleEvents.some((e) => e.status === "upcoming")).toBe(true);
    expect(sampleEvents.some((e) => e.status === "past")).toBe(true);
  });
});

describe("official association content", () => {
  it("has the four supplied core values", () => {
    expect([...association.values]).toEqual(["Integrity", "Discipline", "Honesty", "Teamwork"]);
  });
  it("has mission and vision text", () => {
    expect(association.mission.length).toBeGreaterThan(20);
    expect(association.vision.length).toBeGreaterThan(20);
  });
});

describe("executive committee privacy", () => {
  it("hides every name by default (consent not yet confirmed)", () => {
    const committee = visibleCommittee();
    expect(committee).toHaveLength(5);
    expect(committee.every((m) => m.name === null)).toBe(true);
  });
  it("shows names only when publication is explicitly enabled", () => {
    const shown = visibleCommittee(true);
    expect(shown.find((m) => m.title === "Chairperson")?.name).toBe("Brian Angwenyi");
    expect(shown.find((m) => m.title === "Membership Coordinator")?.name).toBeNull();
  });
});

describe("date helpers", () => {
  it("formats in Nairobi time", () => {
    // 14:00 +03:00 must display as 14:00 (Nairobi, 24-hour), not shifted to UTC (11:00)
    expect(formatEventDate("2026-12-04T14:00:00+03:00")).toMatch(/4 December 2026/);
    expect(formatEventDate("2026-12-04T14:00:00+03:00")).toMatch(/14:00/);
  });
  it("splits day and month", () => {
    expect(dateParts("2026-12-04T14:00:00+03:00")).toEqual({ day: "4", month: "Dec" });
  });
});
