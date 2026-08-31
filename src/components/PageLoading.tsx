export default function PageLoading({ label = "กำลังโหลด..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-slate-500">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
