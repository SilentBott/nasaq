import { Sparkles, Lock } from "lucide-react";
import { useContext } from "react";
import { FontContext } from "../FontContext";

export default function KhatmahRadar({ topGroups, theme, onJoinGroup }) {
  const { fontSize } = useContext(FontContext);

  const nearingKhatmah =
    topGroups?.filter((g) => g.progress >= 98 && g.progress < 100) || [];

  if (nearingKhatmah.length === 0) return null;

  // قللنا تأثير التكبير هنا عشان الكارت ميبقاش عملاق
  const scaleMultiplier = 1 + (fontSize - 5) * 0.03;

  return (
    <div className="mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full overflow-hidden">
      <h3
        className={`font-black mb-3 flex items-center gap-2 ${theme === "dark" ? "text-emerald-400" : "text-emerald-700"}`}
        style={{ fontSize: `${0.9 * scaleMultiplier}rem` }}
      >
        <Sparkles
          size={16 * scaleMultiplier}
          className="text-[#ffb900] animate-pulse shrink-0"
        />
        رادار الختمات (توشك على الانتهاء)
      </h3>

      <div className="flex gap-3 overflow-x-auto quran-scroll pb-4 w-full snap-x snap-mandatory">
        {nearingKhatmah.map((g) => (
          <div
            key={g.id}
            // صغرنا الـ padding والـ gap عشان الكارت يكون ملموم وشيك
            className={`min-w-[80%] sm:min-w-[260px] snap-center shrink-0 p-4 rounded-[1.5rem] border-2 flex flex-col gap-2.5 transition-transform hover:scale-[1.02] ${
              theme === "dark"
                ? "bg-emerald-900/10 border-emerald-800/50 shadow-sm"
                : "bg-white border-emerald-100 shadow-sm"
            }`}
          >
            <div className="flex justify-between items-center gap-2">
              <span
                className={`font-black truncate flex items-center gap-1.5 ${theme === "dark" ? "text-emerald-50" : "text-slate-800"}`}
                style={{ fontSize: `${0.95 * scaleMultiplier}rem` }}
              >
                {g.name}
                {g.is_private && (
                  <Lock
                    size={14 * scaleMultiplier}
                    className="inline-block text-amber-500 shrink-0"
                  />
                )}
              </span>

              {/* شيلنا الخلفية الصفرا المزعجة وخليناها نص نظيف */}
              <span
                className={`font-black shrink-0 ${theme === "dark" ? "text-[#ffb900]" : "text-emerald-600"}`}
                style={{ fontSize: `${0.85 * scaleMultiplier}rem` }}
              >
                {g.progress}%
              </span>
            </div>

            {/* رفعنا الشريط شوية عشان يكون أنيق */}
            <div
              className={`h-1.5 w-full rounded-full overflow-hidden ${theme === "dark" ? "bg-emerald-900/50" : "bg-slate-100"}`}
            >
              <div
                className="h-full bg-[#ffb900] transition-all duration-1000"
                style={{ width: `${g.progress}%` }}
              ></div>
            </div>

            {!g.is_private && (
              <button
                onClick={() => onJoinGroup(g)}
                // زرار الدخول بقى أهدى وأشيك في النهاري
                className={`mt-1 py-2 rounded-xl font-black transition-all active:scale-95 ${
                  theme === "dark"
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                }`}
                style={{ fontSize: `${0.75 * scaleMultiplier}rem` }}
              >
                ادخل وشارك الأجر
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
