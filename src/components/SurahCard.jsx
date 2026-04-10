import { useContext, useMemo } from "react";
import { FontContext } from "../App";
import { CheckCircle2 } from "lucide-react";

export default function SurahCard({ s, logs, userName, onClick, ...props }) {
  const { theme, getUniqueVersesCount } = useContext(FontContext);
  if (!s) return null; // //! test حماية صخرية

  const sLogs = (logs || []).filter((l) => l.surah_id === s.id);
  const progress = getUniqueVersesCount(sLogs);
  const isCompleted =
    progress >= (s?.ayat || 0) || sLogs.some((l) => l.status === "completed");

  //! test [ID: 04] ترتيب المخلصين حسب عدد الآيات المنجزة فعلياً
  const finishers = useMemo(() => {
    if (!isCompleted) return null;
    const userStats = {};
    sLogs.forEach((l) => {
      const count = l.verse_end - l.verse_start + 1 || 0;
      userStats[l.user_name] = (userStats[l.user_name] || 0) + count;
    });
    return Object.entries(userStats)
      .sort((a, b) => b[1] - a[1])
      .map((entry) => entry[0]);
  }, [sLogs, isCompleted]);

  return (
    <button
      onClick={() => onClick(s)}
      {...props}
      className={`relative p-6 pb-8 rounded-[2.5rem] border-2 transition-all active:scale-95 group overflow-hidden ${isCompleted ? "border-emerald-500 bg-emerald-500/10" : theme === "dark" ? "bg-emerald-900/10 border-emerald-800/30" : "bg-white border-slate-200 shadow-sm"}`}
    >
      <div className="flex flex-col items-center gap-3">
        <span className="text-[10px] font-black opacity-30 uppercase tracking-widest">
          {s.id}
        </span>
        <h3 className="font-black font-serif text-xl text-amber-500 group-hover:scale-110 transition-transform">
          {s.name_ar}
        </h3>
        {isCompleted ? (
          <div className="flex flex-col items-center gap-1 animate-in zoom-in duration-500">
            <CheckCircle2 size={24} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-600/80 leading-tight">
              ختمها: {finishers?.slice(0, 2).join("، ")}
              {finishers?.length > 2 ? ".." : ""}
            </span>
          </div>
        ) : (
          <div className="h-6 flex items-center">
            <span className="text-[10px] font-black text-emerald-500/50">
              {progress}/{s?.ayat}
            </span>
          </div>
        )}
      </div>
      {/* //! test Progress Bar مدمج أسفل الكارت بلملي */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200/10 overflow-hidden">
        <div
          className="bg-emerald-500 h-full transition-all duration-1000 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
          style={{ width: `${(progress / (s?.ayat || 1)) * 100}%` }}
        />
      </div>
    </button>
  );
}
