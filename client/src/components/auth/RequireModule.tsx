/* AM2050 — Field Ledger Modernism: module visibility and direct-route access use the same permission source of truth. */
import { ReactNode } from "react";
import { LockKeyhole } from "lucide-react";
import { Link } from "wouter";
import { canAccessModule, modules, Role } from "@/lib/access";

export function RequireModule({ role, moduleKey, children }: { role: Role; moduleKey: string; children: ReactNode }) {
  const module = modules.find((item) => item.key === moduleKey);
  if (module && canAccessModule(role, module)) return <>{children}</>;
  return <main className="paper-grain grid min-h-[calc(100vh-5.15rem)] place-items-center px-4 py-8 sm:px-6 lg:px-8"><section className="max-w-lg border border-[#d8e0da] bg-white p-6 shadow-[0_8px_28px_rgba(18,49,72,0.045)] sm:p-8"><LockKeyhole className="text-[#ae3f32]" size={32} /><p className="coordinate-label mt-6">ACCESS RULE APPLIED</p><h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.05em] text-[#123148]">This workspace is not available for your role.</h1><p className="mt-3 text-[0.98rem] leading-6 text-[#57707f]">The application has blocked direct access as well as sidebar navigation. The PHP API must enforce this same rule with a scope-filtered request.</p><Link href="/workspace" className="action-press mt-6 inline-flex rounded-md border border-[#b9c9c0] bg-white px-4 py-2.5 text-sm font-semibold text-[#234c64] hover:border-[#167a4c]">Return to dashboard</Link></section></main>;
}
