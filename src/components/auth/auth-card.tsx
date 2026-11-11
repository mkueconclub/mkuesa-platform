import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";

export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="bg-ivory py-14 sm:py-20">
      <Container className="max-w-md">
        <Card className="p-8">
          <h1 className="text-3xl text-brand-900">{title}</h1>
          {description && <p className="mt-2 text-muted">{description}</p>}
          <div className="mt-6">{children}</div>
        </Card>
      </Container>
    </div>
  );
}
