import {
  useState,
  useEffect,
  useCallback,
  useRef,
  createContext,
  useMemo,
} from "react";
import { supabase } from "./lib/supabase";
import { SURAHS } from "./data/surahs";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import SurahCard from "./components/SurahCard";
import KhatmahModal from "./components/KhatmahModal";
import {
  ArrowRight,
  Info,
  Home,
  BookText,
  Flame,
  Users,
  Calendar,
  AlertTriangle,
  X,
} from "lucide-react";
import { FontContext } from "./FontContext";

const HoldToConfirmButton = ({ onConfirm, theme }) => {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const startHold = () => {
    setProgress(0);
    const step = 100 / (10000 / 100); // 10 ثواني = 10000 ملي ثانية
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev + step >= 100) {
          clearInterval(timerRef.current);
          onConfirm();
          return 100;
        }
        return prev + step;
      });
    }, 100);
  };

  const stopHold = () => {
    clearInterval(timerRef.current);
    setProgress(0);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl">
      <button
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onContextMenu={(e) => e.preventDefault()}
        className={`relative z-10 w-full py-4 font-black text-xs sm:text-sm transition-all select-none touch-manipulation ${theme === "dark" ? "bg-red-900/40 text-red-300 border border-red-800/50" : "bg-red-50 text-red-600 border border-red-200"}`}
      >
        إزالة كل ما قرأته في المجموعة (اضغط باستمرار 10 ثوانٍ)
      </button>
      <div
        className="absolute top-0 bottom-0 left-0 bg-red-600 transition-all ease-linear duration-100 z-0 opacity-50"
        style={{ width: `${progress}%` }}
      ></div>
    </div>
  );
};

