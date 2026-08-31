import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h2 className="text-2xl font-bold text-slate-900">404 — ไม่พบหน้านี้</h2>
      <p className="text-slate-600">หน้าที่คุณค้นหาไม่มีอยู่ในระบบ</p>
      <Link href="/" className="btn-primary">
        กลับหน้าแรก
      </Link>
    </div>
  );
}
