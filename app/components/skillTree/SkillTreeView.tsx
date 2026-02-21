"use client";

import React from "react";
import type { SkillTreeDetailDTO, SkillTreeNodeDTO } from "@/types";
import SkillTreeNodeCard from "./SkillTreeNodeCard";

interface SkillTreeViewProps {
  tree: SkillTreeDetailDTO;
}

const GRID_X = 240;
const GRID_Y = 180;

export default function SkillTreeView({ tree }: SkillTreeViewProps) {
  const [selectedNode, setSelectedNode] = React.useState<SkillTreeNodeDTO | null>(null);

  const nodes = tree.nodes;
  const maxX = Math.max(0, ...nodes.map((node) => node.positionX));
  const maxY = Math.max(0, ...nodes.map((node) => node.positionY));

  const width = (maxX + 1) * GRID_X;
  const height = (maxY + 1) * GRID_Y;

  const nodeById = React.useMemo(() => {
    const map = new Map<number, SkillTreeNodeDTO>();
    nodes.forEach((node) => map.set(node.id, node));
    return map;
  }, [nodes]);

  return (
    <div className="space-y-4">
      {selectedNode ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-cyan-100">{selectedNode.title}</h3>
              <p className="mt-1 text-sm text-slate-300">
                {selectedNode.description || "Complete the requirements to unlock this node."}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedNode(null)}
              className="text-xs font-semibold text-slate-300 hover:text-slate-100"
            >
              Close
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="rounded-lg bg-slate-900/70 p-3 text-xs">
              <p className="text-slate-400">Status</p>
              <p className="text-sm font-semibold text-slate-100">{selectedNode.status}</p>
            </div>
            <div className="rounded-lg bg-slate-900/70 p-3 text-xs">
              <p className="text-slate-400">Difficulty</p>
              <p className="text-sm font-semibold text-slate-100">{selectedNode.difficulty}</p>
            </div>
            <div className="rounded-lg bg-slate-900/70 p-3 text-xs">
              <p className="text-slate-400">XP Reward</p>
              <p className="text-sm font-semibold text-slate-100">{selectedNode.xpReward} XP</p>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-300">
            {selectedNode.criteriaType === "xp" ? (
              <p>Requires {selectedNode.requiredXp || 0} XP to complete.</p>
            ) : (
              <p>
                Requires {selectedNode.requiredMasteryPct || 100}% mastery on the card.
              </p>
            )}
            {selectedNode.prerequisites.length > 0 ? (
              <p className="mt-2 text-xs text-slate-400">
                Prerequisites: {selectedNode.prerequisites.join(", ")}
              </p>
            ) : (
              <p className="mt-2 text-xs text-slate-400">No prerequisites. Start here.</p>
            )}
          </div>
        </div>
      ) : null}

      <div className="relative overflow-auto rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="relative" style={{ width, height, minHeight: 240 }}>
          <svg
            className="absolute inset-0 h-full w-full"
            width={width}
            height={height}
          >
            {nodes.flatMap((node) =>
              node.children.map((childId) => {
                const child = nodeById.get(childId);
                if (!child) return null;
                const x1 = node.positionX * GRID_X + 90;
                const y1 = node.positionY * GRID_Y + 90;
                const x2 = child.positionX * GRID_X + 90;
                const y2 = child.positionY * GRID_Y + 90;
                return (
                  <line
                    key={`${node.id}-${childId}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#334155"
                    strokeWidth={2}
                    strokeDasharray={child.status === "locked" ? "4 4" : undefined}
                  />
                );
              })
            )}
          </svg>

          {nodes.map((node) => (
            <div
              key={node.id}
              style={{
                position: "absolute",
                left: node.positionX * GRID_X,
                top: node.positionY * GRID_Y,
                width: 200,
              }}
            >
              <SkillTreeNodeCard node={node} onPreview={setSelectedNode} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
