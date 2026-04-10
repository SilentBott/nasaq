import { useState, useContext } from "react";
import { FontContext } from "../App";
import {
  User,
  Users,
  ChevronDown,
  LogOut,
  X,
  Minus,
  Plus,
  Moon,
  Sun,
  Settings,
  Flame,
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
}) {
  const {
    fontSize,
    setFontSize,
    theme,
    setTheme,
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
  const hModes = ["text", "row"];
  const hModesAr = { text: "سطر", row: "كل" };
  const vModes = ["num", "text", "both"];
  const vModesAr = { num: "رقم", text: "نص", both: "الـ2" };

  return (
    <div className="p-6 text-right max-w-2xl mx-auto">
      <header className="flex flex-row-reverse justify-between items-center mb-12">
        <h1 className="text-4xl font-black text-amber-500 font-serif tracking-tighter">
          نَسَق
        </h1>
        <div className="flex flex-row-reverse items-center gap-3">
          {streak > 0 && (
            <div className="flex items-center gap-1.5 px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-500 shadow-inner">
              <Flame size={20} fill="currentColor" />{" "}
              <span className="font-black text-sm">{streak}</span>
            </div>
          )}
          <button
            onClick={onLogout}
            className={`p-3 rounded-full border dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20 bg-white text-slate-400`}
          >
            <LogOut size={20} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="dark:bg-emerald-900/20 bg-white shadow-sm px-5 py-3 rounded-full border flex flex-row-reverse items-center gap-2 hover:scale-105 transition-all"
          >
            <Settings size={18} className="text-amber-500" />
            <span className="font-black opacity-60 text-xs">الإعدادات</span>
          </button>
        </div>
      </header>

      <div className="space-y-5">
        <button
          onClick={() => setcurrentGroup({ id: null, name: "ختمتي الشخصية" })}
          className={`w-full ${theme === "dark" ? "bg-emerald-900/10 border-emerald-800" : "bg-white border-slate-200"} border-2 p-8 rounded-[3rem] flex flex-row-reverse justify-between items-center group active:scale-95 shadow-sm`}
        >
          <div className="flex flex-row-reverse items-center gap-4">
            <div className="bg-amber-500/10 p-5 rounded-3xl">
              <User className="text-amber-500" />
            </div>
            <div>
              <h3 className="font-black font-serif text-lg">ختمتي الشخصية</h3>
              <p className="text-emerald-600 text-xs font-bold uppercase font-mono">
                riwaya: {riwayaAr[riwaya]}
              </p>
            </div>
          </div>
          <ChevronDown className="rotate-90 text-slate-300" />
        </button>
        {myKhatmats?.map((k) => (
          <button
            key={k.id}
            onClick={() => setcurrentGroup(k)}
            className={`w-full ${theme === "dark" ? "bg-emerald-900/5 border-emerald-800/50" : "bg-white border-slate-100"} border p-8 rounded-[3rem] flex flex-row-reverse justify-between items-center group active:scale-95 shadow-sm`}
          >
            <div className="flex flex-row-reverse items-center gap-4">
              <div className="bg-emerald-500/5 p-5 rounded-3xl">
                <Users className="text-emerald-500" />
              </div>
              <div>
                <h3 className="font-black font-serif text-lg">{k.name}</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                  by: {k.creator_name}
                </p>
              </div>
            </div>
            <ChevronDown className="rotate-90 text-slate-300" />
          </button>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
          <div className="dark:bg-emerald-900/5 bg-white border border-dashed p-7 rounded-[2.5rem] border-inherit shadow-sm">
            <input
              value={jInp}
              onKeyDown={(e) => e.key === "Enter" && onJoin(jInp)}
              onChange={(e) => setJInp(e.target.value)}
              placeholder="اسم الختمة بالضبط"
              className="w-full bg-transparent border-b border-emerald-800/20 mb-6 p-2 text-center outline-none font-black text-sm"
            />
            <button
              onClick={() => onJoin(jInp)}
              className="w-full bg-amber-500 text-emerald-950 py-4 rounded-2xl font-black text-xs uppercase shadow-lg"
            >
              انضمام
            </button>
          </div>
          <div className="dark:bg-emerald-900/5 bg-white border border-dashed p-7 rounded-[2.5rem] border-inherit shadow-sm">
            <input
              value={nInp}
              onKeyDown={(e) => e.key === "Enter" && onCreate(nInp)}
              onChange={(e) => setNInp(e.target.value)}
              placeholder="اسم مجموعة جديدة"
              className="w-full bg-transparent border-b border-emerald-800/20 mb-6 p-2 text-center outline-none font-black text-sm"
            />
            <button
              onClick={() => onCreate(nInp)}
              className="w-full bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg"
            >
              إنشاء
            </button>
          </div>
        </div>
      </div>

      {isSettingsOpen && (
        <div
          className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setIsSettingsOpen(false)}
        >
          <div
            className={`${theme === "dark" ? "bg-[#04120a] border-emerald-900" : "bg-white border-slate-200"} border-2 p-10 rounded-[3.5rem] w-full max-w-md shadow-2xl animate-in zoom-in`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-10 px-2">
              <button
                onClick={() => setIsSettingsOpen(false)}
                className={`p-3 rounded-full transition-all ${theme === "dark" ? "bg-emerald-900/40 text-emerald-400" : "bg-slate-100 text-slate-400"}`}
              >
                <X size={24} />
              </button>
              <h2 className="text-2xl font-black text-amber-500 font-serif">
                الإعدادات
              </h2>
            </div>
            <div className="space-y-6">
              <div className="p-5 dark:bg-emerald-900/40 bg-slate-50 rounded-3xl border border-inherit text-center">
                <span className="text-[9px] font-black opacity-40 uppercase block mb-3 tracking-widest">
                  الرواية الحالية
                </span>
                <button
                  onClick={() =>
                    setRiwaya(
                      riwayas[(riwayas.indexOf(riwaya) + 1) % riwayas.length],
                    )
                  }
                  className="w-full bg-amber-500 text-emerald-950 py-3 rounded-2xl font-black text-[11px] shadow-md transition-all active:scale-95"
                >
                  <RefreshCw size={14} className="inline ml-1" />{" "}
                  {riwayaAr[riwaya]}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 dark:bg-emerald-900/20 bg-slate-50 rounded-2xl border border-inherit text-center flex flex-col gap-3">
                  <span className="text-[9px] font-black opacity-40 uppercase">
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
                    className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-black text-[10px] shadow-md transition-all active:scale-95"
                  >
                    <Highlighter size={12} className="inline ml-1" />{" "}
                    {hModesAr[highlightMode]}
                  </button>
                </div>
                <div className="p-4 dark:bg-emerald-900/20 bg-slate-50 rounded-2xl border border-inherit text-center flex flex-col gap-3">
                  <span className="text-[9px] font-black opacity-40 uppercase">
                    عرض الآيات
                  </span>
                  <button
                    onClick={() =>
                      setVerseViewMode(
                        vModes[
                          (vModes.indexOf(verseViewMode) + 1) % vModes.length
                        ],
                      )
                    }
                    className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-black text-[10px] shadow-md transition-all active:scale-95"
                  >
                    <Layers size={12} className="inline ml-1" />{" "}
                    {vModesAr[verseViewMode]}
                  </button>
                </div>
              </div>
              <div className="p-6 dark:bg-emerald-900/20 bg-slate-50 rounded-[2.5rem] border border-inherit flex items-center justify-between shadow-inner">
                <button
                  onClick={() => setFontSize((f) => Math.max(12, f - 2))}
                  className="p-4 bg-emerald-600 rounded-2xl text-white active:scale-90 shadow-lg"
                >
                  <Minus size={22} />
                </button>
                <span
                  className={`text-4xl font-black ${theme === "dark" ? "text-amber-500" : "text-emerald-700"} font-mono`}
                >
                  {fontSize}
                </span>
                <button
                  onClick={() => setFontSize((f) => Math.min(36, f + 2))}
                  className="p-4 bg-emerald-600 rounded-2xl text-white active:scale-90 shadow-lg"
                >
                  <Plus size={22} />
                </button>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="w-full bg-emerald-900/10 p-6 rounded-[2.5rem] flex justify-between items-center border border-emerald-800/30 font-black transition-all hover:bg-amber-500/10 shadow-sm"
              >
                <span>
                  {theme === "dark" ? "الوضع الليلي 🌙" : "الوضع النهاري ☀️"}
                </span>
                <Moon size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