export default function App() {
  const getUniqueVersesCount = (surahLogs) => {
    if (!surahLogs || !Array.isArray(surahLogs)) return 0;
    const covered = new Set();
    surahLogs.forEach((l) => {
      if (l.verse_start && l.verse_end)
        for (let i = l.verse_start; i <= l.verse_end; i++) covered.add(i);
    });
    return covered.size;
  };

  const [userName, setUserName] = useState(
    () => localStorage.getItem("إسم_الحساب") || "",
  );
  const [view, setView] = useState("main");
  const [loginNameInput, setLoginNameInput] = useState("");
  const [fontSize, setFontSize] = useState(() => {
    const saved = Number(localStorage.getItem("font-size"));
    return saved >= 3 && saved <= 10 ? saved : 5;
  });
  const [theme, setTheme] = useState(
    () => localStorage.getItem("nasaq-theme") || "dark",
  );
  const [streak, setStreak] = useState(
    () => Number(localStorage.getItem("nasaq-streak")) || 0,
  );
  const [riwaya, setRiwaya] = useState(
    () => localStorage.getItem("nasaq-riwaya") || "Hafs",
  );
  const [highlightMode, setHighlightMode] = useState(
    () => localStorage.getItem("nasaq-h-mode") || "row",
  );
  const [verseViewMode, setVerseViewMode] = useState(
    () => localStorage.getItem("nasaq-verse-mode") || "both",
  );

  const [quranData, setQuranData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentGroup, setcurrentGroup] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [myKhatmats, setMyKhatmats] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [vRanges, setVRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [quickRegister, setQuickRegister] = useState(false);

  const riwayaAr = {
    Hafs: "حفص عن عاصم",
    Warsh: "ورش عن نافع",
    Qaloun: "قالون عن نافع",
    Douri: "الدوري عن أبي عمرو",
    Sousi: "السوسي عن أبي عمرو",
    Shuba: "شعبة عن عاصم",
  };

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 640;
      let multiplier = 1;
      if (fontSize < 5) multiplier = 0.6 + (fontSize - 3) * 0.2;
      else multiplier = 1 + ((fontSize - 5) / 5) * (isMobile ? 0.4 : 1.5);
      document.documentElement.style.fontSize = `${16 * multiplier}px`;
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    localStorage.setItem("font-size", fontSize);
    localStorage.setItem("nasaq-theme", theme);
    localStorage.setItem("nasaq-streak", streak);
    localStorage.setItem("nasaq-riwaya", riwaya);
    localStorage.setItem("nasaq-h-mode", highlightMode);
    localStorage.setItem("nasaq-verse-mode", verseViewMode);
    return () => window.removeEventListener("resize", handleResize);
  }, [fontSize, theme, streak, riwaya, highlightMode, verseViewMode]);

  useEffect(() => {
    async function loadQuran() {
      setDataLoading(true);
      try {
        const mod = await import(`./data/${riwaya}.json`);
        setQuranData(mod.default || []);
      } catch (e) {
        console.error(e);
      } finally {
        setDataLoading(false);
      }
    }
    loadQuran();
  }, [riwaya]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") {
        setSelected(null);
        setQuickRegister(false);
        setShowGroupInfo(false);
        if (view === "about") setView("main");
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [view]);

  const calculateGlobalProgress = () => {
    const total = 6236;
    const covered = new Set();
    (logs || []).forEach((l) => {
      if (l.verse_start && l.verse_end)
        for (let i = l.verse_start; i <= l.verse_end; i++)
          covered.add(`${l.surah_id}-${i}`);
    });
    return ((covered.size / total) * 100).toFixed(1);
  };

  const fetchData = useCallback(async () => {
    if (!userName) return;
    const { data: members } = await supabase
      .from("khatmah_members")
      .select("khatmah_id")
      .eq("user_name", userName);
    const ids = (members || []).map((m) => m.khatmah_id);
    const { data: khatmats } = await supabase
      .from("khatmats")
      .select("*")
      .or(
        `creator_name.eq."${userName}",id.in.(${ids.length ? ids.join(",") : "00000000-0000-0000-0000-000000000000"})`,
      );
    setMyKhatmats(khatmats || []);
    if (currentGroup && currentGroup.id) {
      const { data } = await supabase
        .from("khatmah_logs")
        .select("*")
        .eq("khatmah_id", currentGroup.id)
        .order("created_at", { ascending: true });
      setLogs(data || []);
    } else {
      setLogs([]);
    }
  }, [userName, currentGroup]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openModal = (surah, startAya = null) => {
    if (!surah) return;
    setSelected(surah);
    setQuickRegister(false);
    const occ = new Set();
    (logs || [])
      .filter((l) => l.surah_id === surah.id)
      .forEach((l) => {
        for (let i = l.verse_start; i <= l.verse_end; i++) occ.add(i);
      });
    if (startAya) {
      setVRanges([
        { id: null, start: startAya, end: 0, isActive: true, isSaved: false },
      ]);
      return;
    }
    const my = (logs || []).filter(
      (l) => l.surah_id === surah.id && l.user_name === userName,
    );
    if (my?.length > 0)
      setVRanges([
        ...my.map((l) => ({
          id: l.id,
          start: l.verse_start,
          end: l.verse_end,
          isActive: true,
          isSaved: true,
        })),
        { id: null, start: 0, end: 0, isActive: false, isSaved: false },
      ]);
    else {
      let f = 1;
      while (occ.has(f) && f <= (surah?.ayat || 0)) f++;
      setVRanges([
        {
          id: null,
          start: f <= (surah?.ayat || 0) ? f : 0,
          end: 0,
          isActive: true,
          isSaved: false,
        },
      ]);
    }
  };

  const handleLongPress = async (surah) => {
    if (navigator.vibrate) navigator.vibrate(50);
    const sLogs = (logs || []).filter((l) => l.surah_id === surah.id);
    if (getUniqueVersesCount(sLogs) >= surah.ayat) return;
    if (!window.confirm(`هل أنت متأكد من ختم سورة ${surah.name_ar} بالكامل؟`))
      return;
    setLoading(true);
    await supabase.from("khatmah_logs").insert([
      {
        surah_id: surah.id,
        user_name: userName,
        status: "completed",
        verse_start: 1,
        verse_end: surah.ayat,
        khatmah_id: currentGroup.id,
      },
    ]);
    fetchData();
    setLoading(false);
  };

  const leaveGroup = async (groupId) => {
    await supabase
      .from("khatmah_members")
      .delete()
      .eq("khatmah_id", groupId)
      .eq("user_name", userName);
    setcurrentGroup(null);
    fetchData();
  };

  const filteredSurahs = SURAHS.filter((s) => {
    if (filter === "all") return true;
    const sLogs = (logs || []).filter((l) => l.surah_id === s.id);
    const isCompleted =
      getUniqueVersesCount(sLogs) >= (s?.ayat || 0) ||
      sLogs.some((l) => l.status === "completed");
    if (filter === "completed") return isCompleted;
    if (filter === "remaining") return !isCompleted;
    if (filter === "mine") return !isCompleted && sLogs.length > 0;
    return true;
  });

  const groupStats = useMemo(() => {
    if (!logs || logs.length === 0)
      return { totalVerses: 0, completedSurahs: 0, users: {} };
    const totalVerses = new Set();
    const completedSurahsCount = SURAHS.filter((s) => {
      const sLogs = logs.filter((l) => l.surah_id === s.id);
      return (
        getUniqueVersesCount(sLogs) >= s.ayat ||
        sLogs.some((l) => l.status === "completed")
      );
    }).length;
    const usersStats = {};
    logs.forEach((l) => {
      if (l.verse_start && l.verse_end) {
        for (let i = l.verse_start; i <= l.verse_end; i++)
          totalVerses.add(`${l.surah_id}-${i}`);
        usersStats[l.user_name] =
          (usersStats[l.user_name] || 0) + (l.verse_end - l.verse_start + 1);
      }
    });
    return {
      totalVerses: totalVerses.size,
      completedSurahs: completedSurahsCount,
      users: usersStats,
    };
  }, [logs]);

  return (
    <FontContext.Provider
      value={{
        fontSize,
        setFontSize,
        theme,
        setTheme,
        streak,
        setStreak,
        verseViewMode,
        setVerseViewMode,
        riwaya,
        setRiwaya,
        highlightMode,
        setHighlightMode,
        quranData,
        dataLoading,
        getUniqueVersesCount,
      }}
    >
      <div
        dir="rtl"
        className={`min-h-screen overflow-x-hidden w-full transition-all ${theme === "dark" ? "bg-[#042f24] text-white" : "bg-emerald-50 text-slate-900"}`}
      >
        {!userName ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center relative pb-24">
            <Auth
              theme={theme}
              loginNameInput={loginNameInput}
              setLoginNameInput={setLoginNameInput}
              onLogin={() => {
                if (loginNameInput) {
                  localStorage.setItem("إسم_الحساب", loginNameInput);
                  setUserName(loginNameInput);
                  fetchData();
                }
              }}
            />
            <footer className="absolute bottom-8 w-full text-center left-0 right-0">
              <button
                onClick={() => setView("about")}
                className="opacity-40 hover:opacity-100 font-black text-xs flex items-center gap-2 mx-auto"
              >
                <Info size={14} /> عن نَسَق
              </button>
            </footer>
            {view === "about" && (
              <div
                className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-sm flex items-start justify-center overflow-y-auto px-4 py-12 sm:py-20"
                onClick={() => setView("main")}
              >
                <div className="w-full max-w-2xl my-auto">
                  <AboutView theme={theme} onClose={() => setView("main")} />
                </div>
              </div>
            )}
          </div>
        ) : !currentGroup ? (
          <div className="relative min-h-screen max-w-3xl mx-auto flex flex-col p-4 sm:p-8">
            <Dashboard
              userName={userName}
              myKhatmats={myKhatmats}
              setcurrentGroup={setcurrentGroup}
              onLeaveGroup={leaveGroup}
              onLogout={() => {}}
              onCreate={async (name) => {
                if (!name.trim()) return;
                try {
                  const { data: check } = await supabase
                    .from("khatmats")
                    .select("id")
                    .eq("name", name.trim());
                  if (check && check.length > 0)
                    return alert("هذا الاسم موجود بالفعل، اختر اسماً آخر.");
                  const { data, error } = await supabase
                    .from("khatmats")
                    .insert([{ name: name.trim(), creator_name: userName }])
                    .select();
                  if (error) throw error;
                  if (data && data[0]) {
                    setcurrentGroup(data[0]);
                    fetchData();
                  }
                } catch (err) {
                  console.error("Create Error:", err.message);
                }
              }}
              onJoin={async (name) => {
                if (!name.trim()) return;
                try {
                  const { data: groups, error: gErr } = await supabase
                    .from("khatmats")
                    .select("*")
                    .eq("name", name.trim());
                  if (gErr) throw gErr;
                  if (!groups || groups.length === 0)
                    return alert("لم يتم العثور على مجموعة بهذا الاسم.");
                  const target = groups[0];
                  const { data: memberCheck } = await supabase
                    .from("khatmah_members")
                    .select("*")
                    .eq("khatmah_id", target.id)
                    .eq("user_name", userName);
                  if (!memberCheck || memberCheck.length === 0) {
                    await supabase
                      .from("khatmah_members")
                      .insert([{ khatmah_id: target.id, user_name: userName }]);
                  }
                  setcurrentGroup(target);
                  fetchData();
                } catch (err) {
                  console.error("Join Error:", err.message);
                }
              }}
            />
            <footer className="text-center mt-auto">
              <button
                onClick={() => setView("about")}
                className="opacity-40 hover:opacity-100 font-black text-xs flex items-center gap-2 mx-auto"
              >
                <Info size={14} /> عن نَسَق
              </button>
            </footer>
            {view === "about" && (
              <div
                className="fixed inset-0 z-[300] bg-black/20 backdrop-blur-sm flex items-start justify-center overflow-y-auto px-4 py-12 sm:py-20"
                onClick={() => setView("main")}
              >
                <div className="w-full max-w-2xl my-auto">
                  <AboutView theme={theme} onClose={() => setView("main")} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-3xl mx-auto flex flex-col min-h-screen p-4 sm:p-8">
            <header
              className={`relative z-[100] border-b py-4 transition-all rounded-3xl px-2 sm:px-4 ${theme === "dark" ? "bg-[#042f24] border-emerald-900/50" : "bg-white border-slate-200 shadow-sm"}`}
            >
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-3">
                  <button
                    onClick={() => setcurrentGroup(null)}
                    className={`p-2.5 rounded-xl transition-all active:scale-90 ${theme === "dark" ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                  >
                    <ArrowRight size={20} />
                  </button>
                  <div
                    className="flex flex-col text-right cursor-pointer hover:opacity-80 transition-all"
                    onClick={() => setShowGroupInfo(true)}
                  >
                    <div className="flex items-center gap-2">
                      <h1
                        className={`font-black text-xl sm:text-2xl font-serif tracking-tight ${theme === "dark" ? "text-[#ffb900]" : "text-emerald-700"}`}
                      >
                        {currentGroup.name}
                      </h1>
                      <Info
                        size={16}
                        className={
                          theme === "dark"
                            ? "text-emerald-500"
                            : "text-slate-400"
                        }
                      />
                    </div>
                    <span
                      className={`font-bold text-[0.65rem] sm:text-xs ${theme === "dark" ? "text-emerald-100/50" : "text-slate-500"}`}
                    >
                      رواية: {riwayaAr[riwaya]} • {userName}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 flex-row-reverse">
                  <div
                    className={`font-black text-sm sm:text-lg ${theme === "dark" ? "text-emerald-400" : "text-emerald-600"}`}
                  >
                    {calculateGlobalProgress()}%
                  </div>
                  {streak > 0 && (
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-inner ${theme === "dark" ? "bg-orange-500/10 border border-orange-500/20 text-orange-500" : "bg-orange-50 border border-orange-200 text-orange-600"}`}
                    >
                      <Flame size={18} fill="currentColor" />{" "}
                      <span className="font-black text-xs sm:text-sm">
                        {streak}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div
                className={`absolute bottom-[-2px] left-0 h-1.5 transition-all duration-1000 rounded-full ${theme === "dark" ? "bg-emerald-500 shadow-[0_0_15px_2px_rgba(16,185,129,0.9)]" : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]"}`}
                style={{ width: `${calculateGlobalProgress()}%` }}
              />
            </header>

            <main className="pb-12 flex-grow">
              {view === "about" ? (
                <AboutView theme={theme} onClose={() => setView("main")} />
              ) : (
                <>
                  <div className="flex flex-row justify-between items-center mb-5 mt-3 px-2">
                    <div className="flex flex-row flex-wrap gap-2 sm:gap-3 max-w-[80%]">
                      {[
                        { id: "all", label: "كلّ السور" },
                        { id: "mine", label: "لم ننهها" },
                        { id: "remaining", label: "باقي السور" },
                        { id: "completed", label: "أُنهت" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setFilter(t.id)}
                          className={`px-4 sm:px-5 py-2 rounded-full font-black border transition-all text-xs sm:text-base ${filter === t.id ? "bg-[#ffb900] text-emerald-950 border-[#ffb900] shadow-md scale-105" : theme === "dark" ? "bg-emerald-900/10 border-emerald-800 text-emerald-500 hover:bg-emerald-900/30" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"}`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setQuickRegister(true)}
                      className={`font-black border-b-[3px] sm:border-b-4 pb-1 active:scale-95 transition-all text-xl sm:text-2xl whitespace-nowrap ${theme === "dark" ? "text-emerald-400 border-emerald-400" : "text-emerald-700 border-emerald-700"}`}
                    >
                      تسجيل سريع
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {filteredSurahs.map((s) => (
                      <SurahCard
                        key={s.id}
                        s={s}
                        logs={logs}
                        userName={userName}
                        onClick={openModal}
                        onLongPress={handleLongPress}
                      />
                    ))}
                  </div>
                </>
              )}
            </main>
            <footer className="py-4 text-center border-t border-emerald-500/5">
              <button
                onClick={() => setView("about")}
                className="opacity-40 hover:opacity-100 font-black text-xs flex items-center gap-2 mx-auto"
              >
                <Info size={14} /> عن نَسَق
              </button>
            </footer>

            <KhatmahModal
              selected={selected}
              setSelected={setSelected}
              quickRegister={quickRegister}
              setQuickRegister={setQuickRegister}
              logs={logs}
              userName={userName}
              vRanges={vRanges}
              setVRanges={setVRanges}
              loading={loading}
              onClaim={async () => {
                setLoading(true);
                const active = (vRanges || []).filter(
                  (r) => r.isActive && !r.isSaved && r.start > 0 && r.end > 0,
                );
                const inserts = active.map((r) => ({
                  surah_id: selected.id,
                  user_name: userName,
                  status: "reading",
                  verse_start: r.start,
                  verse_end: r.end,
                  khatmah_id: currentGroup.id,
                }));
                if (inserts.length > 0)
                  await supabase.from("khatmah_logs").insert(inserts);
                fetchData();
                setLoading(false);
                setSelected(null);
                setQuickRegister(false);
              }}
              onDeleteRange={async (id) => {
                await supabase.from("khatmah_logs").delete().eq("id", id);
                fetchData();
              }}
              onDeleteAll={async () => {
                if (window.confirm("حذف كل قراءاتك؟"))
                  await supabase
                    .from("khatmah_logs")
                    .delete()
                    .match({ surah_id: selected.id, user_name: userName });
                fetchData();
                setSelected(null);
              }}
              getOccupiedVerses={(id) => {
                const occ = new Set();
                (logs || [])
                  .filter((l) => l.surah_id === id)
                  .forEach((log) => {
                    for (let i = log.verse_start; i <= log.verse_end; i++)
                      occ.add(i);
                  });
                return occ;
              }}
              openModal={openModal}
            />

            {/* //! نافذة معلومات المجموعة بعد التعديل (ستايل الإعدادات + ترتيب تنازلي) */}
            {showGroupInfo && (
              <div
                className="fixed inset-0 z-[400] bg-black/20 backdrop-blur-sm flex items-start justify-center overflow-y-auto px-4 py-12 sm:py-20"
                onClick={() => setShowGroupInfo(false)}
              >
                <div
                  className={`w-full max-w-md my-auto h-fit max-h-[85vh] overflow-y-auto quran-scroll p-8 sm:p-10 rounded-[3.5rem] border shadow-2xl relative z-10 ${theme === "dark" ? "bg-gradient-to-b from-[#064e3b] to-[#022a1d] border-emerald-700/40 text-emerald-50" : "bg-gradient-to-b from-white to-slate-50 border-slate-200 text-slate-800"}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-8 px-2 relative z-10">
                    <h2
                      className={`text-2xl sm:text-3xl font-black font-serif ${theme === "dark" ? "text-[#ffb900]" : "text-emerald-700"}`}
                    >
                      معلومات المجموعة
                    </h2>
                    <button
                      onClick={() => setShowGroupInfo(false)}
                      className={`p-3 rounded-full transition-all active:scale-90 ${theme === "dark" ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div
                      className={`p-5 rounded-3xl border flex justify-between items-center shadow-sm ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"}`}
                    >
                      <div className="flex flex-col gap-1 text-right">
                        <span className="text-xs font-black opacity-50 uppercase tracking-widest">
                          تاريخ الإنشاء
                        </span>
                        <span className="font-bold">
                          {new Date(
                            currentGroup.created_at || Date.now(),
                          ).toLocaleDateString("ar-EG")}
                        </span>
                      </div>
                      <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                        <Calendar size={24} />
                      </div>
                    </div>

                    <div
                      className={`p-5 rounded-3xl border shadow-sm ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"}`}
                    >
                      <h4 className="text-[0.65rem] sm:text-xs font-black opacity-60 uppercase mb-4 text-right tracking-widest">
                        الأعضاء ومساهماتهم
                      </h4>
                      <div className="space-y-3 max-h-48 overflow-y-auto quran-scroll pr-2">
                        {/* //! الترتيب السحري: تنازلي من الأعلى للأقل بلملي */}
                        {Object.entries(groupStats.users)
                          .sort((a, b) => b[1] - a[1])
                          .map(([user, count], idx) => {
                            const percentage =
                              groupStats.totalVerses > 0
                                ? (
                                    (count / groupStats.totalVerses) *
                                    100
                                  ).toFixed(1)
                                : 0;
                            return (
                              <div
                                key={idx}
                                className="flex justify-between items-center"
                              >
                                <span className="font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-lg text-emerald-500">
                                  {percentage}%
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-black text-sm">
                                    {user}
                                  </span>
                                  {user === currentGroup.creator_name && (
                                    <span className="text-[0.6rem] bg-amber-500 text-emerald-950 px-2 py-0.5 rounded-full font-black">
                                      المنشئ
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div
                        className={`p-4 rounded-2xl border shadow-sm ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"}`}
                      >
                        <span className="block text-2xl font-black text-emerald-500 mb-1">
                          {calculateGlobalProgress()}%
                        </span>
                        <span className="text-[0.65rem] font-black opacity-50">
                          النسبة
                        </span>
                      </div>
                      <div
                        className={`p-4 rounded-2xl border shadow-sm ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"}`}
                      >
                        <span className="block text-2xl font-black text-emerald-500 mb-1">
                          {groupStats.completedSurahs}
                        </span>
                        <span className="text-[0.65rem] font-black opacity-50">
                          سور تامة
                        </span>
                      </div>
                      <div
                        className={`p-4 rounded-2xl border shadow-sm ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"}`}
                      >
                        <span className="block text-2xl font-black text-emerald-500 mb-1">
                          {groupStats.totalVerses}
                        </span>
                        <span className="text-[0.65rem] font-black opacity-50">
                          آيات
                        </span>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-dashed border-red-500/30 space-y-3">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              "متأكد من الخروج؟ (قراءاتك ستظل محفوظة)",
                            )
                          ) {
                            leaveGroup(currentGroup.id);
                            setShowGroupInfo(false);
                          }
                        }}
                        className={`w-full p-4 rounded-2xl font-black text-sm transition-all shadow-sm ${theme === "dark" ? "bg-slate-800/50 hover:bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-800"}`}
                      >
                        الخروج من المجموعة
                      </button>
                      <HoldToConfirmButton
                        theme={theme}
                        onConfirm={async () => {
                          await supabase
                            .from("khatmah_logs")
                            .delete()
                            .eq("khatmah_id", currentGroup.id)
                            .eq("user_name", userName);
                          fetchData();
                          setShowGroupInfo(false);
                          alert("تم مسح قراءاتك بنجاح.");
                        }}
                      />
                      {currentGroup.creator_name === userName && (
                        <button
                          onClick={async () => {
                            if (
                              window.confirm(
                                "هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد من تصفير الختمة؟",
                              )
                            ) {
                              await supabase
                                .from("khatmah_logs")
                                .delete()
                                .eq("khatmah_id", currentGroup.id);
                              fetchData();
                              setShowGroupInfo(false);
                            }
                          }}
                          className={`w-full p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${theme === "dark" ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                        >
                          <AlertTriangle size={18} /> إعادة تعيين للجميع (تصفير)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </FontContext.Provider>
  );
}

function AboutView({ theme, onClose }) {
  const isDark = theme === "dark";
  return (
    <>
      <style>{`.quran-scroll::-webkit-scrollbar { width: 4px; } .quran-scroll::-webkit-scrollbar-track { background: transparent; margin: 48px 0; } .quran-scroll::-webkit-scrollbar-thumb { background: #ffb900; border-radius: 10px; }`}</style>
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className={`w-full h-fit max-h-[85vh] overflow-y-auto quran-scroll p-8 ps-10 sm:p-12 sm:ps-14 rounded-[3rem] border text-right shadow-2xl relative z-10 ${isDark ? "bg-gradient-to-b from-[#064e3b] to-[#022a1d] border-emerald-700/40 text-emerald-50" : "bg-gradient-to-b from-emerald-50 to-white border-emerald-200 text-slate-800"}`}
      >
        {isDark && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
        )}
        <button
          onClick={onClose}
          className={`absolute top-6 left-6 p-3 rounded-full active:scale-95 transition-all z-20 ${isDark ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
        >
          <Home size={22} />
        </button>
        <div className="flex flex-col items-center gap-4 mb-10 text-center relative z-10">
          <div
            className={`p-5 rounded-full border shadow-inner ${isDark ? "bg-[#ffb900]/10 border-[#ffb900]/20" : "bg-emerald-100 border-emerald-200"}`}
          >
            <BookText
              size={48}
              className={isDark ? "text-[#ffb900]" : "text-emerald-700"}
            />
          </div>
          <h2
            className={`text-4xl font-black font-serif tracking-tighter ${isDark ? "text-[#ffb900]" : "text-emerald-800"}`}
          >
            نَسَق
          </h2>
          <span
            className={`font-mono text-[0.65rem] sm:text-xs tracking-widest uppercase font-bold px-4 py-1.5 rounded-full border ${isDark ? "bg-emerald-900/40 border-emerald-800/50 text-emerald-400" : "bg-emerald-100 border-emerald-200 text-emerald-700"}`}
          >
            Nasaq Platform
          </span>
        </div>
        <div className="space-y-4 text-sm sm:text-base font-bold leading-loose relative z-10">
          <div
            className={`p-6 rounded-3xl border shadow-sm ${isDark ? "bg-emerald-900/30 border-emerald-500/10" : "bg-white border-emerald-100"}`}
          >
            <p>
              <span
                className={`text-lg font-black ${isDark ? "text-[#ffb900]" : "text-emerald-700"}`}
              >
                «نَسَق»
              </span>{" "}
              هي منصة ذكية صُممت لتنظيم خِتمتك القرآنية، ومتابعة وردك اليومي
              بيسر وسهولة، سواء كنت تقرأ بمفردك أو ضمن مجموعة.
            </p>
          </div>
          <div
            className={`p-6 rounded-3xl border shadow-sm ${isDark ? "bg-emerald-900/30 border-emerald-500/10" : "bg-white border-emerald-100"}`}
          >
            <p>
              يتيح لك النظام إنشاء مجموعات قراءة ومزامنة الإنجاز مع أصحابك{" "}
              <span
                className={`border-b border-dashed pb-1 ${isDark ? "text-amber-400 border-amber-400/50" : "text-emerald-600 border-emerald-600/50"}`}
              >
                لحظياً
              </span>
              ، مما يعين على التنافس المحمود والالتزام المستمر.
            </p>
          </div>
        </div>
        <footer
          className={`mt-12 pt-8 border-t text-center space-y-3 relative z-10 ${isDark ? "border-emerald-700/30" : "border-emerald-200"}`}
        >
          <p
            className={`text-[0.65rem] sm:text-xs opacity-60 font-black ${isDark ? "text-emerald-100" : "text-slate-500"}`}
          >
            تم البحث عن الآيات بمساعدة ملفات
          </p>
          <a
            href="http://tanzil.net/"
            target="_blank"
            rel="noreferrer"
            className={`inline-block text-[0.7rem] sm:text-xs opacity-70 hover:opacity-100 transition-all font-black uppercase tracking-wider ${isDark ? "text-[#ffb900]" : "text-emerald-700"}`}
          >
            Tanzil - Quran Navigator
          </a>
          <p
            className={`text-[0.6rem] sm:text-[0.65rem] opacity-40 mt-6 font-black uppercase tracking-widest ${isDark ? "text-emerald-100" : "text-slate-400"}`}
          >
            نَسَق - لخدمة كتاب الله © 2026
          </p>
        </footer>
      </div>
    </>
  );
}
