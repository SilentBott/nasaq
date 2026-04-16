import { ArrowRight, Info, Lock, WifiOff, Flame } from "lucide-react";

export default function GroupHeader({
  theme,
  currentGroup,
  userName,
  isOnline,
  progress,
  streak,
  onBack,
  onInfoClick,
}) {
  return (
    <header
      className={`relative z-[100] border-b py-4 transition-all rounded-3xl px-2 sm:px-4 ${theme === "dark" ? "bg-[#042f24] border-emerald-900/50" : "bg-white border-slate-200 shadow-sm"}`}
    >
      <div className="flex flex-row items-center justify-between">
        <div className="flex flex-row items-center gap-3">
          <button
            onClick={onBack}
            className={`p-2.5 rounded-xl transition-all active:scale-90 ${theme === "dark" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
          >
            <ArrowRight size={20} />
          </button>
          <div
            className="flex flex-col text-right cursor-pointer hover:opacity-80 transition-all"
            onClick={onInfoClick}
          >
            <div className="flex items-center gap-2">
              <h1
                className={`font-black text-xl sm:text-2xl font-serif tracking-tight ${theme === "dark" ? "text-[#ffb900]" : "text-emerald-700"}`}
              >
                {currentGroup.name}
                {currentGroup.is_private && (
                  <Lock
                    size={20}
                    className={
                      theme === "dark" ? "text-[#ffb900]" : "text-emerald-600"
                    }
                  />
                )}
              </h1>
              <Info
                size={16}
                className={
                  theme === "dark" ? "text-emerald-500" : "text-slate-400"
                }
              />
            </div>
            <span
              className={`font-bold text-[0.65rem] sm:text-xs ${theme === "dark" ? "text-emerald-100/50" : "text-slate-500"}`}
            >
              {userName}
            </span>
          </div>
        </div>
        {!isOnline && (
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-inner transition-all ${theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-red-50 border-red-200 text-red-600"}`}
          >
            <WifiOff size={16} className="animate-pulse" />
            <span className="text-[0.65rem] sm:text-xs font-black uppercase tracking-wider hidden sm:inline">
              بدون إنترنت
            </span>
          </div>
        )}
        <div className="flex items-center gap-3 sm:gap-4 flex-row-reverse">
          <div
            className={`font-black text-sm sm:text-lg ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}
          >
            {progress}%
          </div>
          {streak > 0 && (
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-inner ${theme === "dark" ? "bg-orange-500/10 border border-orange-500/20 text-orange-500" : "bg-orange-50 border border-orange-200 text-orange-600"}`}
            >
              <Flame size={18} fill="currentColor" />
              <span className="font-black text-xs sm:text-sm">{streak}</span>
            </div>
          )}
        </div>
      </div>
      <div
        className={`absolute bottom-[-2px] left-0 h-1.5 transition-all duration-1000 rounded-full ${theme === "dark" ? "bg-emerald-500 shadow-[0_0_15px_2px_rgba(16,185,129,0.9)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"}`}
        style={{ width: `${progress}%` }}
      />
    </header>
  );
}
