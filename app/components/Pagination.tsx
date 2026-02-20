"use client";

import React from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onPageChange,
  className,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={className ?? ""}>
      <div className="flex items-center justify-center gap-4">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(page - 1, 1))}
          className="rounded-md bg-slate-200 px-4 py-2 text-slate-900 disabled:opacity-40"
        >
          Previous
        </button>
        <span className="text-sm text-slate-700">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(Math.min(page + 1, totalPages))}
          className="rounded-md bg-slate-200 px-4 py-2 text-slate-900 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
};
