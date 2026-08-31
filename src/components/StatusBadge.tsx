import clsx from "clsx";

interface StatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  pending: { label: "รออนุมัติ", className: "bg-amber-100 text-amber-800" },
  approved: { label: "อนุมัติแล้ว", className: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "ยกเลิก", className: "bg-red-100 text-red-800" },
  completed: { label: "เสร็จสิ้น", className: "bg-blue-100 text-blue-800" },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_MAP[status] || { label: status, className: "bg-slate-100 text-slate-800" };
  return (
    <span
      className={clsx(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
