import { BookOpen, Briefcase, GraduationCap } from "lucide-react";

const bars = [38, 58, 52, 80, 74, 108, 132];

/** Decorative hero illustration: a rising economic chart with three floating "connection" chips. */
export function HeroVisual() {
  return (
    <div aria-hidden className="relative hidden w-full max-w-md shrink-0 lg:block xl:max-w-lg 2xl:max-w-2xl">
      <div className="relative rounded-3xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl shadow-black/30 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-200">Think tank in the making</span>
          <span className="flex gap-1.5">
            <span className="size-2 rounded-full bg-accent-400" />
            <span className="size-2 rounded-full bg-brand-300" />
            <span className="size-2 rounded-full bg-brand-500" />
          </span>
        </div>

        <svg viewBox="0 0 320 170" className="mt-6 w-full">
          {[40, 80, 120, 160].map((y) => (
            <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="white" strokeOpacity="0.08" />
          ))}
          {bars.map((h, i) => (
            <rect
              key={i}
              x={8 + i * 44}
              y={168 - h}
              width="28"
              height={h}
              rx="4"
              className={i === bars.length - 1 ? "bar-grow fill-accent-500" : "bar-grow fill-brand-400"}
              style={{ ["--delay" as string]: `${i * 90}ms`, transformBox: "fill-box" }}
              opacity={i === bars.length - 1 ? 1 : 0.35 + i * 0.08}
            />
          ))}
          <path
            d="M20 120 L64 96 L108 104 L152 66 L196 76 L240 38 L284 14"
            fill="none"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="line-draw stroke-accent-400"
          />
          <circle cx="284" cy="14" r="5" className="fill-accent-400" />
        </svg>
      </div>

      <Chip icon={GraduationCap} label="Faculty" className="-left-8 top-10" delay="0ms" />
      <Chip icon={Briefcase} label="Opportunities" className="-right-6 top-1/2" delay="1200ms" />
      <Chip icon={BookOpen} label="Research" className="-bottom-5 left-12" delay="2400ms" />
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
  className,
  delay,
}: {
  icon: typeof GraduationCap;
  label: string;
  className: string;
  delay: string;
}) {
  return (
    <span
      className={`animate-float absolute flex items-center gap-2 rounded-full border border-white/15 bg-brand-900/90 px-4 py-2 text-sm font-semibold text-white shadow-xl backdrop-blur ${className}`}
      style={{ ["--delay" as string]: delay }}
    >
      <Icon className="size-4 text-accent-400" />
      {label}
    </span>
  );
}
