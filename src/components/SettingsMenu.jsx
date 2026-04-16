import { useContext } from "react";
import { FontContext } from "../FontContext";
import { X, Highlighter, Layers, Moon, Minus, Plus } from "lucide-react";

export default function SettingsMenu({ isOpen, onClose }) {
  const {
    fontSize,
    setFontSize,
    theme,
    themeSetting,
    setThemeSetting,
    verseViewMode,
    setVerseViewMode,
    highlightMode,
    setHighlightMode,
  } = useContext(FontContext);

  if (!isOpen) return null;

  const hModes = ["row", "full", "text"];
  const hModesAr = { row: "خفيف", full: "كامل", text: "نص" };
  const vModes = ["num", "text", "both"];
  const vModesAr = { num: "رقم", text: "نص", both: "الـ2" };

  return (
    <>
      <style>{`.quran-scroll::-webkit-scrollbar { width: 4px; } .quran-scroll::-webkit-scrollbar-track { background: transparent; margin: 48px 0; } .quran-scroll::-webkit-scrollbar-thumb { background: #ffb900; border-radius: 10px; }`}</style>
      <div
        className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-start justify-center overflow-y-auto px-4 py-12 sm:py-20"
        onClick={onClose}
      >
        <div
          className={`w-full max-w-md my-auto h-fit max-h-[85vh] overflow-y-auto quran-scroll ${theme === "dark" ? "bg-gradient-to-b from-[#064e3b] to-[#022a1d] border-emerald-700/40 text-emerald-50" : "bg-gradient-to-b from-white to-slate-50 border-slate-200 text-slate-800"} border p-8 ps-10 sm:p-10 sm:ps-12 rounded-[3.5rem] shadow-2xl relative z-10`}
          onClick={(e) => e.stopPropagation()}
        >
          {theme === "dark" && (
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
          )}
          <div className="flex justify-between items-center mb-6 px-2 relative z-10">
            <h2 className="text-3xl font-black text-amber-500 font-serif">
              الإعدادات
            </h2>
            <button
              onClick={onClose}
              className={`p-3 rounded-full transition-all active:scale-90 ${theme === "dark" ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
            >
              <X size={24} />
            </button>
          </div>
          <div className="space-y-6 relative z-10">
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`p-5 rounded-[2rem] border text-center flex flex-col justify-between gap-4 transition-colors ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"} shadow-sm`}
              >
                <span
                  className={`text-[0.65rem] sm:text-xs font-black uppercase tracking-widest ${theme === "dark" ? "text-emerald-200 opacity-60" : "text-slate-400"}`}
                >
                  تظليل
                </span>
                <button
                  onClick={() =>
                    setHighlightMode(
                      hModes[
                        (hModes.indexOf(highlightMode) + 1) % hModes.length
                      ],
                    )
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-[1.2rem] font-black text-[0.7rem] sm:text-xs shadow-md transition-all active:scale-95"
                >
                  <Highlighter size={14} className="inline ml-1" />
                  {hModesAr[highlightMode]}
                </button>
              </div>
              <div
                className={`p-5 rounded-[2rem] border text-center flex flex-col justify-between gap-4 transition-colors ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"} shadow-sm`}
              >
                <span
                  className={`text-[0.65rem] sm:text-xs font-black uppercase tracking-widest ${theme === "dark" ? "text-emerald-200 opacity-60" : "text-slate-400"}`}
                >
                  عرض الآيات عند التسجيل
                </span>
                <button
                  onClick={() =>
                    setVerseViewMode(
                      vModes[
                        (vModes.indexOf(verseViewMode) + 1) % vModes.length
                      ],
                    )
                  }
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-[1.2rem] font-black text-[0.7rem] sm:text-xs shadow-md transition-all active:scale-95"
                >
                  <Layers size={14} className="inline ml-1" />
                  {vModesAr[verseViewMode]}
                </button>
              </div>
            </div>

            <style>{`
              ::view-transition-old(root) { animation: none; mix-blend-mode: normal; z-index: -1; }
              ::view-transition-new(root) { mix-blend-mode: normal; z-index: 9999; }
            `}</style>
            <button
              onClick={() => {
                const nextTheme =
                  themeSetting === "light"
                    ? "dark"
                    : themeSetting === "dark"
                      ? "auto"
                      : "light";
                setThemeSetting(nextTheme);
              }}
              className={`relative w-full mt-6 p-6 rounded-[2.5rem] flex justify-between items-center border-2 font-black transition-all duration-500 shadow-sm active:scale-95 group ${
                theme === "dark"
                  ? "bg-emerald-900/30 border-[#ffb900]/40 text-emerald-100 hover:bg-[#ffb900]/10 hover:border-[#ffb900]"
                  : "bg-amber-50/50 border-amber-300 text-slate-800 hover:bg-amber-100 hover:border-amber-400"
              }`}
            >
              <span className="tracking-wide relative z-10">
                {themeSetting === "dark"
                  ? "الوضع الليلي 🌙"
                  : themeSetting === "light"
                    ? "الوضع النهاري ☀️"
                    : "المظهر التلقائي ⚙️"}
              </span>
              <Moon
                size={22}
                className={`relative z-10 transition-all duration-500 group-active:rotate-180 group-active:scale-75 ${theme === "dark" ? "text-[#ffb900]" : "text-amber-500"}`}
              />
            </button>

            <div
              className={`p-6 rounded-[2.5rem] border flex items-center justify-between transition-colors ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"} shadow-sm`}
            >
              <button
                onClick={() => setFontSize((f) => Math.max(3, f - 1))}
                className="p-4 bg-emerald-600 hover:bg-emerald-500 rounded-[1.3rem] text-white transition-all active:scale-90 shadow-md"
              >
                <Minus size={22} />
              </button>
              <div className="flex flex-col items-center">
                <span
                  className={`text-[0.6rem] sm:text-xs font-black uppercase tracking-widest mb-1 ${theme === "dark" ? "text-emerald-200 opacity-60" : "text-slate-400"}`}
                >
                  حجم الخط
                </span>
                <span className="text-4xl font-black text-amber-500 font-mono">
                  {fontSize}
                </span>
              </div>
              <button
                onClick={() => setFontSize((f) => Math.min(10, f + 1))}
                className="p-4 bg-emerald-600 hover:bg-emerald-500 rounded-[1.3rem] text-white transition-all active:scale-90 shadow-md"
              >
                <Plus size={22} />
              </button>
            </div>

            <div
              className={`mt-8 p-6 rounded-[2.5rem] border border-dashed transition-colors ${theme === "dark" ? "border-emerald-600/30 bg-emerald-900/20" : "border-slate-300 bg-slate-50/50"} shadow-inner`}
            >
              <p
                className={`text-[0.6rem] sm:text-xs font-black uppercase ${theme === "dark" ? "text-emerald-200 opacity-30" : "text-slate-400 opacity-70"}`}
              >
                معاينة التغييرات
              </p>
              <div
                className="space-y-6 text-center"
                style={{ containerType: "inline-size" }}
              >
                <div className="flex flex-col gap-1.5">
                  <span
                    className={`text-[0.6rem] sm:text-xs font-black uppercase ${theme === "dark" ? "text-emerald-200 opacity-30" : "text-slate-400 opacity-70"}`}
                  >
                    اسم السورة
                  </span>
                  <h3 className="font-black font-serif text-[#ffb900] transition-all text-xl sm:text-2xl">
                    سُورَةُ الفَاتِحَةِ
                  </h3>
                </div>
                <div
                  className={`text-justify font-['Amiri_Quran'] ${theme === "dark" ? "text-emerald-50" : "text-slate-900"} transition-all`}
                  style={{
                    lineHeight: "2.1",
                    fontSize: `${2.47 + fontSize * 0.66}cqi`,
                    textShadow: "0px 0px 0.3px currentColor",
                  }}
                  dir="rtl"
                >
                  <span
                    className={`inline transition-all duration-200`}
                    style={
                      highlightMode === "full"
                        ? {
                            color: "black",
                            padding: "0 1px",
                            margin: "0 -1px",
                            boxDecorationBreak: "clone",
                            WebkitBoxDecorationBreak: "clone",
                            backgroundImage: `linear-gradient(to bottom, transparent 6px, ${
                              theme === "dark"
                                ? "rgba(212, 175, 55, 1)"
                                : "rgba(255, 217, 105, 1)"
                            } 2px, ${
                              theme === "dark"
                                ? "rgba(212, 175, 55, 1)"
                                : "rgba(255, 217, 105, 1)"
                            } calc(100% - 0px), transparent calc(100% - 4px))`,
                            backgroundClip: "padding-box",
                            backgroundColor: "transparent",
                          }
                        : highlightMode === "row"
                          ? {
                              backgroundImage:
                                theme === "dark"
                                  ? "linear-gradient(to bottom, transparent 1.24em, rgba(255, 168, 0, 0.3) 5px, rgba(255, 168, 0, 0.3) calc(100% - 0.4em), transparent calc(100% - 0.5em))"
                                  : "linear-gradient(to bottom, transparent 1.24em, rgba(255, 185, 0, 0.3) 5px, rgba(255, 185, 0, 0.3) calc(100% - 0.4em), transparent calc(100% - 0.5em))",
                              mixBlendMode:
                                theme === "dark" ? "lighten" : "darken",
                            }
                          : highlightMode === "text"
                            ? { color: "#ffb900" }
                            : {}
                    }
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
