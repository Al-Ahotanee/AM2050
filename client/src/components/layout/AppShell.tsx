/* AM2050 — Field Ledger Modernism: authenticated operations are nationwide by design; account scopes control only the records shown. */
import { Link, useLocation } from "wouter";
import { Bell, LogOut, Menu, X } from "lucide-react";
import { ReactNode, useState } from "react";
import { LogoMark } from "@/components/brand/LogoMark";
import { canAccessModule, modules, roleLabels } from "@/lib/access";
import { AuthUser } from "@/contexts/AuthContext";

type AppShellProps = { children: ReactNode; user: AuthUser; pendingSync: number; onLogout: () => Promise<void> };

export function AppShell({ children, user, pendingSync, onLogout }: AppShellProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);
  const accessibleModules = modules.filter((module) => canAccessModule(user.role, module));
  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "AM";

  const rail = (
    <aside className="flex h-full w-[17.5rem] shrink-0 flex-col bg-[#123148] text-[#f7f4ec] shadow-[12px_0_36px_rgba(18,49,72,0.12)]">
      <div className="flex h-[5.15rem] items-center justify-between border-b border-white/10 px-5">
        <Link href="/workspace" onClick={closeMobile} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-[0.8rem] bg-[#f8f6ef] shadow-sm"><LogoMark size={30} /></span><span><span className="block font-display text-sm font-semibold tracking-[-0.03em] text-white">AM2050</span><span className="block font-mono text-[0.6rem] font-medium tracking-[0.13em] text-[#9cc8ae]">AREWA MISSION</span></span></Link>
        <button aria-label="Close menu" onClick={closeMobile} className="grid h-9 w-9 place-items-center rounded-md text-white/80 hover:bg-white/10 lg:hidden"><X size={19} /></button>
      </div>
      <nav aria-label="Main navigation" className="flex-1 overflow-y-auto border-y border-white/10 px-3 py-4"><p className="px-2 pb-2 font-mono text-[0.59rem] font-medium uppercase tracking-[0.14em] text-[#9cc8ae]">School workspace</p><div className="space-y-1">{accessibleModules.map((module) => { const active = location === module.path || (module.path !== "/workspace" && location.startsWith(`${module.path}/`)); const Icon = module.icon; return <Link key={module.key} href={module.path} onClick={closeMobile} className={`group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${active ? "bg-[#e7f4eb] font-semibold text-[#123148]" : "text-[#dce7e1] hover:bg-white/10 hover:text-white"}`}><Icon size={18} strokeWidth={active ? 2.3 : 1.85} /><span>{module.label}</span></Link>; })}</div></nav>
    </aside>
  );

  return <div className="min-h-screen bg-[#fbfaf6]"><div className="fixed inset-y-0 left-0 z-40 hidden lg:block">{rail}</div>{mobileOpen && <div className="fixed inset-0 z-50 bg-[#082236]/45 backdrop-blur-[1px] lg:hidden" onClick={closeMobile}><div className="h-full" onClick={(event) => event.stopPropagation()}>{rail}</div></div>}<main className="min-h-screen lg:pl-[17.5rem]"><header className="sticky top-0 z-30 flex h-[5.15rem] items-center justify-between border-b border-[#d8e0da] bg-[#fbfaf6]/95 px-4 backdrop-blur-md sm:px-6 lg:px-8"><div className="flex items-center gap-3"><button aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="grid h-10 w-10 place-items-center rounded-md border border-[#d8e0da] bg-white text-[#123148] lg:hidden"><Menu size={20} /></button><Link href="/workspace" className="hidden items-center gap-2.5 border-r border-[#d8e0da] pr-5 xl:flex"><span className="grid h-9 w-9 place-items-center rounded-lg border border-[#d8e0da] bg-white"><LogoMark size={27} /></span><span><span className="block font-display text-sm font-semibold tracking-[0.13em] text-[#123148]">AM2050</span><span className="mt-0.5 block font-mono text-[0.54rem] font-medium tracking-[0.13em] text-[#167a4c]">AREWA MISSION · 2050</span></span><span className="ml-1 border-l border-[#d8e0da] pl-3 font-mono text-[0.57rem] uppercase tracking-[0.09em] text-[#657c87]">NIGERIA / FIELD OPERATIONS</span></Link><div className="sm:hidden"><p className="font-display text-sm font-semibold tracking-[0.1em] text-[#123148]">AM2050</p><p className="coordinate-label">Nationwide field platform</p></div></div><div className="flex items-center gap-2 sm:gap-3"><div className={`hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold md:flex ${pendingSync > 0 ? "border-[#ead3a3] bg-[#fbf2df] text-[#815813]" : "border-[#b9dcc3] bg-[#e7f4eb] text-[#0e5a38]"}`}><span className={`status-dot ${pendingSync > 0 ? "bg-[#c88b25]" : "bg-[#167a4c]"}`} /> {pendingSync} pending sync</div><span aria-label="Notifications are available through the compliance and follow-up registers" className="grid h-10 w-10 place-items-center rounded-md border border-[#d8e0da] bg-white text-[#38566a]"><Bell size={18} /></span><div className="flex items-center gap-2 rounded-md border border-[#d8e0da] bg-white px-2 py-1.5 shadow-sm"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#123148] font-display text-xs font-semibold text-white">{initials}</span><span className="hidden min-w-0 sm:block"><span className="block max-w-28 truncate text-xs font-semibold text-[#123148]">{user.name}</span><span className="block font-mono text-[0.57rem] uppercase tracking-[0.08em] text-[#69808e]">{roleLabels[user.role]}</span></span><button aria-label="Sign out" onClick={() => void onLogout()} className="grid h-7 w-7 place-items-center text-[#69808e] hover:text-[#ae3f32]"><LogOut size={16} /></button></div></div></header>{children}</main></div>;
}
