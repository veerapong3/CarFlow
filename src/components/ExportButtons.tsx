"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, LoaderCircle } from "lucide-react";

interface ExportButtonsProps {
  password: string;
}

export default function ExportButtons({ password }: ExportButtonsProps) {
  const [busy, setBusy] = useState<"csv" | "xlsx" | null>(null);

  async function download(format: "csv" | "xlsx") {
    setBusy(format);
    try {
      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, format }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "ส่งออกไม่สำเร็จ");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const header = res.headers.get("Content-Disposition") || "";
      const starred = header.match(/filename\*=UTF-8''([^;]+)/);
      const plain = header.match(/filename="?([^"]+)"?/);
      link.href = url;
      link.download = decodeURIComponent(
        starred?.[1] || plain?.[1] || `CarFlow-สถิติ.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : "ส่งออกไม่สำเร็จ");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="btn-secondary"
        disabled={busy !== null}
        onClick={() => download("csv")}
      >
        {busy === "csv" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
        CSV
      </button>
      <button
        type="button"
        className="btn-secondary"
        disabled={busy !== null}
        onClick={() => download("xlsx")}
      >
        {busy === "xlsx" ? (
          <LoaderCircle className="h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="h-4 w-4" />
        )}
        Excel
      </button>
    </div>
  );
}
