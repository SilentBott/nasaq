import { useState, useContext, useRef } from "react";
import { FontContext } from "../FontContext";
import {
  User,
  Users,
  ChevronDown,
  LogOut,
  X,
  Minus,
  Plus,
  Moon,
  Settings,
  RefreshCw,
  Highlighter,
  Layers,
} from "lucide-react";

export default function Dashboard({
  userName,
  myKhatmats,
  setcurrentGroup,
  onLogout,
  onCreate,
  onJoin,
  onLeaveGroup,
}) {
  const {
    fontSize,
    setFontSize,
    theme,
    setTheme,
    themeSetting,
    setThemeSetting,
    streak,
    verseViewMode,
    setVerseViewMode,
    riwaya,
    setRiwaya,
    highlightMode,
    setHighlightMode,
  } = useContext(FontContext);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [jInp, setJInp] = useState("");
  const [nInp, setNInp] = useState("");

  const riwayas = ["Hafs", "Warsh", "Qaloun", "Douri", "Sousi", "Shuba"];
  const riwayaAr = {
    Hafs: "حفص عن عاصم",
    Warsh: "ورش عن نافع",
    Qaloun: "قالون عن نافع",
    Douri: "الدوري عن أبي عمرو",
    Sousi: "السوسي عن أبي عمرو",
    Shuba: "شعبة عن عاصم",
  };
  const hModes = ["row", "full", "text"];
  const hModesAr = { row: "خفيف", full: "كامل", text: "نص" };
  const vModes = ["num", "text", "both"];
  const vModesAr = { num: "رقم", text: "نص", both: "الـ2" };

  const handleLogout = () => {
    localStorage.removeItem("إسم_الحساب");
    window.location.reload();
  };

  const [holdingGroupId, setHoldingGroupId] = useState(null);
  const [holdProgress, setHoldProgress] = useState(0);
  const intervalRef = useRef(null);
  const groupDelayRef = useRef(null);

  // //! نظام السلايدر للخروج من المجموعة بعد حل مشكلة التكرار
  const startGroupHold = (group) => {
    if (intervalRef.current || groupDelayRef.current) return;

    setHoldingGroupId(group.id);
    setHoldProgress(0);

    // ⏳ انتظار 200 ملي ثانية
    groupDelayRef.current = setTimeout(() => {
      let currentVal = 0;
      const step = 100 / (1500 / 50);

      intervalRef.current = setInterval(() => {
        currentVal += step;

        if (currentVal >= 100) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          setHoldProgress(100);
          if (navigator.vibrate) navigator.vibrate(50);

          setTimeout(() => {
            if (
              window.confirm(
                `هل أنت متأكد من الخروج من مجموعة "${group.name}"؟`,
              )
            ) {
              if (onLeaveGroup) onLeaveGroup(group.id);
            }
            setHoldingGroupId(null);
            setHoldProgress(0);
          }, 50);
        } else {
          setHoldProgress(currentVal);
        }
      }, 50);
    }, 200);
  };

  const cancelGroupHold = () => {
    if (groupDelayRef.current) {
      clearTimeout(groupDelayRef.current);
      groupDelayRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setHoldProgress(0);
    setHoldingGroupId(null);
  };
  return (
    <div className="p-6 text-right max-w-2xl mx-auto">
      <header className="flex flex-row justify-between items-center mb-12">
        <h1 className="text-4xl font-black text-amber-500 font-serif tracking-tighter">
          نَسَق
        </h1>
        <div className="flex flex-row-reverse items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="dark:bg-emerald-900/20 bg-white shadow-sm px-5 py-3 rounded-full border flex flex-row-reverse items-center gap-2 hover:scale-105 transition-all"
          >
            <Settings size={18} className="text-amber-500" />
            <span className="font-black opacity-60 text-xs sm:text-sm">
              الإعدادات
            </span>
          </button>
          <button
            onClick={handleLogout}
            className={`p-3 rounded-full border dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20 bg-white text-slate-400`}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="space-y-2">
        <button
          onClick={() => setcurrentGroup({ id: null, name: "ختمتي الشخصية" })}
          className={`w-full ${theme === "dark" ? "bg-emerald-900/10 border-emerald-800" : "bg-white border-slate-200"} border-2 p-8 rounded-[3rem] flex flex-row-reverse justify-between items-center group active:scale-95 shadow-sm`}
        >
          <div className="flex flex-row-reverse items-center gap-5">
            <div className="bg-amber-500/10 p-5 rounded-3xl">
              <User size={28} className="text-amber-500" />
            </div>
            <div>
              <h3 className="font-black font-serif text-xl sm:text-2xl mb-1">
                ختمتي الشخصية
              </h3>
              <p className="text-emerald-600 text-xs sm:text-sm font-bold uppercase font-mono">
                رواية: {riwayaAr[riwaya]}
              </p>
            </div>
          </div>
          <ChevronDown className="rotate-90 text-slate-300" />
        </button>

        {myKhatmats?.map((k) => (
          <button
            key={k.id}
            onClick={() => {
              if (holdProgress === 0) setcurrentGroup(k);
            }}
            onPointerDown={() => startGroupHold(k)}
            onPointerUp={cancelGroupHold}
            onPointerLeave={cancelGroupHold}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full relative overflow-hidden touch-manipulation select-none ${theme === "dark" ? "bg-emerald-900/5 border-emerald-800/50" : "bg-white border-slate-100"} border p-8 rounded-[3rem] flex flex-row-reverse justify-between items-center group active:scale-95 shadow-sm`}
          >
            {holdingGroupId === k.id && holdProgress > 0 && (
              <div
                className="absolute top-0 right-0 bottom-0 bg-red-500/30 z-0 transition-all ease-linear duration-75"
                style={{ width: `${holdProgress}%` }}
              />
            )}

            <div className="flex flex-row-reverse items-center gap-5 relative z-10">
              <div className="bg-emerald-500/5 p-5 rounded-3xl">
                <Users size={28} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="font-black font-serif text-xl sm:text-2xl mb-1">
                  {k.name}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-widest">
                  أنشأها: {k.creator_name}
                </p>
              </div>
            </div>
            <ChevronDown className="rotate-90 text-slate-300 relative z-10" />
          </button>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
          <div className="dark:bg-emerald-900/5 bg-white border border-dashed p-7 rounded-[2.5rem] border-inherit shadow-sm">
            <input
              value={nInp}
              onKeyDown={(e) => e.key === "Enter" && onCreate(nInp)}
              onChange={(e) => setNInp(e.target.value)}
              placeholder="أكتب هنا إسم المجموعة المراد صنعها"
              className="w-full bg-transparent border-b border-emerald-800/20 mb-6 p-2 text-center outline-none font-black text-sm sm:text-base"
            />
            <button
              onClick={() => {
                onCreate(nInp);
                setNInp("");
              }}
              className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black text-[0.7rem] sm:text-xs uppercase shadow-lg"
            >
              إنشاء مجموعة
            </button>
          </div>
          <div className="dark:bg-emerald-900/5 bg-white border border-dashed p-7 rounded-[2.5rem] border-inherit shadow-sm">
            <input
              value={jInp}
              onKeyDown={(e) => e.key === "Enter" && onJoin(jInp)}
              onChange={(e) => setJInp(e.target.value)}
              placeholder="أكتب هنا إسم المجموعة المراد الإنضمام لها"
              className="w-full bg-transparent border-b border-emerald-800/20 mb-6 p-2 text-center outline-none font-black text-sm sm:text-base"
            />
            <button
              onClick={() => {
                onJoin(jInp);
                setJInp("");
              }}
              className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black text-[0.7rem] sm:text-xs uppercase shadow-lg"
            >
              الإنضمام لمجموعة
            </button>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <>
          <style>{`.quran-scroll::-webkit-scrollbar { width: 4px; } .quran-scroll::-webkit-scrollbar-track { background: transparent; margin: 48px 0; } .quran-scroll::-webkit-scrollbar-thumb { background: #ffb900; border-radius: 10px; }`}</style>
          <div
            className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-sm flex items-start justify-center overflow-y-auto px-4 py-12 sm:py-20"
            onClick={() => setIsSettingsOpen(false)}
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
                  onClick={() => setIsSettingsOpen(false)}
                  className={`p-3 rounded-full transition-all active:scale-90 ${theme === "dark" ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  <X size={24} />
                </button>
              </div>
              <div className="space-y-6 relative z-10">
                <div
                  className={`p-6 rounded-3xl border transition-colors ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"} text-center shadow-sm`}
                >
                  <span
                    className={`text-[0.65rem] sm:text-xs font-black uppercase tracking-widest block mb-4 ${theme === "dark" ? "text-emerald-200 opacity-60" : "text-slate-400"}`}
                  >
                    الرواية الحالية
                  </span>
                  <button
                    onClick={() =>
                      setRiwaya(
                        riwayas[(riwayas.indexOf(riwaya) + 1) % riwayas.length],
                      )
                    }
                    className="w-full bg-amber-500 text-emerald-950 py-3.5 rounded-2xl font-black text-xs sm:text-sm shadow-md hover:bg-amber-400 transition-all active:scale-95"
                  >
                    <RefreshCw size={14} className="inline ml-1.5" />
                    {riwayaAr[riwaya]}
                  </button>
                </div>
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
                <button
                  onClick={() => {
                    if (themeSetting === "light") setThemeSetting("dark");
                    else if (themeSetting === "dark") setThemeSetting("auto");
                    else setThemeSetting("light");
                  }}
                  className={`w-full mt-6 p-6 rounded-[2.5rem] flex justify-between items-center border font-black transition-all shadow-sm active:scale-95 ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/20 text-emerald-100 hover:bg-amber-500/10" : "bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200"}`}
                >
                  <span className="tracking-wide">
                    {themeSetting === "dark"
                      ? "الوضع الليلي 🌙"
                      : themeSetting === "light"
                        ? "الوضع النهاري ☀️"
                        : "المظهر التلقائي ⚙️"}
                  </span>
                  <Moon
                    size={20}
                    className={
                      theme === "dark" ? "text-emerald-300" : "text-slate-500"
                    }
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
                    {" "}
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
                    <div
                      className={`flex flex-col gap-1.5 border-t pt-5 ${theme === "dark" ? "border-emerald-500/10" : "border-slate-200"}`}
                    >
                      <span
                        className={`text-[0.6rem] sm:text-xs font-black uppercase ${theme === "dark" ? "text-emerald-200 opacity-30" : "text-slate-400 opacity-70"}`}
                      >
                        الخط الثانوي
                      </span>
                      <p
                        className={`font-black transition-all text-xs sm:text-sm ${theme === "dark" ? "text-emerald-100 opacity-60" : "text-slate-500"}`}
                      >
                        تمت قراءة 15 آية بواسطة يوسف
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
