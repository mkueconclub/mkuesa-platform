"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Opens the browser's print dialog. "Save as PDF" in that dialog gives the member a PDF copy. */
export function PrintButton() {
  return (
    <Button type="button" onClick={() => window.print()}>
      <Printer aria-hidden className="mr-2 size-4" />
      Print or save as PDF
    </Button>
  );
}
