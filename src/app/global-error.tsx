"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4 text-center font-sans">
        <h2 className="text-xl font-semibold text-slate-900">เกิดข้อผิดพลาดร้ายแรง</h2>
        <p className="text-sm text-slate-600">กรุณารีเฟรชหน้าเว็บหรือลองใหม่ภายหลัง</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          ลองใหม่
        </button>
      </body>
    </html>
  );
}
