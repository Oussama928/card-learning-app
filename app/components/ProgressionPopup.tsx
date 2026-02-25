"use client";

import React from "react";
import type { ProgressionPopupProps } from "@/types";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";

export default function ProgressionPopup({
  title,
  message,
  metadata,
  onClose,
}: ProgressionPopupProps) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
      <Card className="w-full max-w-md border-primary/30 shadow-2xl shadow-primary/10 bg-gradient-to-br from-background to-muted">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-primary">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-foreground/85">
            {message}
          </p>

          {metadata?.tierName && (
            <p className="mt-2 text-xs text-muted-foreground">
              New tier: <span className="font-semibold text-foreground">{metadata.tierName}</span>
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            type="button"
            onClick={onClose}
            className="w-full"
            variant="outline"
          >
            Continue
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
