export type NavItem = { readonly label: string; readonly href: string };

export const siteConfig = {
  name: "MKUESA",
  fullName: "Mount Kenya University Economics Students Association",
  university: "Mount Kenya University",
  tagline: "Economists Unite",
  description:
    "The Mount Kenya University Economics Students Association: membership, events, learning resources, research and opportunities for economics and finance students.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  logo: "/logos/mkuesa-logo-original-400.jpg",
} as const;

/** National body MKUESA is a member of (listed in KESA's public member directory). */
export const affiliation = {
  name: "Kenya Economics Students Association",
  short: "KESA",
  url: "https://www.kesakenya.org/",
  // Save KESA's logo (https://www.kesakenya.org/pictures/logo.jpg) here. A "KESA" monogram shows until it exists.
  logo: "/logos/kesa-logo.jpg",
} as const;

export const mainNav: readonly NavItem[] = [
  { label: "About", href: "/about" },
  { label: "Membership", href: "/membership" },
  { label: "Events", href: "/events" },
  { label: "Learning Hub", href: "/learning-hub" },
  { label: "Research", href: "/research" },
  { label: "Opportunities", href: "/opportunities" },
  { label: "Alumni", href: "/alumni-network" },
  { label: "Contact", href: "/contact" },
];

export const memberActions = {
  login: { label: "Member login", href: "/login" },
  join: { label: "Join MKUESA", href: "/membership" },
} as const;

export const footerGroups: readonly { title: string; links: readonly NavItem[] }[] = [
  {
    title: "Association",
    links: [
      { label: "About", href: "/about" },
      { label: "Membership", href: "/membership" },
      { label: "Events", href: "/events" },
      { label: "Contact", href: "/contact" },
      { label: "Privacy notice", href: "/privacy" },
    ],
  },
  {
    title: "Learn and grow",
    links: [
      { label: "Learning Hub", href: "/learning-hub" },
      { label: "Research", href: "/research" },
      { label: "Opportunities", href: "/opportunities" },
    ],
  },
  {
    title: "Members",
    links: [
      { label: "Member login", href: "/login" },
      { label: "How to join", href: "/membership" },
      { label: "Alumni network", href: "/alumni-network" },
    ],
  },
];
