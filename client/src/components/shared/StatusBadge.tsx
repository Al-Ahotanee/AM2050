/* AM2050 — Field Ledger Modernism: compact, legible operational states with color plus clear wording. */
type StatusTone = "success" | "attention" | "neutral" | "danger" | "info";

const styles: Record<StatusTone, string> = {
  success: "bg-[#e7f4eb] text-[#0e5a38] border-[#b9dcc3]",
  attention: "bg-[#fbf2df] text-[#815813] border-[#ead3a3]",
  neutral: "bg-[#f0f3f2] text-[#49606e] border-[#d8e0da]",
  danger: "bg-[#f9e8e5] text-[#8d3027] border-[#e8c4be]",
  info: "bg-[#e8f0f4] text-[#234c64] border-[#c4d5df]",
};

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}>{label}</span>;
}
