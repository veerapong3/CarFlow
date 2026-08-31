"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-xl font-semibold text-slate-900">เกิดข้อผิดพลาด</h2>
      <p className="max-w-md text-sm text-slate-600">
        ระบบมีปัญหาชั่วคราว กรุณาลองใหม่อีกครั้ง
      </p>
      <button type="button" onClick={reset} className="btn-primary">
        ลองใหม่
      </button>
    </div>
  );
}
