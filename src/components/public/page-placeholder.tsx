import { Badge } from "@/components/ui/badge";
import { Section } from "@/components/ui/section";

/** Temporary page body used until the real content is built in its phase. */
export function PagePlaceholder({ title, description, phase = "Phase 2" }: { title: string; description: string; phase?: string }) {
  return (
    <Section eyebrow="Mount Kenya University Economics Students Association" title={title} description={description} className="min-h-[50vh]">
      <Badge tone="accent">Placeholder: built in {phase}</Badge>
    </Section>
  );
}
