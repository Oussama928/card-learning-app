"use client";

import React from "react";
import Link from "next/link";
import type { SkillTreeNodeDTO } from "@/types";

interface SkillTreeNodeCardProps {
  node: SkillTreeNodeDTO;
  onPreview: (node: SkillTreeNodeDTO) => void;
}

const statusStyles: Record<SkillTreeNodeDTO["status"], string> = {
  locked: "border-slate-700 bg-slate-900/40 text-slate-400",
  unlocked: "border-cyan-400/60 bg-cyan-500/10 text-cyan-100 animate-pulse",
  completed: "border-emerald-400/60 bg-emerald-500/10 text-emerald-100",
};

export default function SkillTreeNodeCard({ node, onPreview }: SkillTreeNodeCardProps) {
  const isLocked = node.status === "locked";

  return (
    <div
      className={`rounded-lg border p-3 shadow-md transition ${statusStyles[node.status]}`}
      onClick={() => onPreview(node)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onPreview(node);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{node.title}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-slate-300">{node.difficulty}</p>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs">
          {node.xpReward} XP
        </span>
      </div>

      <p className="mt-2 line-clamp-2 text-xs text-slate-300">
        {node.description || "Complete the requirements to unlock."}
      </p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full bg-slate-800 px-2 py-0.5">{node.status}</span>
        {node.prerequisites.length > 0 ? (
          <span className="rounded-full bg-slate-800 px-2 py-0.5">
            {node.prerequisites.length} prereq
          </span>
        ) : (
          <span className="rounded-full bg-slate-800 px-2 py-0.5">Start node</span>
        )}
      </div>

      {node.cardId && !isLocked ? (
        <Link
          href={`/learning/${node.cardId}`}
          className="mt-3 inline-block text-xs font-semibold text-cyan-200 hover:text-cyan-100"
        >
          Open card →
        </Link>
      ) : (
        <p className="mt-3 text-xs text-slate-500">Locked until prerequisites complete</p>
      )}
    </div>
  );
}
