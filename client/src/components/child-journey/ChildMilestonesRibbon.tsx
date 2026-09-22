/* AM2050 — Field Ledger Modernism: Visual longitudinal child milestones ribbon */
import { useMemo } from "react";
import { CheckCircle2, Clock, AlertTriangle, Circle, BookOpen, UserCheck, Award, HeartHandshake } from "lucide-react";

export type MilestoneStep = {
  id: "registration" | "enrollment" | "welfare" | "progression";
  title: string;
  subtitle: string;
  status: "completed" | "active" | "at_risk" | "pending";
  date?: string | null;
  detail?: string;
  familyFilter?: string;
};

type ChildMilestonesRibbonProps = {
  currentStage: string;
  schoolName: string | null;
  className: string | null;
  events: Array<{
    family: string;
    type: string;
    occurredAt: string;
    summary: string;
    details?: Record<string, unknown>;
  }>;
  selectedMilestone?: string | null;
  onSelectMilestone?: (family: string) => void;
};

export function ChildMilestonesRibbon({
  currentStage,
  schoolName,
  className,
  events,
  selectedMilestone,
  onSelectMilestone,
}: ChildMilestonesRibbonProps) {
  const milestones = useMemo<MilestoneStep[]>(() => {
    // 1. Registration
    const regEvent = events.find((e) => e.family === "registration" || e.type.includes("registered"));
    const regDate = regEvent ? new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(regEvent.occurredAt)) : null;

    // 2. Enrollment
    const enrollEvent = events.find((e) => e.family === "enrollment" || e.type.includes("enrolled"));
    const enrollDate = enrollEvent ? new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short", year: "numeric" }).format(new Date(enrollEvent.occurredAt)) : null;
    const isEnrolled = Boolean(schoolName || enrollEvent);

    // 3. Welfare & Attendance
    const attendanceEvents = events.filter((e) => e.family === "attendance");
    const supportEvents = events.filter((e) => e.family === "support");
    const hasAttendance = attendanceEvents.length > 0;
    const hasSupport = supportEvents.length > 0;
    const isDeceasedOrUntraceable = currentStage.includes("deceased") || currentStage.includes("untraceable") || currentStage.includes("relocated");

    let welfareStatus: MilestoneStep["status"] = "pending";
    let welfareDetail = "Awaiting regular attendance tracking";

    if (isDeceasedOrUntraceable) {
      welfareStatus = "at_risk";
      welfareDetail = "Record status flagged for caseworker follow-up";
    } else if (hasAttendance || hasSupport) {
      welfareStatus = "completed";
      welfareDetail = hasSupport ? "Active learning & CCT support disbursed" : "Active classroom attendance recorded";
    } else if (isEnrolled) {
      welfareStatus = "active";
      welfareDetail = "Enrolled — attendance sessions in progress";
    }

    // 4. Academic Progression
    const learningEvents = events.filter((e) => e.family === "learning");
    const transitionEvents = events.filter((e) => e.family === "transition");
    const hasGraduated = transitionEvents.some((e) => e.type.includes("graduated") || e.type.includes("completed"));
    const hasExams = learningEvents.length > 0;

    let progressionStatus: MilestoneStep["status"] = "pending";
    let progressionDetail = "End of term examination pending";

    if (hasGraduated) {
      progressionStatus = "completed";
      progressionDetail = "Formal graduation certificate issued";
    } else if (hasExams) {
      progressionStatus = "completed";
      progressionDetail = `${learningEvents.length} exam result${learningEvents.length === 1 ? "" : "s"} recorded`;
    } else if (isEnrolled) {
      progressionStatus = "active";
      progressionDetail = className ? `Currently attending ${className}` : "Attending classes";
    }

    return [
      {
        id: "registration",
        title: "1. Identification",
        subtitle: "Verified Registry",
        status: "completed",
        date: regDate,
        detail: "Household / Tsangaya record confirmed",
        familyFilter: "registration",
      },
      {
        id: "enrollment",
        title: "2. School Placement",
        subtitle: isEnrolled ? (schoolName ?? "School Placement") : "Awaiting Placement",
        status: isEnrolled ? "completed" : "active",
        date: enrollDate,
        detail: isEnrolled ? (className ? `Enrolled in ${className}` : "Headmaster placement signed") : "Pending formal school enrollment",
        familyFilter: "enrollment",
      },
      {
        id: "welfare",
        title: "3. Retention & Welfare",
        subtitle: "Attendance & CCT",
        status: welfareStatus,
        date: attendanceEvents[0]?.occurredAt ? new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "short" }).format(new Date(attendanceEvents[0].occurredAt)) : null,
        detail: welfareDetail,
        familyFilter: "attendance",
      },
      {
        id: "progression",
        title: "4. Progression",
        subtitle: "Academic Transition",
        status: progressionStatus,
        detail: progressionDetail,
        familyFilter: "learning",
      },
    ];
  }, [currentStage, schoolName, className, events]);

  const statusConfig = {
    completed: {
      border: "border-[#167a4c] bg-[#eaf4ed]",
      text: "text-[#0e5a38]",
      badge: "bg-[#167a4c] text-white",
      label: "Completed",
      icon: CheckCircle2,
    },
    active: {
      border: "border-[#1d5073] bg-[#eef4f8]",
      text: "text-[#123148]",
      badge: "bg-[#1d5073] text-white",
      label: "Current Stage",
      icon: Clock,
    },
    at_risk: {
      border: "border-[#ae3f32] bg-[#fdf2f1]",
      text: "text-[#ae3f32]",
      badge: "bg-[#ae3f32] text-white",
      label: "Needs Attention",
      icon: AlertTriangle,
    },
    pending: {
      border: "border-[#d8e0da] bg-[#fafbf9]",
      text: "text-[#718592]",
      badge: "bg-[#e5ebe7] text-[#57707f]",
      label: "Pending",
      icon: Circle,
    },
  };

  const getStepIcon = (id: MilestoneStep["id"]) => {
    switch (id) {
      case "registration":
        return UserCheck;
      case "enrollment":
        return BookOpen;
      case "welfare":
        return HeartHandshake;
      case "progression":
        return Award;
    }
  };

  return (
    <section className="overflow-hidden border border-[#cfd9d2] bg-white shadow-[0_8px_28px_rgba(18,49,72,0.045)]">
      <header className="flex flex-col gap-2 border-b border-[#cfd9d2] bg-[#fbfaf6] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-[#167a4c]" />
          <p className="coordinate-label text-[#123148]">LONGITUDINAL PATHWAY GATES</p>
        </div>
        <p className="text-xs text-[#57707f]">Click any milestone to isolate matching evidence events below</p>
      </header>

      <div className="grid divide-y divide-[#e2e8e4] sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
        {milestones.map((step) => {
          const cfg = statusConfig[step.status];
          const StepIcon = getStepIcon(step.id);
          const isSelected = selectedMilestone === step.familyFilter;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => step.familyFilter && onSelectMilestone?.(step.familyFilter)}
              className={`action-press flex flex-col justify-between p-4 text-left transition-all hover:bg-[#fafbf9] ${
                isSelected ? "ring-2 ring-inset ring-[#167a4c] bg-[#f4f9f5]" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-md bg-[#eef3ef] text-[#167a4c]">
                      <StepIcon size={16} />
                    </span>
                    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-[#123148]">
                      {step.title}
                    </span>
                  </div>
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[0.6rem] font-semibold uppercase ${cfg.badge}`}>
                    {cfg.label}
                  </span>
                </div>

                <p className="mt-3 truncate font-display text-sm font-semibold text-[#123148]">{step.subtitle}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#57707f]">{step.detail}</p>
              </div>

              {step.date && (
                <p className="mt-3 border-t border-[#edf2ee] pt-2 font-mono text-[0.62rem] text-[#718592]">
                  RECORDED: {step.date}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
