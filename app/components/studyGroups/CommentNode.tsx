"use client";

import React from "react";
import type { StudyGroupCommentNodeProps } from "@/types";

export default function CommentNode({ comment, canReply, onReply, canDelete, onDelete }: StudyGroupCommentNodeProps) {
  const [reply, setReply] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const submitReply = async () => {
    const value = reply.trim();
    if (!value || !canReply) return;

    try {
      setSending(true);
      await onReply(comment.id, value);
      setReply("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-cyan-100">
          {comment.authorName || "User"}
          <span className="ml-2 rounded-full bg-slate-700 px-2 py-0.5 text-xs uppercase text-slate-200">
            {comment.authorRole}
          </span>
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
          {canDelete && onDelete ? (
            <button
              type="button"
              onClick={() => void onDelete(comment.id)}
              className="text-xs font-semibold text-rose-300 hover:text-rose-200"
            >
              Delete
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-2 text-sm text-slate-200">{comment.content}</p>

      {canReply ? (
        <div className="mt-3 flex gap-2">
          <input
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write a reply..."
            className="w-full rounded-md border border-white/20 bg-slate-900/70 px-3 py-2 text-sm text-white placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={submitReply}
            disabled={sending}
            className="rounded-md bg-cyan-300 px-3 py-2 text-sm font-semibold text-slate-900 disabled:opacity-50"
          >
            Reply
          </button>
        </div>
      ) : null}

      {comment.replies.length > 0 ? (
        <div className="mt-3 space-y-2 pl-4 border-l border-white/10">
          {comment.replies.map((item) => (
            <CommentNode
              key={item.id}
              comment={item}
              canReply={canReply}
              onReply={onReply}
              canDelete={canDelete}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
