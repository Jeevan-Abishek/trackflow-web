"use client";

import { Button } from "@/components/ui/button";
import { exportToCsv } from "@/lib/export";

export function ExportButton<T extends object>({ filename, rows }: { filename: string; rows: T[] }) {
  return (
    <Button size="sm" variant="secondary" onClick={() => exportToCsv(filename, rows)} disabled={rows.length === 0}>
      Export CSV
    </Button>
  );
}
