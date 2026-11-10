import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/section";

export default function NotFound() {
  return (
    <PublicShell>
      <Section eyebrow="Error 404" title="This page could not be found" description="The page may have moved, or the address may be mistyped." className="min-h-[50vh]">
        <Button href="/">Back to home</Button>
      </Section>
    </PublicShell>
  );
}
