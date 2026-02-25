"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/app/components/ui/Badge";
import { cn } from "@/lib/utils";
import { Lock, CheckCircle2, Unlock, ArrowRight } from "lucide-react";
import type { SkillTreeNodeDTO } from "@/types";

interface SkillTreeNodeCardProps {
  node: SkillTreeNodeDTO;
  onPreview: (node: SkillTreeNodeDTO) => void;
}

const statusStyles : Record<string, string> = {
  locked: "border-muted bg-card opacity-70",
  unlocked: "border-primary/50 bg-primary/5 shadow-md hover:border-primary",
  completed: "border-green-500/30 bg-green-500/5",
};

export default function SkillTreeNodeCard({ node, onPreview }: SkillTreeNodeCardProps) {
  const isLocked = node.status === "locked";
  const isCompleted = node.status === "completed";
  const isUnlocked = node.status === "unlocked";

  return (
    <div
      className={cn(
        "relative flex flex-col justify-between rounded-xl border p-4 shadow-sm transition-all cursor-pointer h-[180px]",
        statusStyles[node.status] || statusStyles.locked,
        !isLocked && "hover:shadow-lg hover:-translate-y-1"
      )}
      onClick={() => onPreview(node)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          onPreview(node);
        }
      }}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Badge variant={isCompleted ? "default" : isLocked ? "secondary" : "outline"} className={cn("text-[10px] h-5 px-1.5", isCompleted && "bg-green-600 hover:bg-green-700")}>
            {node.difficulty}
          </Badge>
          {isLocked && <Lock className="h-4 w-4 text-muted-foreground/50" />}
          {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />}
          {isUnlocked && <Unlock className="h-4 w-4 text-primary animate-pulse" />}
        </div>

        <div>
          <h4 className="font-semibold text-sm line-clamp-1 text-foreground" title={node.title}>
            {node.title}
          </h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {node.description}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
         <span className="text-xs font-mono text-muted-foreground">
           {node.xpReward} XP
         </span>
         
         {!isLocked && (
            <div className="bg-primary/10 p-1.5 rounded-full text-primary">
              <ArrowRight className="h-3 w-3" />
            </div>
         )}
      </div>
    </div>
  );
}
