import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function SurahCard({
  s,
  logs,
  userName,
  onStartPress,
  onEndPress,
  onClick,
}) {
  const sLogs = logs.filter((l) => l.surah_id === s.id);
  const totalClaimed = sLogs.reduce(
    (sum, l) => sum + (l.verse_end - l.verse_start + 1),
    0,
  );
  const isDone =
    sLogs.some((l) => l.status === "completed") || totalClaimed >= s.ayat;
  const finishers = [...new Set(sLogs.map((l) => l.user_name))];
  const readers = sLogs.filter((l) => l.status === "reading");
  const progress = Math.min((totalClaimed / s.ayat) * 100, 100);

  return (
    <button
      onMouseDown={() => onStartPress(s)}
      onMouseUp={onEndPress}
      onTouchStart={() => onStartPress(s)}
      onTouchEnd={onEndPress}
      onClick={() => onClick(s)}
      className={`p-4 pb-6 rounded-2xl border transition-all active:scale-95 relative overflow-hidden shadow-sm ${isDone ? "bg-emerald-800/40 border-emerald-500 shadow-emerald-900/40" : "bg-emerald-900/20 border-emerald-800 hover:border-emerald-700"}`}
    >
      <div className="text-lg font-bold mb-1 font-serif">{s.name_ar}</div>
      <div className="text-[10px] text-emerald-600 mb-2 font-mono uppercase tracking-widest">
        آياتها: {s.ayat}
      </div>
      <div className="space-y-1">
        {isDone ? (
          <div className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 py-1 rounded px-1 break-words">
            ختمها: {finishers.join("، ")}
          </div>
        ) : (
          readers.map((r, i) => (
            <div
              key={i}
              className="text-[9px] text-amber-500 truncate bg-amber-500/5 rounded px-1.5 py-0.5 border border-amber-500/10 font-bold"
            >
              {r.user_name} ({r.verse_start}-{r.verse_end})
            </div>
          ))
        )}
      </div>
      {isDone && (
        <CheckCircle2 className="absolute top-2 left-2 w-3 h-3 text-emerald-400" />
      )}
      {!isDone && progress > 0 && (
        <div
          className="absolute bottom-0 left-0 h-1.5 bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-700"
          style={{ width: `${progress}%` }}
        />
      )}
    </button>
  );
}
