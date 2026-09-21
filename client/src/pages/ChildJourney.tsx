/* AM2050 — Field Ledger Modernism: a source-linked, role-scoped longitudinal record makes each child’s pathway visible without duplicating operational data. */
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { BookOpenCheck, CalendarDays, ChevronRight, ClipboardCheck, FileText, GraduationCap, HeartHandshake, Home, Loader2, MapPin, RefreshCw, Search, ShieldCheck, Sparkles, UserRound, WalletCards } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";

type JourneyChild = { id: string; child_unique_id: string; first_name: string; last_name: string; photo_url: string | null; gender: string; child_status: string; current_stage: string | null; next_action: string | null; last_event_at: string | null; school_name: string | null; class_name: string | null };
type JourneyEvent = { id: string; type: string; family: string; occurredAt: string; recordedAt: string; summary: string; details: Record<string, unknown>; sourceType: string; canOpenSource: boolean };
type Journey = { child: { id: string; registrationId: string; name: string; photoUrl: string | null; gender: string }; summary: { currentStage: string; nextAction: string; lastEventAt: string | null; schoolName: string | null; className: string | null }; events: JourneyEvent[]; nextCursor: string | null };

const families = ["all", "registration", "household", "enrollment", "attendance", "learning", "support", "referral", "transition"] as const;
const familyLabels: Record<(typeof families)[number], string> = { all: "All events", registration: "Registration", household: "Household", enrollment: "Enrollment", attendance: "Attendance", learning: "Learning", support: "Support", referral: "Referral", transition: "Transition" };
const sourcePaths: Record<string, string> = { child: "/children", enrollment: "/enrollments", attendance_period: "/attendance", result_period: "/learning-records", incentive: "/incentives", referral: "/out-of-school" };
const familyIcon: Record<string, typeof FileText> = { registration: UserRound, household: Home, enrollment: BookOpenCheck, attendance: ClipboardCheck, learning: GraduationCap, support: WalletCards, referral: MapPin, transition: ChevronRight };
const stageLabel = (stage: string) => ({ active_learning: "Active learning", awaiting_enrollment: "Awaiting enrollment", registered: "Registered", transition_relocated: "Transition: relocated", transition_untraceable: "Transition: untraceable", transition_deceased: "Record status update" }[stage] ?? stage.replaceAll("_", " "));
const readableDate = (value: string | null) => value ? new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Not recorded";

