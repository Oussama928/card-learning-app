"use client";

import React from "react";
import type { ProgressionPopupProps } from "@/types";

export default function ProgressionPopup({
  title,
  message,
  metadata,
  onClose,
}: ProgressionPopupProps) {
  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div
        className="w-full max-w-md rounded-xl p-6"
        style={{
          background: "linear-gradient(145deg, #1e2b3a 0%, #2a3f54 100%)",
          border: "1px solid rgba(127,202,201,0.35)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
        }}
      >
        <h3 className="text-xl font-semibold" style={{ color: "#7fcac9" }}>
          {title}
        </h3>
        <p className="mt-3 text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
          {message}
        </p>

        {metadata?.tierName && (
          <p className="mt-2 text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
            New tier: {metadata.tierName}
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg py-2 text-sm font-medium"
          style={{
            background: "rgba(127,202,201,0.15)",
            border: "1px solid rgba(127,202,201,0.35)",
            color: "#7fcac9",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
