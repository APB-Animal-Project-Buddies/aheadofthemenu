"use client";

/**
 * Opens the device's rear camera in a modal and decodes a QR code with jsQR.
 * Calls onResult with the raw decoded text (usually a ".../q/<code>" URL) as
 * soon as a code is seen, then tears the camera down. Cross-browser (works on
 * iOS Safari, which lacks the native BarcodeDetector).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import jsQR from "jsqr";

export function QrScanButton({ onResult }: { onResult: (text: string) => void }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setOpen(false);
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const tick = () => {
        if (!streamRef.current || !video) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx && video.videoWidth) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const found = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (found?.data) {
            onResult(found.data);
            stop();
            return;
          }
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError("Couldn't open the camera. Check permissions, or type the code instead.");
      setOpen(false);
    }
  }, [onResult, stop]);

  // Always release the camera if the component unmounts mid-scan.
  useEffect(() => () => stop(), [stop]);

  return (
    <>
      <button
        type="button"
        onClick={start}
        className="inline-flex items-center gap-1.5 rounded-full border border-apb/40 px-4 py-2 text-sm font-medium text-apb transition hover:bg-apb/5"
      >
        📷 Scan
      </button>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 p-4">
          <video ref={videoRef} playsInline muted className="max-h-[70vh] w-full max-w-md rounded-2xl" />
          <p className="mt-3 text-sm text-white/80">Point at the potluck QR code…</p>
          <button
            type="button"
            onClick={stop}
            className="mt-4 rounded-full bg-white px-6 py-2 text-sm font-medium text-neutral-800"
          >
            Cancel
          </button>
        </div>
      )}
    </>
  );
}
