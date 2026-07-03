"use client";

import { memo } from "react";
import { QRCodeSVG } from "qrcode.react";

/**
 * Shared "scan me" card: a QR code beside a title and caption, used on the
 * profile page and the public active-dishes page. Memoized so the QR isn't
 * re-encoded when the parent re-renders with the same props.
 */
export const QrShareCard = memo(function QrShareCard({
  url,
  title,
  caption,
  link,
  className,
}: {
  url: string;
  title: string;
  caption: string;
  /** Optional visible link rendered under the title. */
  link?: { href: string; text: string };
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm ${className ?? ""}`}
    >
      <div className="flex-none rounded-lg bg-white p-1">
        <QRCodeSVG value={url} size={92} marginSize={1} />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-neutral-900">{title}</div>
        {link && (
          <a href={link.href} className="break-all text-sm text-apb hover:underline">
            {link.text}
          </a>
        )}
        <p className="mt-1 text-xs text-neutral-500">{caption}</p>
      </div>
    </div>
  );
});
