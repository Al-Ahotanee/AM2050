/* AM2050 — Field Ledger Modernism: KPI blocks are connected ledger cells, with color reserved for operational meaning. */
import { ReactNode } from "react";

export function MetricCard({ eyebrow, value, detail, icon, tone = "green" }: { eyebrow: string; value: string; detail: string; icon: ReactNode; tone?: "green" | "ochre" | "blue" | "red" }) {
  const toneMap = {
    green: "border-[#167a4c] bg-[#e7f4eb] text-[#167a4c]",
    ochre: "border-[#c88b25] bg-[#fbf2df] text-[#b27514]",
    blue: "border-[#234c64] bg-[#e8f0f4] text-[#234c64]",
    red: "border-[#ae3f32] bg-[#f9e8e5] text-[#ae3f32]",
  };
  return <section className="min-w-0 border-t-2 border-transparent px-4 py-4 sm:px-5"><div className="flex items-start justify-between gap-3"><div><p className="coordinate-label">{eyebrow}</p><p className="mt-2 font-display text-2xl font-semibold tracking-[-0.045em] text-[#123148] sm:text-[1.7rem]">{value}</p></div><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${toneMap[tone]}`}>{icon}</div></div><p className="mt-3 border-t border-[#e0e7e1] pt-2.5 text-sm leading-5 text-[#57707f]">{detail}</p></section>;
}
