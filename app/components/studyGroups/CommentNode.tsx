"use client";

import React from "react";
import type { StudyGroupCommentNodeProps } from "@/types";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Trash2, MessageSquare, CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Extended props to handle nesting level
interface CommentNodeExtendedProps extends StudyGroupCommentNodeProps {
  level?: number;
}

export default function CommentNode({ 
  comment, 
  canReply, 
  onReply, 
  canDelete, 
  onDelete,
  level = 0 
}: CommentNodeExtendedProps) {
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);
  const [isReplying, setIsReplying] = React.useState(false);

  const submitReply = async () => {
    const value = reply.trim();
    if (!value || !canReply) return;

    try {
      setSending(true);
      await onReply(comment.id, value);
      setReply("");
      setIsReplying(false);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", level > 0 && "ml-4 pl-4 border-l-2 border-border")}>
      <Card className="bg-card">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-foreground">
                {comment.authorName || "User"}
              </span>
              <Badge variant="secondary" className="text-xs py-0 h-5">
                {comment.authorRole}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {canReply && !isReplying && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setIsReplying(true)}
                >
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              
              {canDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => void onDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <p className="text-sm text-foreground/90 whitespace-pre-wrap">
            {comment.content}
          </p>

          {isReplying && (
            <div className="mt-3 flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
              <CornerDownRight className="h-4 w-4 text-muted-foreground mt-2" />
              <div className="flex-1 flex flex-col gap-2">
                <Input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write a reply..."
                  className="h-9 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitReply();
                    }
                    if (e.key === "Escape") {
                      setIsReplying(false);
                    }
                  }}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={submitReply}
                    disabled={sending || !reply.trim()}
                    className="h-8 text-xs"
                  >
                    {sending ? "..." : "Reply"}
                  </Button>
                  <Button
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsReplying(false)}
                    className="h-8 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-2 mt-1">
          {comment.replies.map((item) => (
            <CommentNode
              key={item.id}
              comment={item}
              canReply={canReply}
              onReply={onReply}
              canDelete={canDelete}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
