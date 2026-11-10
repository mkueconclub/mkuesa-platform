/**
 * OFFICIAL association content, supplied by the owner.
 * Wording lightly corrected for spelling/grammar; owner to confirm final text.
 * Anything not yet supplied is NOT invented here: pages show a "pending" notice.
 */
export const association = {
  mission:
    "To connect economics students with the faculty and working opportunities, in pursuit of extending economics education beyond the lecture room.",
  vision:
    "To be a think tank where students practice the knowledge acquired in class and solve relevant societal problems.",
  values: ["Integrity", "Discipline", "Honesty", "Teamwork"],
} as const;

export type CommitteeMember = { title: string; name: string | null };

/**
 * Executive names are only published with each officer's consent (Phase 0
 * decision). Set to true once all officers have confirmed in writing.
 */
export const showExecutiveNames = false;

const executiveCommittee: readonly CommitteeMember[] = [
  { title: "Chairperson", name: "Brian Angwenyi" },
  { title: "Vice Chairperson", name: "Seth Haguma" },
  { title: "Secretary", name: "Divinnah Mogeni" },
  { title: "Treasurer", name: "Joy Masinde" },
  { title: "Membership Coordinator", name: null }, // name not yet supplied
];

/** Returns the committee with names removed unless publication is approved. */
export function visibleCommittee(showNames: boolean = showExecutiveNames): CommitteeMember[] {
  return executiveCommittee.map((m) => ({ title: m.title, name: showNames ? m.name : null }));
}
