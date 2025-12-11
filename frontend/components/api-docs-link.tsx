"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ApiDocsLink() {
  return (
    <Link href="/api-docs" target="_blank">
      <Button variant="outline" size="sm" className="gap-2">
        <FileText className="h-4 w-4" />
        API Docs
      </Button>
    </Link>
  );
}
