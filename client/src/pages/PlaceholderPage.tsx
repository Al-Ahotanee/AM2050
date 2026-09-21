/* AM2050 — Field Ledger Modernism: unimplemented spaces remain honest, useful hand-offs rather than dead ends. */
import { Link } from "wouter";
import { ArrowLeft, Construction } from "lucide-react";

export default function PlaceholderPage({ title, detail }: { title: string; detail: string }) {
  return <main className="paper-grain min-h-[calc(100vh-5.15rem)] px-4 py-8 sm:px-6 lg:px-8"><section className="mx-auto max-w-3xl border border-[#d8e0da] bg-white p-6 shadow-[0_8px_28px_rgba(18,49,72,0.045)] sm:p-8"><p className="coordinate-label">AM2050 / INCREMENTAL DELIVERY</p><Construction className="mt-7 text-[#c88b25]" size={34} /><h1 className="mt-4 font-display text-2xl font-semibold tracking-[-0.05em] text-[#123148]">{title}</h1><p className="mt-3 max-w-xl text-[0.98rem] leading-6 text-[#57707f]">{detail}</p><p className="mt-6 border-l-2 border-[#167a4c] bg-[#f4f8f5] px-4 py-3 text-sm leading-5 text-[#38566a]">This area is already restricted by the current demonstration role. The backend scope filter and API contract will enforce the same rule independently.</p><Link href="/" className="action-press mt-7 inline-flex items-center gap-2 rounded-md border border-[#b9c9c0] bg-white px-4 py-2.5 text-sm font-semibold text-[#234c64] hover:border-[#167a4c]"><ArrowLeft size={16} /> Back to dashboard</Link></section></main>;
}
