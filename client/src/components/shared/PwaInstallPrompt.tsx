/* AM2050 — PWA Mobile Homescreen Install Prompt */
import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { LogoMark } from "@/components/brand/LogoMark";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if dismissed in this session
    if (sessionStorage.getItem("am2050_pwa_dismissed") === "true") {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    setVisible(false);
    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem("am2050_pwa_dismissed", "true");
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Install AM2050 Application"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-lg rounded-lg border border-[#b9dcc3] bg-[#0d2d40] p-4 text-white shadow-2xl backdrop-blur-md sm:bottom-6 sm:left-auto sm:right-6"
    >
      <div className="flex items-start gap-3.5">
        <span className="shrink-0 rounded bg-[#064e3b] p-1.5 shadow-sm">
          <LogoMark size={28} theme="emerald" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-[#34d399]">
            Progressive Web App
          </p>
          <h2 className="mt-0.5 font-display text-sm font-bold tracking-tight text-white">
            Install AM2050 on Mobile Homescreen
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#d1ded6]">
            Work 100% offline in remote wards. Fast launch for field enumerators and teachers without an app store.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              onClick={install}
              className="action-press inline-flex items-center gap-1.5 rounded bg-[#167a4c] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#12683f]"
            >
              <Download size={14} />
              Install App
            </button>
            <button
              onClick={dismiss}
              className="rounded px-2.5 py-1.5 text-xs font-medium text-[#9cc8ae] hover:text-white"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          onClick={dismiss}
          className="rounded p-1 text-white/60 hover:text-white"
          aria-label="Close install prompt"
        >
          <X size={16} />
        </button>
      </div>
    </aside>
  );
}
