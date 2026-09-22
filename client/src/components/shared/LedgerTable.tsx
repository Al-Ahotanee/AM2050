/* AM2050 — Field Ledger Modernism: numbered operational registers preserve table semantics, count visibility, and page-size control. */
import { ReactNode, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileSearch } from "lucide-react";

export type LedgerColumn<T> = { key: string; label: string; cell: (row: T) => ReactNode; className?: string };

export type ServerPagination = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
};

export function LedgerTable<T extends { localId: string }>({
  rows,
  columns,
  emptyMessage = "No matching records found.",
  serverPagination,
}: {
  rows: T[];
  columns: LedgerColumn<T>[];
  emptyMessage?: string;
  serverPagination?: ServerPagination;
}) {
  const [localPage, setLocalPage] = useState(1);
  const [localPageSize, setLocalPageSize] = useState(10);

  const isServer = Boolean(serverPagination);
  const page = isServer ? serverPagination!.page : localPage;
  const pageSize = isServer ? serverPagination!.pageSize : localPageSize;
  const total = isServer ? serverPagination!.total : rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (!isServer && localPage > totalPages) setLocalPage(totalPages);
  }, [isServer, localPage, totalPages]);

  const visible = useMemo(() => {
    if (isServer) return rows;
    return rows.slice((page - 1) * pageSize, page * pageSize);
  }, [isServer, rows, page, pageSize]);

  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  const handlePageChange = (newPage: number) => {
    if (isServer) {
      serverPagination!.onPageChange(newPage);
    } else {
      setLocalPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    if (isServer) {
      serverPagination!.onPageSizeChange?.(newSize);
    } else {
      setLocalPageSize(newSize);
      setLocalPage(1);
    }
  };

  return <div className="overflow-hidden border border-[#d8e0da] bg-white shadow-[0_8px_28px_rgba(18,49,72,0.045)]">
    <div className="overflow-x-auto"><table className="min-w-full border-collapse text-left"><thead><tr className="border-b border-[#d8e0da] bg-[#f4f7f4]"><th scope="col" className="w-16 whitespace-nowrap px-4 py-3 text-left font-mono text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#617985]">S/N</th>{columns.map((column) => <th key={column.key} scope="col" className={`whitespace-nowrap px-4 py-3 text-left font-mono text-[0.62rem] font-semibold uppercase tracking-[0.1em] text-[#617985] ${column.className ?? ""}`}>{column.label}</th>)}</tr></thead><tbody>{visible.map((row,index) => <tr key={row.localId} className="border-b border-[#e6ebe7] last:border-0 transition-colors hover:bg-[#fbfcfa]"><td className="px-4 py-3.5 font-mono text-xs font-semibold text-[#617985]">{(page - 1) * pageSize + index + 1}</td>{columns.map((column) => <td key={column.key} className={`whitespace-nowrap px-4 py-3.5 text-sm text-[#38566a] ${column.className ?? ""}`}>{column.cell(row)}</td>)}</tr>)}</tbody></table></div>
    {rows.length === 0 ? <div className="grid min-h-52 place-items-center px-5 text-center"><div><FileSearch className="mx-auto text-[#8ba09a]" size={30} /><p className="mt-3 text-sm font-semibold text-[#38566a]">{emptyMessage}</p></div></div> : <footer className="flex flex-col gap-3 border-t border-[#d8e0da] bg-[#fafbf9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#667985]">Showing <span className="font-semibold text-[#234c64]">{first}–{last}</span> of <span className="font-semibold text-[#234c64]">{total}</span> records</p><div className="flex items-center gap-3"><label className="flex items-center gap-2 text-xs font-semibold text-[#667985]">Rows<select value={pageSize} onChange={(event) => handlePageSizeChange(Number(event.target.value))} className="field-input field-select !min-h-8 !w-[4.7rem] !py-1.5 text-xs"><option value={10}>10</option><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select></label><div className="flex items-center gap-1"><button aria-label="Previous page" onClick={() => handlePageChange(Math.max(1, page - 1))} disabled={page === 1} className="grid h-8 w-8 place-items-center rounded border border-[#c9d5cd] bg-white text-[#38566a] disabled:cursor-not-allowed disabled:opacity-35"><ChevronLeft size={16} /></button><span className="min-w-14 text-center font-mono text-[0.62rem] text-[#667985]">{page} / {totalPages}</span><button aria-label="Next page" onClick={() => handlePageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="grid h-8 w-8 place-items-center rounded border border-[#c9d5cd] bg-white text-[#38566a] disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight size={16} /></button></div></div></footer>}
  </div>;
}
