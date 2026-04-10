import { useContext, useMemo, useRef } from "react";
import { FontContext } from "../FontContext";
import { CheckCircle2 } from "lucide-react";

export default function SurahCard({
  s,
  logs,
  userName,
  onClick,
  onLongPress,
  ...props
}) {
  const { theme, getUniqueVersesCount } = useContext(FontContext);
  const timerRef = useRef(null);
  const isLongPress = useRef(false);

  if (!s) return null;

  const sLogs = (logs || []).filter((l) => l.surah_id === s.id);
  const progress = getUniqueVersesCount(sLogs);
  const isCompleted =
    progress >= (s?.ayat || 0) || sLogs.some((l) => l.status === "completed");

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

  const activeReaders = useMemo(() => {
    if (isCompleted) return [];
    return [...new Set(sLogs.map((l) => l.user_name))];
  }, [sLogs, isCompleted]);

  // //! تفعيل ميزة الضغطة المطولة وتعديل الوقت لـ 3.5 ثواني
  const startPress = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      if (onLongPress) onLongPress(s);
    }, 3500); // 3500 ملي ثانية = 3 ثواني ونصف
  };

  const cancelPress = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const handleClick = (e) => {
    if (isLongPress.current) {
      e.preventDefault();
      return;
    }
    onClick(s);
  };

  return (
    <button
      onClick={handleClick}
      onPointerDown={startPress}
      onPointerUp={cancelPress}
      onPointerMove={cancelPress}
      onPointerLeave={cancelPress}
      onContextMenu={(e) => e.preventDefault()}
      {...props}
      className={`relative p-6 pb-10 rounded-[2.5rem] border-2 transition-all active:scale-95 group overflow-hidden select-none touch-manipulation ${isCompleted ? "border-emerald-500 bg-emerald-500/10" : theme === "dark" ? "bg-emerald-900/10 border-emerald-800/30" : "bg-white border-emerald-100/80 shadow-sm hover:shadow-md"}`}
    >
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs sm:text-sm font-black opacity-50 uppercase tracking-widest">
          {s.id}
        </span>
        <h3
          className={`font-black font-serif text-2xl sm:text-3xl group-hover:scale-110 transition-transform ${theme === "dark" ? "text-[#ffb900]" : "text-emerald-800"}`}
        >
          {s.name_ar}
        </h3>
        {isCompleted ? (
          <div className="flex flex-col items-center gap-1.5 animate-in zoom-in duration-500">
            <CheckCircle2 size={28} className="text-emerald-500" />
            <span
              className={`text-xs sm:text-sm font-black leading-tight text-center ${theme === "dark" ? "text-emerald-600/80" : "text-emerald-700"}`}
            >
              ختمها: {finishers?.slice(0, 2).join("، ")}{" "}
              {finishers?.length > 2 ? ".." : ""}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="h-4 flex items-center mt-1">
              <span
                className={`text-xs sm:text-sm font-black ${theme === "dark" ? "text-emerald-500/70" : "text-emerald-600/80"}`}
              >
                {progress}/{s?.ayat}
              </span>
            </div>
            {activeReaders.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-2 animate-in fade-in">
                {activeReaders.map((reader, idx) => (
                  <span
                    key={idx}
                    className={`text-[0.6rem] sm:text-xs px-2.5 py-0.5 rounded-full font-black ${theme === "dark" ? "bg-emerald-800/50 text-emerald-300" : "bg-emerald-100 text-emerald-700"}`}
                  >
                    {reader}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-slate-200/10 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${theme === "dark" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" : "bg-emerald-400"}`}
          style={{ width: `${(progress / (s?.ayat || 1)) * 100}%` }}
        />
      </div>
    </button>
  );
}