export default function ChildJourney() {
  const { user } = useAuth();
  const guardianView = user?.role === "guardian";
  const [children, setChildren] = useState<JourneyChild[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [journey, setJourney] = useState<Journey | null>(null);
  const [search, setSearch] = useState("");
  const [family, setFamily] = useState<(typeof families)[number]>("all");
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [loadingJourney, setLoadingJourney] = useState(false);

  const loadChildren = async (query = search) => {
    setLoadingChildren(true);
    const result = await apiClient.request<JourneyChild[]>(`/child-journey/children?limit=30${query.trim() ? `&search=${encodeURIComponent(query.trim())}` : ""}`);
    if (result.success) { setChildren(result.data); setSelectedId((previous) => previous && result.data.some((child) => child.id === previous) ? previous : result.data[0]?.id ?? null); }
    else toast.error(result.error);
    setLoadingChildren(false);
  };
  const loadJourney = async (childId: string, selectedFamily = family) => {
    setLoadingJourney(true);
    const types = selectedFamily === "all" ? "" : `?types=${selectedFamily}`;
    const result = await apiClient.request<Journey>(`/child-journey/children/${childId}${types}`);
    if (result.success) setJourney(result.data); else { setJourney(null); toast.error(result.error); }
    setLoadingJourney(false);
  };
  useEffect(() => { void loadChildren(""); }, []);
  useEffect(() => { if (selectedId) void loadJourney(selectedId); else setJourney(null); }, [selectedId, family]);
  const headline = guardianView ? "Your child’s journey" : "Child Journey";
  const helper = guardianView ? "A private record of your linked child’s education pathway, attendance, school progress, and confirmed support." : "Follow each authorised child’s path from registration to enrollment, learning, support, transition, and re-engagement.";
  const eventGroups = useMemo(() => journey?.events.reduce<Record<string, JourneyEvent[]>>((groups, event) => { const year = new Date(event.occurredAt).getFullYear().toString(); (groups[year] ??= []).push(event); return groups; }, {}) ?? {}, [journey]);

  return <main className="paper-grain min-h-[calc(100vh-5.15rem)] px-4 pb-10 pt-6 sm:px-6 lg:px-8"><section className="mx-auto max-w-[1440px]">
    <header className="flex flex-col gap-5 border-b border-[#cfd9d2] pb-5 lg:flex-row lg:items-end lg:justify-between"><div><p className="coordinate-label">LONGITUDINAL RECORD / 2050 PATHWAY</p><h1 className="mt-2 font-display text-3xl font-semibold tracking-[-.05em] text-[#123148]">{headline}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-[#57707f]">{helper}</p></div><button onClick={() => { void loadChildren(); if (selectedId) void loadJourney(selectedId); }} className="action-press inline-flex items-center justify-center gap-2 self-start rounded border border-[#b8c9c0] bg-white px-3 py-2 text-sm font-medium text-[#123148]"><RefreshCw size={16}/> Refresh record</button></header>
    <div className="mt-6 grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="border border-[#d5dfd8] bg-[#fbfaf6]"><div className="border-b border-[#d5dfd8] p-4"><p className="coordinate-label">AUTHORISED CHILDREN</p><div className="mt-3 flex items-center gap-2 border border-[#cfd9d2] bg-white px-3 py-2"><Search size={15} className="text-[#617985]"/><input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void loadChildren(); }} placeholder={guardianView ? "Find your child" : "Search child name or ID"} className="min-w-0 flex-1 bg-transparent text-sm outline-none"/></div></div>
        <div className="max-h-[58vh] overflow-y-auto p-2">{loadingChildren ? <div className="grid place-items-center py-12 text-[#617985]"><Loader2 className="animate-spin" size={22}/></div> : children.length === 0 ? <p className="p-4 text-sm leading-6 text-[#617985]">{guardianView ? "No child record is currently linked to your verified guardian phone." : "No authorised child record matches this search."}</p> : children.map((child) => <button key={child.id} onClick={() => setSelectedId(child.id)} className={`action-press mb-1 w-full border p-3 text-left ${child.id === selectedId ? "border-[#167a4c] bg-[#eaf4ed]" : "border-transparent hover:border-[#d5dfd8] hover:bg-white"}`}><div className="flex gap-3"><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden bg-[#e8eeea] text-[#6a7f88]">{child.photo_url ? <img src={child.photo_url} alt="" className="h-full w-full object-cover"/> : <UserRound size={18}/>}</div><div className="min-w-0"><p className="truncate text-sm font-semibold text-[#123148]">{child.first_name} {child.last_name}</p><p className="mt-1 truncate font-mono text-[10px] text-[#6a7f88]">{child.child_unique_id}</p><p className="mt-1 truncate text-xs text-[#57707f]">{child.current_stage ? stageLabel(child.current_stage) : "Registered"}</p></div></div></button>)}</div>
        {!guardianView && <div className="border-t border-[#d5dfd8] p-4 text-xs leading-5 text-[#617985]"><ShieldCheck size={15} className="mr-1 inline text-[#167a4c]"/>Results are limited to your current authorised programme, geography, school, or class scope.</div>}
      </aside>
      <section className="min-w-0">{!selectedId ? <div className="border border-dashed border-[#b9c9c0] bg-white p-10 text-center text-sm text-[#617985]">Select an authorised child to open their longitudinal journey.</div> : loadingJourney ? <div className="grid min-h-80 place-items-center border border-[#d5dfd8] bg-white text-[#617985]"><Loader2 className="animate-spin" size={26}/></div> : journey ? <>
        <article className="overflow-hidden border border-[#cfd9d2] bg-white"><div className="grid gap-0 lg:grid-cols-[auto_minmax(0,1fr)_minmax(260px,.8fr)]"><div className="grid min-h-32 w-full place-items-center bg-[#eef3ef] lg:w-36">{journey.child.photoUrl ? <img src={journey.child.photoUrl} alt={`${journey.child.name} record`} className="h-32 w-full object-cover"/> : <UserRound size={34} className="text-[#76907f]"/>}</div><div className="border-b border-[#d5dfd8] p-5 lg:border-b-0 lg:border-r"><p className="coordinate-label">CHILD JOURNEY / {journey.child.registrationId}</p><h2 className="mt-2 font-display text-2xl font-semibold tracking-[-.04em] text-[#123148]">{journey.child.name}</h2><p className="mt-2 text-sm text-[#57707f]">{journey.summary.schoolName ?? "No confirmed school placement"}{journey.summary.className ? ` · ${journey.summary.className}` : ""}</p></div><div className="bg-[#fbfaf6] p-5"><p className="coordinate-label">CURRENT PATHWAY</p><p className="mt-2 text-lg font-semibold text-[#167a4c]">{stageLabel(journey.summary.currentStage)}</p><p className="mt-2 text-sm leading-5 text-[#57707f]">{guardianView ? "Keep this record current by reporting any school or contact change to the field team." : journey.summary.nextAction}</p></div></div></article>
        <div className="mt-5 flex flex-wrap gap-2 border-b border-[#d5dfd8] pb-4">{families.map((item) => <button key={item} onClick={() => setFamily(item)} className={`action-press rounded-full border px-3 py-1.5 text-xs font-medium ${family === item ? "border-[#123148] bg-[#123148] text-white" : "border-[#c9d5cc] bg-white text-[#46616d]"}`}>{familyLabels[item]}</button>)}</div>
        <div className="mt-6 space-y-8">{Object.entries(eventGroups).map(([year, events]) => <section key={year} className="grid gap-4 md:grid-cols-[110px_minmax(0,1fr)]"><div><p className="font-mono text-sm font-semibold tracking-[.12em] text-[#167a4c]">{year}</p><p className="mt-1 text-xs text-[#718592]">{events.length} recorded event{events.length === 1 ? "" : "s"}</p></div><div className="relative border-l-2 border-[#d5dfd8] pl-5">{events.map((event) => { const Icon = familyIcon[event.family] ?? FileText; const sourcePath = sourcePaths[event.sourceType]; return <article key={event.id} className="relative mb-4 border border-[#d7e0da] bg-white p-4 shadow-[0_4px_18px_rgba(18,49,72,.04)] before:absolute before:-left-[1.84rem] before:top-5 before:h-3 before:w-3 before:rounded-full before:border-2 before:border-[#167a4c] before:bg-[#fbfaf6]"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div className="flex gap-3"><div className="grid h-9 w-9 shrink-0 place-items-center bg-[#eef3ef] text-[#167a4c]"><Icon size={17}/></div><div><p className="coordinate-label">{familyLabels[(event.family as keyof typeof familyLabels)] ?? "Journey event"} · {readableDate(event.occurredAt)}</p><p className="mt-1 text-sm leading-6 text-[#173948]">{event.summary}</p></div></div>{event.canOpenSource && sourcePath ? <Link href={sourcePath} className="action-press inline-flex h-8 items-center gap-1 self-start border border-[#c9d5cc] px-2 text-xs font-medium text-[#173948]">View source <ChevronRight size={14}/></Link> : null}</div></article>; })}</div></section>)}{journey.events.length === 0 ? <div className="border border-dashed border-[#c9d5cc] bg-white p-8 text-center text-sm text-[#617985]">No journey events match this filter yet.</div> : null}</div>
        <p className="mt-8 flex gap-2 border-t border-[#d5dfd8] pt-4 text-xs leading-5 text-[#718592]"><CalendarDays size={15} className="mt-0.5 shrink-0 text-[#167a4c]"/>{guardianView ? "This private timeline shows family-appropriate records for your linked child only. Internal staff notes, risk signals, and other families’ data are not shown." : "Every timeline event is linked to an AM2050 source record. The timeline supports review; it does not replace official registration, enrollment, attendance, or learning registers."}</p>
      </> : <div className="border border-dashed border-[#c9d5cc] bg-white p-10 text-center text-sm text-[#617985]">The Journey record could not be loaded.</div>}</section>
    </div>
  </section></main>;
}
