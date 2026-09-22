/* AM2050 — Field Ledger Modernism: Phonetic & Biometric Anti-Fraud Duplicate Warning Modal.
   Detects duplicate child registrations and CCT stipend fraud using Northern Nigerian name normalization
   (Muhammadu / Mamman / Moh'd, Abubakar / Garba) and geographic proximity. */

import { AlertTriangle, CheckCircle, ExternalLink, ShieldAlert, UserX, X } from "lucide-react";

export interface DuplicateMatch {
  id: string;
  child_unique_id: string;
  first_name: string;
  last_name: string;
  photo_url?: string | null;
  gender: string;
  estimated_age?: number | null;
  household_code?: string | null;
  parents?: string[];
  ward_name?: string | null;
  similarity_score: number;
  risk_level: "high" | "medium" | "low";
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onProceed: () => void;
  candidateName: string;
  matches: DuplicateMatch[];
}

export function DuplicateWarningModal({
  isOpen,
  onClose,
  onProceed,
  candidateName,
  matches,
}: Props) {
  if (!isOpen || matches.length === 0) return null;

  const highestRisk = matches.some((m) => m.risk_level === "high") ? "high" : "medium";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082236]/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border-2 border-[#c88b25] bg-white shadow-2xl">
        {/* Warning Banner */}
        <div className="flex items-start justify-between border-b border-[#e2eae5] bg-[#fdf8ed] p-5">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#c88b25] text-white shadow-sm">
              <ShieldAlert size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#c88b25] px-2 py-0.5 text-[10px] font-black text-white uppercase tracking-wider">
                  ANTI-FRAUD DUPLICATE DETECTOR
                </span>
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
                    highestRisk === "high"
                      ? "bg-[#fae9e7] text-[#96372d]"
                      : "bg-[#fbf2df] text-[#815813]"
                  }`}
                >
                  {highestRisk === "high" ? "HIGH RISK MATCH" : "MEDIUM RISK MATCH"}
                </span>
              </div>
              <h2 className="mt-1 font-display text-lg font-bold text-[#123148]">
                Potential Duplicate Child Record Detected
              </h2>
              <p className="mt-0.5 text-xs text-[#6d5b2b]">
                Registration candidate: <strong className="text-[#123148]">{candidateName}</strong> matches existing learner profile(s).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="action-press grid size-8 place-items-center rounded-lg border border-[#d8e0da] text-[#57707f] hover:bg-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Context */}
        <div className="border-b border-[#e2eae5] bg-[#fbfdfb] px-6 py-3 text-xs text-[#46616d]">
          <p>
            Under SUBEB & AM2050 Universal Basic Education guidelines, duplicate child registration results in disqualified Conditional Cash Transfer (CCT) stipends and audit rejections. Please verify whether the learner below is the same child.
          </p>
        </div>

        {/* Match Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[#617985]">
            Existing Record Matches ({matches.length})
          </p>

          {matches.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[#c7d2d6] bg-white p-4 shadow-sm transition-all hover:border-[#167a4c]"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* 3:4 Passport */}
                <div className="size-20 w-16 h-[85px] shrink-0 overflow-hidden rounded border border-[#123148] bg-[#eff5f1] flex items-center justify-center">
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={`${item.first_name} ${item.last_name}`}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="p-1 text-center text-[8px] font-bold text-[#718592]">
                      NO PHOTO
                    </div>
                  )}
                </div>

                {/* Match Information */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-bold text-[#123148]">
                      {item.first_name} {item.last_name}
                    </h3>
                    <span className="inline-flex items-center gap-1 rounded bg-[#eff5f1] px-2 py-0.5 font-mono text-[10px] font-black text-[#167a4c]">
                      {item.similarity_score}% PHONETIC MATCH
                    </span>
                  </div>

                  <p className="font-mono text-xs font-semibold text-[#167a4c]">
                    {item.child_unique_id}
                  </p>

                  <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#57707f]">
                    <div>
                      <span className="font-semibold text-[#123148]">Ward:</span> {item.ward_name || "Unassigned"}
                    </div>
                    <div>
                      <span className="font-semibold text-[#123148]">Age:</span> {item.estimated_age ? `${item.estimated_age} Yrs` : "N/A"} · {item.gender}
                    </div>
                    <div>
                      <span className="font-semibold text-[#123148]">Household:</span> {item.household_code || "None"}
                    </div>
                    <div>
                      <span className="font-semibold text-[#123148]">Registered:</span> {item.created_at ? item.created_at.slice(0, 10) : "N/A"}
                    </div>
                  </div>

                  {item.parents && item.parents.length > 0 && (
                    <p className="text-xs text-[#57707f] pt-1">
                      <span className="font-semibold text-[#123148]">Guardians:</span> {item.parents.join(" / ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e2eae5] bg-[#eff5f1]/60 p-4">
          <p className="text-xs text-[#57707f]">
            If this is a different child with a coincidental name, you may confirm and proceed.
          </p>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="action-press rounded-lg border border-[#c7d2d6] bg-white px-4 py-2 text-xs font-semibold text-[#123148] hover:bg-[#eff5f1]"
            >
              Cancel & Review Existing Child
            </button>
            <button
              onClick={onProceed}
              className="action-press inline-flex items-center gap-1.5 rounded-lg bg-[#c88b25] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#a5701a]"
            >
              <CheckCircle size={15} />
              Confirm Different Child (Proceed)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
