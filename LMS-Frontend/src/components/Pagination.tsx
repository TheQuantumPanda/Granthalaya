interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  busy?: boolean;
  onPage: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, busy = false, onPage }: PaginationProps) {
  return <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 p-4 border-t border-slate-100 text-sm">
    <button type="button" disabled={busy || page <= 1} onClick={() => onPage(page - 1)}
      className="border rounded-xl px-3 py-2 disabled:opacity-40">Previous</button>
    <span aria-live="polite">Page {page} of {Math.max(1, totalPages)} · {totalItems} records</span>
    <button type="button" disabled={busy || page >= totalPages} onClick={() => onPage(page + 1)}
      className="border rounded-xl px-3 py-2 disabled:opacity-40">Next</button>
  </nav>;
}
