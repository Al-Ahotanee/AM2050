/* AM2050 — Field Ledger Modernism: Classroom Attendance Roll-Call Poster Modal.
   Generates a high-density, printable A4/A3 wall poster containing verified 3:4 learner photos
   and scannable QR tokens for swift, sub-2-minute morning assembly roll-calls. */

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download, Loader2, Printer, QrCode, X } from "lucide-react";
import { toast } from "sonner";

export interface PosterStudent {
  id: string;
  childCode: string;
  fullName: string;
  photoUrl?: string | null;
  attendanceToken?: string | null;
  gender?: string | null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  schoolName: string;
  className: string;
  academicSession?: string;
  students: PosterStudent[];
}

interface StudentQrMap {
  [childId: string]: string; // dataUrl
}

export function ClassroomAttendancePosterModal({
  isOpen,
  onClose,
  schoolName,
  className,
  academicSession = "2026/2027 Academic Session",
  students,
}: Props) {
  const [qrMap, setQrMap] = useState<StudentQrMap>({});
  const [loadingQr, setLoadingQr] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen || students.length === 0) {
      setLoadingQr(false);
      return;
    }

    setLoadingQr(true);
    let isMounted = true;

    async function generateAllQrs() {
      const map: StudentQrMap = {};
      for (const student of students) {
        const token = student.attendanceToken || student.childCode || student.id;
        const val = `AM2050:${token}`;
        try {
          map[student.id] = await QRCode.toDataURL(val, {
            width: 180,
            margin: 1,
            errorCorrectionLevel: "M",
            color: { dark: "#123148", light: "#ffffff" },
          });
        } catch {
          map[student.id] = "";
        }
      }
      if (isMounted) {
        setQrMap(map);
        setLoadingQr(false);
      }
    }

    void generateAllQrs();

    return () => {
      isMounted = false;
    };
  }, [isOpen, students]);

  if (!isOpen) return null;

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!printWindow) {
      toast.error("Please allow pop-ups to print the classroom poster.");
      return;
    }

    const studentCardsHtml = students
      .map((st) => {
        const qr = qrMap[st.id] || "";
        return `
        <div class="student-cell">
          <div class="photo-box">
            ${
              st.photoUrl
                ? `<img src="${st.photoUrl}" alt="${st.fullName}" />`
                : `<div class="photo-placeholder">3:4 PHOTO</div>`
            }
          </div>
          <div class="student-meta">
            <div class="student-name">${st.fullName}</div>
            <div class="student-code">${st.childCode}</div>
          </div>
          <div class="qr-box">
            ${qr ? `<img src="${qr}" alt="QR" />` : `<div class="qr-none">QR</div>`}
          </div>
        </div>
      `;
      })
      .join("");

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>AM2050 Attendance Poster - ${className} - ${schoolName}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Plus Jakarta Sans", sans-serif;
      margin: 0;
      padding: 0;
      color: #123148;
      background: #ffffff;
    }
    .poster-header {
      border-bottom: 2px solid #167a4c;
      padding-bottom: 3mm;
      margin-bottom: 4mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .header-left .brand-mark {
      font-size: 16pt;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #123148;
    }
    .header-left .brand-mark span {
      color: #167a4c;
    }
    .header-left .title-main {
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #167a4c;
      margin-top: 1mm;
    }
    .header-left .tagline {
      font-size: 7.5pt;
      font-weight: 700;
      color: #57707f;
      letter-spacing: 0.2px;
    }
    .header-right {
      text-align: right;
    }
    .header-right .school-name {
      font-size: 11pt;
      font-weight: 800;
      color: #123148;
    }
    .header-right .class-badge {
      display: inline-block;
      background: #eff5f1;
      border: 1px solid #167a4c;
      color: #167a4c;
      font-weight: 800;
      font-size: 8.5pt;
      padding: 1mm 2.5mm;
      border-radius: 2mm;
      margin-top: 1mm;
    }
    .ribbon-ng {
      height: 2px;
      display: flex;
      width: 100%;
      margin-bottom: 4mm;
    }
    .ribbon-green { background: #008751; flex: 1; }
    .ribbon-white { background: #ffffff; flex: 1; }

    .instructions-bar {
      background: #eff5f1;
      border: 1px solid #c7d2d6;
      border-radius: 1.5mm;
      padding: 2mm 3mm;
      font-size: 6.5pt;
      line-height: 1.3;
      margin-bottom: 4mm;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .grid-container {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 3mm;
    }

    .student-cell {
      border: 1px solid #c7d2d6;
      border-radius: 1.5mm;
      padding: 2mm;
      display: flex;
      align-items: center;
      gap: 2.5mm;
      background: #ffffff;
      break-inside: avoid;
    }
    .photo-box {
      width: 14mm;
      height: 18.6mm; /* 3:4 */
      border: 1px solid #123148;
      border-radius: 1mm;
      overflow: hidden;
      flex-shrink: 0;
      background: #f4f7f5;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .photo-box img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .photo-placeholder {
      font-size: 4pt;
      font-weight: 700;
      color: #718592;
      text-align: center;
    }
    .student-meta {
      flex: 1;
      min-width: 0;
    }
    .student-name {
      font-size: 6.8pt;
      font-weight: 800;
      line-height: 1.2;
      color: #123148;
      word-break: break-word;
    }
    .student-code {
      font-family: monospace;
      font-size: 5.5pt;
      font-weight: 700;
      color: #167a4c;
      margin-top: 1mm;
    }
    .qr-box {
      width: 16mm;
      height: 16mm;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .qr-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .qr-none {
      font-size: 6pt;
      color: #718592;
    }

    .poster-footer {
      margin-top: 5mm;
      border-top: 1px solid #c7d2d6;
      padding-top: 2mm;
      font-size: 5.5pt;
      color: #617985;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
  </style>
</head>
<body>
  <div class="poster-header">
    <div class="header-left">
      <div class="brand-mark">AM<span>2050</span></div>
      <div class="title-main">Classroom Attendance Wall Poster</div>
      <div class="tagline">ZERO OUT-OF-SCHOOL CHILDREN IN AREWA BY 2050 · SUBEB JIGAWA</div>
    </div>
    <div class="header-right">
      <div class="school-name">${schoolName}</div>
      <div class="class-badge">${className} · ${academicSession}</div>
    </div>
  </div>

  <div class="ribbon-ng">
    <div class="ribbon-green"></div>
    <div class="ribbon-white"></div>
    <div class="ribbon-green"></div>
  </div>

  <div class="instructions-bar">
    <div>
      <strong>DAILY TEACHER INSTRUCTION:</strong> Mount this poster near the classroom door. Scan each learner's QR code using the AM2050 Mobile Field PWA during morning roll-call.
    </div>
    <div>
      <strong>ENROLLED LEARNERS:</strong> ${students.length} Pupils
    </div>
  </div>

  <div class="grid-container">
    ${studentCardsHtml}
  </div>

  <div class="poster-footer">
    <div>CONFIDENTIAL CLASSROOM ROLL-CALL REGISTER · AM2050 SECURE TOKENS</div>
    <div>PRINTED FOR SUBEB ACCREDITED PUBLIC & TSANGAYA CENTRES</div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#082236]/70 p-4 backdrop-blur-sm">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-xl border border-[#c7d2d6] bg-white shadow-2xl">
        {/* Modal Topbar */}
        <div className="flex items-center justify-between border-b border-[#e2eae5] p-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-[#eff5f1] px-2 py-0.5 font-mono text-xs font-bold text-[#167a4c]">
                A4 / A3 WALL ROLL-CALL
              </span>
              <span className="text-xs font-medium text-[#57707f]">{academicSession}</span>
            </div>
            <h2 className="mt-1 font-display text-lg font-bold text-[#123148]">
              {schoolName} — {className} Attendance Wall Poster
            </h2>
          </div>
          <button
            onClick={onClose}
            className="action-press grid size-8 place-items-center rounded-lg border border-[#c7d2d6] text-[#57707f] hover:bg-[#eff5f1]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body / Preview Scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingQr ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#57707f]">
              <Loader2 className="size-8 animate-spin text-[#167a4c]" />
              <p className="mt-3 text-sm font-semibold">Generating high-density attendance QR tokens…</p>
            </div>
          ) : students.length === 0 ? (
            <div className="py-12 text-center text-[#57707f]">
              <QrCode className="mx-auto size-10 text-[#718592]" />
              <p className="mt-2 text-sm font-semibold">No students currently enrolled in this class.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-[#c7d2d6] bg-[#fbfdfb] p-3 text-xs text-[#334d5c]">
                <strong>Classroom Wall Deployment:</strong> Mount this A4/A3 poster inside the classroom. Teachers can scan learners continuously during morning roll-call with the AM2050 offline scanner in under 2 minutes.
              </div>

              {/* Grid Preview */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                {students.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-3 rounded-lg border border-[#c7d2d6] bg-white p-2.5 shadow-sm"
                  >
                    <div className="size-12 shrink-0 overflow-hidden rounded border border-[#123148] bg-[#eff5f1] flex items-center justify-center">
                      {st.photoUrl ? (
                        <img src={st.photoUrl} alt={st.fullName} className="size-full object-cover" />
                      ) : (
                        <span className="text-[9px] font-bold text-[#718592]">3:4</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-[#123148]">{st.fullName}</p>
                      <p className="font-mono text-[10px] font-bold text-[#167a4c]">{st.childCode}</p>
                    </div>
                    <div className="size-12 shrink-0">
                      {qrMap[st.id] ? (
                        <img
                          src={qrMap[st.id]}
                          alt="QR Code"
                          className="size-full object-contain"
                        />
                      ) : (
                        <div className="size-full rounded bg-neutral-100" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-[#e2eae5] p-4">
          <p className="text-xs text-[#57707f]">
            Total {students.length} scannable learner token{students.length !== 1 ? "s" : ""}
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="action-press rounded-lg border border-[#c7d2d6] bg-white px-4 py-2 text-xs font-semibold text-[#57707f] hover:bg-[#eff5f1]"
            >
              Close
            </button>
            <button
              disabled={loadingQr || students.length === 0}
              onClick={handlePrint}
              className="action-press inline-flex items-center gap-2 rounded-lg bg-[#167a4c] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#12643e] disabled:opacity-50"
            >
              <Printer size={15} />
              Print Classroom Wall Poster (A4 / A3)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
