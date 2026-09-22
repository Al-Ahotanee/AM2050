/* AM2050 — One-Tap High-Precision GPS Geolocation with Ward Geo-Fence */
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Crosshair, Loader2, Navigation, Satellite } from "lucide-react";
import { toast } from "sonner";

export type GpsCaptureResult = {
  lat: string;
  lng: string;
  raw: string;
  accuracy?: number;
  elevation?: number;
};

type GpsCaptureControlProps = {
  value: string;
  onChange: (result: GpsCaptureResult) => void;
  lgaName?: string;
  wardName?: string;
  disabled?: boolean;
  className?: string;
};

// Regional Geofence Bounding Boxes
const GEOFENCE = {
  // Northern Nigeria (Arewa 19 States)
  AREWA: { minLat: 8.5, maxLat: 14.2, minLng: 3.0, maxLng: 15.0 },
  // Jigawa State (Primary Baseline Pilot)
  JIGAWA: { minLat: 11.0, maxLat: 13.1, minLng: 8.0, maxLng: 10.6 },
};

export function GpsCaptureControl({
  value,
  onChange,
  lgaName = "Jigawa LGA",
  wardName,
  disabled = false,
  className = "",
}: GpsCaptureControlProps) {
  const [capturing, setCapturing] = useState(false);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [elevation, setElevation] = useState<number | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  const checkGeofence = (lat: number, lng: number) => {
    // Check regional Arewa bounds
    if (
      lat < GEOFENCE.AREWA.minLat ||
      lat > GEOFENCE.AREWA.maxLat ||
      lng < GEOFENCE.AREWA.minLng ||
      lng > GEOFENCE.AREWA.maxLng
    ) {
      return "CRITICAL: Captured coordinates fall outside Northern Nigeria (Arewa) boundary. Check device GPS calibration.";
    }

    // Check Jigawa State pilot bounds
    if (
      lat < GEOFENCE.JIGAWA.minLat ||
      lat > GEOFENCE.JIGAWA.maxLat ||
      lng < GEOFENCE.JIGAWA.minLng ||
      lng > GEOFENCE.JIGAWA.maxLng
    ) {
      return `NOTICE: Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)}) fall outside standard Jigawa State boundary. Verify enumerator field location.`;
    }

    return null;
  };

  const acquireGps = () => {
    if (!navigator.geolocation) {
      toast.error("GPS Hardware is unavailable on this device.");
      return;
    }

    setCapturing(true);
    setWarning(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const acc = position.coords.accuracy;
        const alt = position.coords.altitude != null ? Number(position.coords.altitude.toFixed(1)) : undefined;

        setAccuracy(Number(acc.toFixed(1)));
        if (alt !== undefined) setElevation(alt);

        const latStr = lat.toFixed(6);
        const lngStr = lng.toFixed(6);
        const rawStr = `${latStr}, ${lngStr}`;

        const fenceWarning = checkGeofence(lat, lng);
        setWarning(fenceWarning);

        onChange({
          lat: latStr,
          lng: lngStr,
          raw: rawStr,
          accuracy: Number(acc.toFixed(1)),
          elevation: alt,
        });

        setCapturing(false);
        if (fenceWarning) {
          toast.warning("GPS Acquired with Geofence Notice", { description: fenceWarning });
        } else {
          toast.success(`GPS Locked: ±${acc.toFixed(1)}m precision`);
        }
      },
      (error) => {
        setCapturing(false);
        let msg = "Could not acquire GPS position.";
        if (error.code === error.PERMISSION_DENIED) {
          msg = "GPS permission denied. Enable location services in your browser/device settings.";
        } else if (error.code === error.TIMEOUT) {
          msg = "GPS signal timed out. Move outdoors with an unobstructed view of the sky.";
        }
        toast.error(msg);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            className="field-input pr-9"
            placeholder="Latitude, Longitude (e.g. 11.839210, 9.340120)"
            value={value}
            onChange={(e) => {
              const val = e.target.value;
              const parts = val.split(",").map((s) => s.trim());
              onChange({
                lat: parts[0] || "",
                lng: parts[1] || "",
                raw: val,
              });
            }}
            disabled={disabled}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#718592]">
            <Navigation size={16} />
          </span>
        </div>

        <button
          type="button"
          onClick={acquireGps}
          disabled={capturing || disabled}
          className="action-press inline-flex shrink-0 items-center gap-1.5 rounded-md border border-[#167a4c] bg-[#e7f4eb] px-3.5 py-2 text-xs font-semibold text-[#0e5a38] transition hover:bg-[#d4edd8] disabled:opacity-60"
        >
          {capturing ? (
            <>
              <Loader2 size={15} className="animate-spin text-[#167a4c]" />
              <span>Locking…</span>
            </>
          ) : (
            <>
              <Satellite size={15} className="text-[#167a4c]" />
              <span>Acquire Live GPS</span>
            </>
          )}
        </button>
      </div>

      {/* Accuracy & Satellite Pill */}
      {accuracy !== null && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
              accuracy <= 5
                ? "bg-[#e7f4eb] text-[#0e5a38] border border-[#a3d9b1]"
                : accuracy <= 20
                ? "bg-[#fbf2df] text-[#815813] border border-[#ecd5a5]"
                : "bg-[#faeae7] text-[#96372d] border border-[#f0c2bb]"
            }`}
          >
            <CheckCircle2 size={12} />
            ±{accuracy}m Precision ({accuracy <= 5 ? "High Satellite Lock" : accuracy <= 20 ? "Standard" : "Low"})
          </span>
          {elevation !== null && (
            <span className="font-mono text-[11px] text-[#57707f]">
              Elevation: {elevation}m
            </span>
          )}
          {wardName && (
            <span className="font-mono text-[10px] text-[#617985]">
              Target: {wardName} ({lgaName})
            </span>
          )}
        </div>
      )}

      {/* Geofence Alert Banner */}
      {warning && (
        <div className="flex items-start gap-2 rounded-md border border-[#c88b25] bg-[#fff9ed] p-2.5 text-xs text-[#815813]">
          <AlertTriangle size={15} className="shrink-0 text-[#c88b25] mt-0.5" />
          <p className="leading-relaxed">{warning}</p>
        </div>
      )}
    </div>
  );
}
