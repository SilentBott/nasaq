export default function ToastMessage({ toast, theme }) {
  if (!toast.show) return null;

  return (
    <div
      className={`fixed top-6 sm:top-8 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl sm:rounded-[2rem] shadow-2xl flex flex-col items-center gap-1.5 min-w-[280px] max-w-[90vw] text-center border-2 transition-all duration-500 ease-in-out ${
        toast.isClosing
          ? "opacity-0 -translate-y-10 scale-95"
          : "animate-in slide-in-from-top-5 fade-in duration-300"
      } ${
        toast.type === "success"
          ? theme === "dark"
            ? "bg-emerald-900/95 text-emerald-100 border-emerald-500/30"
            : "bg-emerald-500 text-white border-emerald-600"
          : toast.type === "warning"
            ? theme === "dark"
              ? "bg-amber-900/95 text-amber-100 border-amber-500/30"
              : "bg-amber-500 text-emerald-950 border-amber-600"
            : toast.type === "error"
              ? theme === "dark"
                ? "bg-red-900/95 text-red-100 border-red-500/30"
                : "bg-red-500 text-white border-red-600"
              : theme === "dark"
                ? "bg-slate-800/95 text-white border-slate-600"
                : "bg-slate-800 text-white border-slate-700"
      }`}
    >
      <span className="font-black text-sm sm:text-base leading-relaxed">
        {toast.message}
      </span>
      {toast.subMessage && (
        <span className="text-[0.7rem] sm:text-xs opacity-90 font-bold">
          {toast.subMessage}
        </span>
      )}
    </div>
  );
}
