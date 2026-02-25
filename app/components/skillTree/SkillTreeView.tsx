"use client";

import React from "react";
import { type SkillTreeDetailDTO, type SkillTreeNodeDTO } from "@/types";
import SkillTreeNodeCard from "./SkillTreeNodeCard";
import { useRouter } from "next/navigation";
import { X, Trophy, AlertCircle, BookOpen } from "lucide-react";
import { Badge } from "@/app/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

interface SkillTreeViewProps {
  tree: SkillTreeDetailDTO;
}

const GRID_X = 240;
const GRID_Y = 180;

export default function SkillTreeView({ tree }: SkillTreeViewProps) {
  const router = useRouter();
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
    <div className="space-y-6">
      {selectedNode && (
        <Card className="animate-in fade-in slide-in-from-top-4 duration-300 border-primary/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedNode(null)}
              className="h-8 w-8 rounded-full hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 p-6">
            <div className="flex-1 space-y-4">
               <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    {selectedNode.title}
                    <Badge variant={
                      selectedNode.status === 'completed' ? 'default' : 
                      selectedNode.status === 'unlocked' ? 'outline' : 'secondary'
                    }>
                      {selectedNode.status}
                    </Badge>
                  </h3>
                  <p className="mt-2 text-muted-foreground">{selectedNode.description || "Complete requirements to unlock."}</p>
               </div>

               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                  <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground font-medium uppercase">Difficulty</p>
                    <p className="font-semibold mt-1 capitalize">{selectedNode.difficulty}</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground font-medium uppercase">Reward</p>
                    <p className="font-semibold mt-1">{selectedNode.xpReward} XP</p>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg border border-border/50 col-span-2">
                    <p className="text-xs text-muted-foreground font-medium uppercase">Requirement</p>
                    <p className="font-semibold mt-1 text-sm">
                      {selectedNode.criteriaType === "xp" 
                        ? `${selectedNode.requiredXp || 0} XP needed`
                        : `${selectedNode.requiredMasteryPct || 100}% card mastery`
                      }
                    </p>
                  </div>
               </div>
            </div>
            
            <div className="w-full md:w-1/3 bg-muted/20 rounded-lg p-4 border border-dashed border-border flex flex-col justify-center items-center text-center space-y-3">
              {selectedNode.status === 'locked' ? (
                 <>
                   <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                     <AlertCircle className="h-5 w-5 text-muted-foreground" />
                   </div>
                   <div className="text-sm">
                      <p className="font-medium">Locked</p>
                      {selectedNode.prerequisites.length > 0 ? (
                        <p className="text-muted-foreground text-xs mt-1">
                          Prerequisites: {selectedNode.prerequisites.join(", ")}
                        </p>
                      ) : (
                        <p className="text-muted-foreground text-xs mt-1">Start form a previous node.</p>
                      )}
                   </div>
                 </>
              ) : (
                 <>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <Button variant="default" className="w-full" onClick={() => router.push(`/learning/${selectedNode.cardId}`)}>
                        Start Learning
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {selectedNode.status === 'completed' ? "Practice again to improve score" : "Begin this lesson"}
                      </p>
                    </div>
                 </>
              )}
            </div>
          </div>
        </Card>
      )}

      <div className="relative overflow-auto rounded-xl border bg-card shadow-inner p-8 custom-scrollbar">
        <div className="relative mx-auto" style={{ width, height, minHeight: 400 }}>
          <svg
            className="absolute inset-0 h-full w-full pointer-events-none"
            width={width}
            height={height}
          >
            {nodes.flatMap((node) =>
              node.children.map((childId) => {
                const child = nodeById.get(childId);
                if (!child) return null;
                const x1 = node.positionX * GRID_X + 90; // +90 accounts for ~half card width offset roughly?
                const y1 = node.positionY * GRID_Y + 90;
                const x2 = child.positionX * GRID_X + 90;
                const y2 = child.positionY * GRID_Y + 90;
                
                const isLocked = child.status === "locked";
                
                return (
                  <g key={`${node.id}-${childId}`}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      strokeWidth={2}
                      className={cn(
                        "transition-colors duration-500",
                        isLocked ? "stroke-muted-foreground/20" : "stroke-primary/40"
                      )}
                      strokeDasharray={isLocked ? "6 6" : undefined}
                    />
                  </g>
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
                width: 180, // Matches width constraint somewhat
                zIndex: 10
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
