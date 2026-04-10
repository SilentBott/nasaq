import { useState, useEffect, useCallback, useRef, createContext } from "react";
import { supabase } from "./lib/supabase";
import { SURAHS } from "./data/surahs";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import SurahCard from "./components/SurahCard";
import KhatmahModal from "./components/KhatmahModal";
import { ArrowRight, Flame } from "lucide-react";

export const FontContext = createContext();

export default function App() {
  //! test [ID: 01] استعادة الحالات واللون الزمردي وتأمين الثيم
  const [userName, setUserName] = useState(
    () => localStorage.getItem("إسم_الحساب") || "",
  );
  const [loginNameInput, setLoginNameInput] = useState("");
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem("font-size")) || 18,
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("nasaq-theme") || "dark",
  );
  const [streak, setStreak] = useState(
    () => Number(localStorage.getItem("nasaq-streak")) || 0,
  );
  const [verseViewMode, setVerseViewMode] = useState(
    () => localStorage.getItem("nasaq-verse-mode") || "both",
  );
  const [riwaya, setRiwaya] = useState(
    () => localStorage.getItem("nasaq-riwaya") || "Hafs",
  );
  const [highlightMode, setHighlightMode] = useState(
    () => localStorage.getItem("nasaq-h-mode") || "row",
  );

  const [quranData, setQuranData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [currentGroup, setcurrentGroup] = useState(null);
  const [myKhatmats, setMyKhatmats] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [vRanges, setVRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [quickRegister, setQuickRegister] = useState(false);

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const pressTimer = useRef(null);

  const riwayaAr = {
    Hafs: "حفص عن عاصم",
    Warsh: "ورش عن نافع",
    Qaloun: "قالون عن نافع",
    Douri: "الدوري عن أبي عمرو",
    Sousi: "السوسي عن أبي عمرو",
    Shuba: "شعبة عن عاصم",
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > lastScrollY.current && window.scrollY > 60)
        setShowHeader(false);
      else setShowHeader(true);
      lastScrollY.current = window.scrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  //! test [ID: 02] دالة حساب الآيات الفريدة (مهمة للبروجرس)
  const getUniqueVersesCount = (surahLogs) => {
    if (!surahLogs) return 0;
    const covered = new Set();
    surahLogs.forEach((l) => {
      if (l.verse_start && l.verse_end)
        for (let i = l.verse_start; i <= l.verse_end; i++) covered.add(i);
    });
    return covered.size;
  };

  const calculateGlobalProgress = () => {
    const total = 6236;
    let read = 0;
    SURAHS.forEach((s) => {
      read += getUniqueVersesCount(
        (logs || []).filter((l) => l.surah_id === s.id),
      );
    });
    return ((read / total) * 100).toFixed(1);
  };

  useEffect(() => {
    localStorage.setItem("font-size", fontSize);
    localStorage.setItem("nasaq-theme", theme);
    localStorage.setItem("nasaq-verse-mode", verseViewMode);
    localStorage.setItem("nasaq-riwaya", riwaya);
    localStorage.setItem("nasaq-h-mode", highlightMode);
    document.body.className = theme;
  }, [fontSize, theme, verseViewMode, riwaya, highlightMode]);

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
    if (currentGroup) {
      const q = supabase.from("khatmah_logs").select("*");
      currentGroup.id === null
        ? q.is("khatmah_id", null).eq("user_name", userName)
        : q.eq("khatmah_id", currentGroup.id);
      const { data } = await q.order("created_at", { ascending: true });
      setLogs(data || []);
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

  //! test [ID: 03] الختم المطول 4 ثواني المصلح (صخر)
  const handleLongPress = (surah) => {
    if (!surah) return;
    pressTimer.current = setTimeout(async () => {
      if (window.confirm(`هل ختمت سورة ${surah.name_ar} بالكامل؟`)) {
        await supabase
          .from("khatmah_logs")
          .insert({
            surah_id: surah.id,
            user_name: userName,
            status: "completed",
            verse_start: 1,
            verse_end: surah.ayat,
            khatmah_id: currentGroup.id,
          });
        if (streak === 0) {
          setStreak(1);
          localStorage.setItem("nasaq-streak", 1);
        }
        fetchData();
      }
    }, 4000);
  };

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
        className={`min-h-screen transition-all ${theme === "dark" ? "bg-emerald-950 text-white" : "bg-emerald-50 text-slate-900"}`}
      >
        {!userName ? (
          <Auth
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
        ) : !currentGroup ? (
          <Dashboard
            userName={userName}
            myKhatmats={myKhatmats}
            setcurrentGroup={setcurrentGroup}
            onLogout={() => {
              localStorage.removeItem("إسم_الحساب");
              window.location.reload();
            }}
            onCreate={async (n) => {
              const { data } = await supabase
                .from("khatmats")
                .insert({ name: n, creator_name: userName })
                .select()
                .single();
              if (data) {
                await supabase
                  .from("khatmah_members")
                  .insert({ khatmah_id: data.id, user_name: userName });
                fetchData();
                setcurrentGroup(data);
              }
            }}
            onJoin={async (n) => {
              const { data } = await supabase
                .from("khatmats")
                .select("*")
                .eq("name", n)
                .maybeSingle();
              if (data) {
                await supabase
                  .from("khatmah_members")
                  .insert({ khatmah_id: data.id, user_name: userName });
                fetchData();
                setcurrentGroup(data);
              }
            }}
          />
        ) : (
          <div className="text-right">
            <header
              className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${showHeader ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"} ${theme === "dark" ? "bg-emerald-950/95 border-emerald-800/20" : "bg-white/95 border-slate-200 shadow-xl"}`}
              style={{ paddingBlock: `${Math.max(12, fontSize / 1.2)}px` }}
            >
              <div className="max-w-4xl mx-auto flex flex-row-reverse justify-between items-center px-4 relative">
                <div className="flex flex-row-reverse items-center gap-3">
                  <button
                    onClick={() => setcurrentGroup(null)}
                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                  >
                    <ArrowRight size={Math.max(22, fontSize)} />
                  </button>
                  <div className="flex flex-col text-right">
                    <h1
                      className="font-black text-amber-500 font-serif leading-tight tracking-tighter"
                      style={{ fontSize: `${fontSize + 4}px` }}
                    >
                      {currentGroup.name}
                    </h1>
                    <span
                      className="opacity-60 font-bold"
                      style={{ fontSize: `${fontSize * 0.65}px` }}
                    >
                      {userName} • {riwayaAr[riwaya]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {streak > 0 && (
                    <div
                      className="flex items-center gap-1 text-orange-500 font-black px-2.5 py-1.5 bg-orange-500/10 rounded-full border border-orange-500/20"
                      style={{ fontSize: `${fontSize * 0.75}px` }}
                    >
                      <Flame size={fontSize * 0.8} fill="currentColor" />{" "}
                      {streak}
                    </div>
                  )}
                  <div
                    className="font-black text-emerald-500"
                    style={{ fontSize: `${fontSize * 0.75}px` }}
                  >
                    {calculateGlobalProgress()}%
                  </div>
                </div>
              </div>
              <div
                className="absolute bottom-0 left-0 h-1.5 bg-emerald-500 transition-all duration-1000 shadow-[0_0_15px_rgba(16,185,129,0.8)]"
                style={{ width: `${calculateGlobalProgress()}%` }}
              />
            </header>

            <div className="max-w-4xl mx-auto px-4 pt-32 sm:pt-40 py-6 flex flex-row-reverse items-center justify-between gap-4 flex-wrap">
              <button
                onClick={() => setQuickRegister(true)}
                style={{ fontSize: `${fontSize}px` }}
                className="font-black underline underline-offset-8 text-amber-500 hover:text-amber-400 active:scale-95 transition-all"
              >
                تسجيل سريع
              </button>
              <div className="flex flex-wrap flex-row-reverse gap-2">
                {[
                  { id: "all", label: "كلّ" },
                  { id: "completed", label: "تمت" },
                  { id: "remaining", label: "باقي" },
                  { id: "mine", label: "هنا" },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setFilter(t.id)}
                    className={`px-4 py-1.5 rounded-full font-black border transition-all ${filter === t.id ? "bg-amber-500 text-emerald-950 border-amber-500 shadow-lg scale-105" : theme === "dark" ? "bg-emerald-900/10 border-emerald-800 text-emerald-500" : "bg-white border-slate-200 text-slate-500"}`}
                    style={{ fontSize: `${Math.max(10, fontSize - 6)}px` }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <main
              dir="rtl"
              className="p-4 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 pb-24"
            >
              {SURAHS.filter((s) => {
                const sLogs = (logs || []).filter((l) => l.surah_id === s.id);
                if (filter === "completed")
                  return (
                    sLogs.some((l) => l.status === "completed") ||
                    getUniqueVersesCount(sLogs) >= s.ayat
                  );
                if (filter === "remaining")
                  return (
                    !sLogs.some((l) => l.status === "completed") &&
                    getUniqueVersesCount(sLogs) < s.ayat
                  );
                if (filter === "mine")
                  return sLogs.some((l) => l.status === "reading");
                return true;
              }).map((s) => (
                <SurahCard
                  key={s.id}
                  s={s}
                  logs={logs || []}
                  userName={userName}
                  onClick={openModal}
                  onMouseDown={() => handleLongPress(s)}
                  onMouseUp={() => clearTimeout(pressTimer.current)}
                  onMouseLeave={() => clearTimeout(pressTimer.current)}
                  onTouchStart={() => handleLongPress(s)}
                  onTouchEnd={() => clearTimeout(pressTimer.current)}
                  onContextMenu={(e) => e.preventDefault()}
                />
              ))}
            </main>

            <KhatmahModal
              selected={selected}
              setSelected={setSelected}
              quickRegister={quickRegister}
              setQuickRegister={setQuickRegister}
              logs={logs || []}
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
                if (inserts.length > 0) {
                  await supabase.from("khatmah_logs").insert(inserts);
                  if (streak === 0) setStreak(1);
                  fetchData();
                }
                setLoading(false);
                setSelected(null);
                setQuickRegister(false);
              }}
              onDeleteRange={async (id) => {
                await supabase.from("khatmah_logs").delete().eq("id", id);
                fetchData();
              }}
              onDeleteAll={async () => {
                if (window.confirm("حذف كل قراءاتك؟")) {
                  await supabase
                    .from("khatmah_logs")
                    .delete()
                    .match({ surah_id: selected.id, user_name: userName });
                  fetchData();
                  setSelected(null);
                }
              }}
              onFullReset={async () => {
                await supabase
                  .from("khatmah_logs")
                  .delete()
                  .eq("khatmah_id", currentGroup.id);
                fetchData();
              }}
              isCreator={
                currentGroup.creator_name === userName ||
                currentGroup.id === null
              }
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
          </div>
        )}
      </div>
    </FontContext.Provider>
  );
}
