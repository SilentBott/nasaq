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
  WifiOff,
  Wifi,
} from "lucide-react";
import { FontContext } from "./FontContext";

const HoldToConfirmButton = ({ onConfirm, theme }) => {
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const delayRef = useRef(null);

  const startHold = () => {
    if (timerRef.current || delayRef.current) return;
    setProgress(0);

    // ⏳ انتظار 200 ملي ثانية
    delayRef.current = setTimeout(() => {
      let curr = 0;
      const step = 100 / (10000 / 100); // 10 ثواني
      timerRef.current = setInterval(() => {
        curr += step;
        if (curr >= 100) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          setProgress(100);
          onConfirm();
        } else {
          setProgress(curr);
        }
      }, 100);
    }, 200);
  };

  const stopHold = () => {
    if (delayRef.current) clearTimeout(delayRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    delayRef.current = null;
    timerRef.current = null;
    setProgress(0);
  };
  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ touchAction: "none", userSelect: "none" }}
    >
      <button
        onPointerDown={startHold}
        onPointerUp={stopHold}
        onPointerLeave={stopHold}
        onPointerCancel={stopHold}
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
  const [themeSetting, setThemeSetting] = useState(
    () => localStorage.getItem("nasaq-theme") || "auto",
  );

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("nasaq-theme") || "auto";
    if (saved === "auto") {
      return window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return saved;
  });
  const [toast, setToast] = useState({
    show: false,
    message: "",
    subMessage: "",
    type: "normal",
    isClosing: false,
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOnlineBadge, setShowOnlineBadge] = useState(false);

  const showToastMsg = useCallback(
    (message, type = "normal", subMessage = "") => {
      // 1. نظهر الـ Toast فوراً
      setToast({ show: true, isClosing: false, message, subMessage, type });

      // 2. بعد 3 ثواني ونص.. ندي أمر إنه يبدأ يختفي (Fade out)
      setTimeout(
        () => setToast((prev) => ({ ...prev, isClosing: true })),
        3500,
      );

      // 3. بعد 4 ثواني.. نمسحه من الشاشة خالص
      setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
    },
    [],
  );

  const [exitToast, setExitToast] = useState(false);
  const [streak, setStreak] = useState(
    () => Number(localStorage.getItem("nasaq-streak")) || 0,
  );
  const [riwaya, setRiwaya] = useState(
    () => localStorage.getItem("nasaq-riwaya") || "Hafs",
  );
  const [highlightMode, setHighlightMode] = useState(
    () => localStorage.getItem("nasaq-h-mode") || "full",
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
  // 👇 ================== نظام الـ Streak ================== 👇
  const updateStreak = () => {
    const today = new Date().toDateString(); // تاريخ النهاردة
    const lastReadDate = localStorage.getItem("nasaq-last-read");

    if (lastReadDate === today) return; // لو قرأ النهاردة خلاص مفيش زيادة تانية

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastReadDate === yesterday.toDateString()) {
      // لو كان قرأ امبارح، كمل الستريك
      setStreak((prev) => prev + 1);
    } else {
      // لو أول مرة أو فوت يوم، ابدأ من 1
      setStreak(1);
    }
    localStorage.setItem("nasaq-last-read", today);
  };

  // تصفير الستريك أوتوماتيك لو فتح التطبيق ولقى نفسه مفوت أكتر من يوم
  useEffect(() => {
    const lastReadDate = localStorage.getItem("nasaq-last-read");
    if (!lastReadDate) return;

    const today = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastReadDate !== today && lastReadDate !== yesterday.toDateString()) {
      setStreak(0); // الشعلة انطفت 💔
    }
  }, []);
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
    localStorage.setItem("nasaq-streak", streak);
    localStorage.setItem("nasaq-riwaya", riwaya);
    localStorage.setItem("nasaq-h-mode", highlightMode);
    localStorage.setItem("nasaq-verse-mode", verseViewMode);
    return () => window.removeEventListener("resize", handleResize);
  }, [fontSize, streak, riwaya, highlightMode, verseViewMode]);

  // متابعة تغيير إعدادات الموبايل (عشان لو الموبايل قلب ليلي يقلب معاه فوراً)
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const applyTheme = () => {
      if (themeSetting === "auto") {
        setTheme(mediaQuery.matches ? "dark" : "light");
      } else {
        setTheme(themeSetting);
      }
    };
    applyTheme();

    const listener = () => applyTheme();
    mediaQuery.addEventListener("change", listener);
    localStorage.setItem("nasaq-theme", themeSetting);

    return () => mediaQuery.removeEventListener("change", listener);
  }, [themeSetting]);

  // فخ زرار الرجوع للموبايل (Back Button Interceptor)
  useEffect(() => {
    window.history.pushState({ nasaqTrap: true }, "");

    const handlePopState = () => {
      if (selected || quickRegister || showGroupInfo || view === "about") {
        setSelected(null);
        setQuickRegister(false);
        setShowGroupInfo(false);
        if (view === "about") setView("main");

        window.history.pushState({ nasaqTrap: true }, "");
      } else {
        if (exitToast) {
          // لو الرسالة ظاهرة وضغط تاني.. خليه يخرج عادي من غير ما نمنعه
        } else {
          setExitToast(true);
          window.history.pushState({ nasaqTrap: true }, "");
          setTimeout(() => setExitToast(false), 2000);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [selected, quickRegister, showGroupInfo, view, exitToast]);

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
    try {
      const { data: members, error: err1 } = await supabase
        .from("khatmah_members")
        .select("khatmah_id")
        .eq("user_name", userName);
      if (err1) throw err1;

      const ids = (members || []).map((m) => m.khatmah_id);
      const { data: khatmats, error: err2 } = await supabase
        .from("khatmats")
        .select("*")
        .or(
          `creator_name.eq."${userName}",id.in.(${ids.length ? ids.join(",") : "00000000-0000-0000-0000-000000000000"})`,
        );
      if (err2) throw err2;

      setMyKhatmats(khatmats || []);

      // 👇 1. أخذ لقطة للمجموعات وحفظها محلياً (عشان الأوفلاين)
      localStorage.setItem(
        `nasaq-groups-${userName}`,
        JSON.stringify(khatmats || []),
      );

      if (currentGroup && currentGroup.id) {
        const { data, error: err3 } = await supabase
          .from("khatmah_logs")
          .select("*")
          .eq("khatmah_id", currentGroup.id)
          .order("created_at", { ascending: true });
        if (err3) throw err3;

        // 👇 2. أخذ لقطة لقراءات المجموعة وحفظها محلياً
        localStorage.setItem(
          `nasaq-logs-${currentGroup.id}`,
          JSON.stringify(data || []),
        );

        // دمج الأوفلاين الجديد عشان يظهر في الشاشة فوراً
        const queue = JSON.parse(
          localStorage.getItem("nasaq-offline-queue") || "[]",
        );
        const offlineLogs = queue.filter(
          (q) => q.khatmah_id === currentGroup.id,
        );
        setLogs([...(data || []), ...offlineLogs]);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.warn("وضع عدم الاتصال مُفعل، جاري استرجاع البيانات المحلية...");

      // 👇 3. لو النت قاطع، بنستدعي المجموعات من الكاش المحلي
      const cachedGroups = JSON.parse(
        localStorage.getItem(`nasaq-groups-${userName}`) || "[]",
      );
      setMyKhatmats(cachedGroups);

      if (currentGroup && currentGroup.id) {
        // 👇 4. بنستدعي القراءات القديمة من الكاش، وندمج معاها الطابور الجديد
        const cachedLogs = JSON.parse(
          localStorage.getItem(`nasaq-logs-${currentGroup.id}`) || "[]",
        );
        const queue = JSON.parse(
          localStorage.getItem("nasaq-offline-queue") || "[]",
        );
        const offlineLogs = queue.filter(
          (q) => q.khatmah_id === currentGroup.id,
        );

        setLogs(() => {
          return [
            ...cachedLogs,
            ...offlineLogs.map((o) => ({ ...o, isOffline: true })),
          ];
        });
      }
    }
  }, [userName, currentGroup]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  // 👇 ================== نظام المزامنة المتأخرة (Offline Sync) ================== 👇
  const syncOfflineLogs = useCallback(async () => {
    const queue = JSON.parse(
      localStorage.getItem("nasaq-offline-queue") || "[]",
    );
    if (queue.length === 0) return;

    try {
      const { error } = await supabase.from("khatmah_logs").insert(queue);
      if (!error) {
        localStorage.removeItem("nasaq-offline-queue");
        fetchData();
        showToastMsg("تمت مزامنة قراءاتك المتأخرة بنجاح! ☁️", "success"); // 👈 Toast للنجاح
      }
    } catch (err) {
      console.error("فشل المزامنة المتأخرة", err);
    }
  }, [fetchData, showToastMsg]);

  // مراقب ذكي للشبكة (عشان يظهر ويخفي الشارات)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToastMsg(
        "لقد رجع الإتصال",
        "success",
        "تم تحديث الموقع ومزامنة بياناتك",
      );
      syncOfflineLogs();
    };
    const handleOffline = () => {
      setIsOnline(false);
      showToastMsg(
        "أنت غير متّصل بالإنترنت",
        "warning",
        "سيتم تحديث الموقع عند رجوع الإتصال",
      );
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    if (navigator.onLine) syncOfflineLogs();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [syncOfflineLogs, showToastMsg]);

  // دالة الحفظ الذكية (بدون Alert مزعج)
  const safeInsertLogs = async (inserts) => {
    const saveOffline = () => {
      const queue = JSON.parse(
        localStorage.getItem("nasaq-offline-queue") || "[]",
      );
      queue.push(...inserts);
      localStorage.setItem("nasaq-offline-queue", JSON.stringify(queue));
      // 👈 Toast تحذيري شيك للحفظ المحلي
      showToastMsg(
        "تم الحفظ محلياً",
        "warning",
        "سيتم الرفع فور عودة الاتصال ⏳",
      );
    };

    if (navigator.onLine) {
      try {
        const { error } = await supabase.from("khatmah_logs").insert(inserts);
        if (error) throw error;
      } catch (err) {
        saveOffline();
      }
    } else {
      saveOffline();
    }
    updateStreak();
  };

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

  const handleLongPress = async (surah, action) => {
    if (navigator.vibrate) navigator.vibrate(50);
    setLoading(true);

    if (action === "undo") {
      // 👇 حماية الحذف أوفلاين
      if (!navigator.onLine) {
        showToastMsg(
          "عذراً، إلغاء الختمة يحتاج إلى اتصال بالإنترنت",
          "warning",
        );
        setLoading(false);
        return;
      }

      await supabase
        .from("khatmah_logs")
        .delete()
        .eq("surah_id", surah.id)
        .eq("user_name", userName)
        .eq("status", "completed")
        .eq("khatmah_id", currentGroup.id);
    } else {
      const sLogs = (logs || []).filter((l) => l.surah_id === surah.id);
      if (getUniqueVersesCount(sLogs) >= surah.ayat) {
        setLoading(false);
        return;
      }
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
      updateStreak();
    }

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
        themeSetting,
        setThemeSetting,
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
                const safeName = loginNameInput.trim().substring(0, 30); // 👈 الأمان: قص الاسم لـ 30 حرف

                if (!safeName) {
                  return showToastMsg("يرجى كتابة اسمك أولاً", "warning");
                }

                localStorage.setItem("إسم_الحساب", safeName);
                setUserName(safeName);
                fetchData();
                showToastMsg(`أهلاً بك يا ${safeName} 👋`, "success"); // 👈 ترحيب شيك باليوزر
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
              onLogout={() => {
                console.log(1);
                showToastMsg(
                  `إلى اللقاء يا ${userName} 👋`,
                  "normal",
                  "في رعاية الله وحفظه، ننتظرك قريباً",
                );

                // بنستنى ثانية ونص عشان يشوف الرسالة، وبعدين نمسح بياناته ونطلعه
                setTimeout(() => {
                  setUserName("");
                  localStorage.removeItem("إسم_الحساب");
                }, 1500);
              }}
              onCreate={async (name) => {
                if (!navigator.onLine)
                  return showToastMsg(
                    "لا يمكن إنشاء مجموعة",
                    "error",
                    "يجب أن تكون متصلاً بالإنترنت",
                  );
                if (!name.trim())
                  return showToastMsg("يرجى كتابة اسم المجموعة", "warning");
                if (name.trim().length > 30)
                  return showToastMsg(
                    "اسم المجموعة طويل جداً",
                    "warning",
                    "الحد الأقصى هو 30 حرف فقط",
                  );

                try {
                  const { data: check } = await supabase
                    .from("khatmats")
                    .select("id")
                    .eq("name", name.trim());
                  if (check && check.length > 0)
                    return showToastMsg(
                      "هذا الاسم موجود بالفعل",
                      "error",
                      "اختر اسماً آخر للمجموعة",
                    );

                  const { data, error } = await supabase
                    .from("khatmats")
                    .insert([{ name: name.trim(), creator_name: userName }])
                    .select();
                  if (error) throw error;
                  if (data && data[0]) {
                    setcurrentGroup(data[0]);
                    fetchData();
                    showToastMsg(`تم إنشاء مجموعة "${name}" بنجاح!`, "success");
                  }
                } catch (err) {
                  console.error("Create Error:", err.message);
                }
              }}
              onJoin={async (name) => {
                if (!navigator.onLine)
                  return showToastMsg(
                    "لا يمكن الانضمام لمجموعة",
                    "error",
                    "يجب أن تكون متصلاً بالإنترنت",
                  );
                if (!name.trim())
                  return showToastMsg("يرجى كتابة اسم المجموعة", "warning");
                if (name.trim().length > 30)
                  return showToastMsg(
                    "اسم المجموعة طويل جداً",
                    "warning",
                    "الحد الأقصى هو 30 حرف فقط",
                  );

                try {
                  const { data: groups, error: gErr } = await supabase
                    .from("khatmats")
                    .select("*")
                    .eq("name", name.trim());
                  if (gErr) throw gErr;
                  if (!groups || groups.length === 0)
                    return showToastMsg(
                      "لم يتم العثور على مجموعة بهذا الاسم",
                      "error",
                    );

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
                  showToastMsg(`تم الانضمام إلى مجموعة "${name}"!`, "success");
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
                    {calculateGlobalProgress()}%
                  </div>
                  {streak > 0 && (
                    <div
                      className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full shadow-inner ${theme === "dark" ? "bg-orange-500/10 border border-orange-500/20 text-orange-500" : "bg-orange-50 border border-orange-200 text-orange-600"}`}
                    >
                      <Flame size={18} fill="currentColor" />
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
                if (inserts.length > 0) {
                  // 👇 هنا استخدمنا الدالة الذكية بدال Supabase المباشر اللي كان بيكراش
                  await safeInsertLogs(inserts);
                }
                fetchData();
                setLoading(false);
                setSelected(null);
                setQuickRegister(false);
              }}
              onMultiClaim={async (inserts) => {
                setLoading(true);
                const enriched = inserts.map((i) => ({
                  ...i,
                  user_name: userName,
                  status: "reading",
                  khatmah_id: currentGroup.id,
                }));
                if (enriched.length > 0) {
                  // 👇 وهنا كمان الدالة الذكية
                  await safeInsertLogs(enriched);
                  if (navigator.onLine)
                    showToastMsg(
                      "تم تسجيل الورد الممتد عبر السور بنجاح! 🌟",
                      "success",
                    );
                }
                fetchData();
                setLoading(false);
                setSelected(null);
                setQuickRegister(false);
              }}
              onDeleteRange={async (id) => {
                if (!navigator.onLine) {
                  showToastMsg(
                    "عذراً، الحذف يحتاج إلى اتصال بالإنترنت",
                    "warning",
                  );
                  return;
                }
                await supabase.from("khatmah_logs").delete().eq("id", id);
                fetchData();
              }}
              onDeleteAll={async () => {
                if (!navigator.onLine) {
                  showToastMsg(
                    "عذراً، الحذف يحتاج إلى اتصال بالإنترنت",
                    "warning",
                  );
                  return;
                }
                if (window.confirm("حذف كل قراءاتك؟")) {
                  await supabase
                    .from("khatmah_logs")
                    .delete()
                    .match({ surah_id: selected.id, user_name: userName });
                  fetchData();
                  setSelected(null);
                }
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
                            const userInput = window.prompt(
                              `هل أنت متأكد أنك تريد إعادة التعيين؟\nللتأكيد، اكتب اسم المجموعة:\n"${currentGroup.name}"`,
                            );

                            if (userInput === currentGroup.name) {
                              await supabase
                                .from("khatmah_logs")
                                .delete()
                                .eq("khatmah_id", currentGroup.id);
                              fetchData();
                              setShowGroupInfo(false);
                              alert("تم تصفير قراءات المجموعة بالكامل بنجاح.");
                            } else if (userInput !== null) {
                              alert("اسم المجموعة غير متطابق! لم يتم التصفير.");
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

            {/* رسالة الخروج */}
            {exitToast && (
              <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] bg-slate-800 text-white px-6 py-3 rounded-full font-black text-sm shadow-2xl animate-in slide-in-from-bottom-5 fade-in whitespace-nowrap">
                اضغط مرة أخرى للخروج
              </div>
            )}
          </div>
        )}
      </div>
      {!isOnline && (
        <div
          className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[9998] flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border shadow-sm animate-pulse backdrop-blur-md transition-all ${theme === "dark" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-red-50 text-red-600 border-red-200"}`}
        >
          <WifiOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-[0.65rem] sm:text-xs font-black uppercase tracking-wider">
            أنت غير متّصل بالإنترنت <br />
            سيتم تحديث الموقع عند رجوع الإتصال
          </span>
        </div>
      )}
      {/* 🟢 مؤشر عودة الاتصال (أونلاين) - بيظهر 4 ثواني ويختفي */}
      {showOnlineBadge && (
        <div
          className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[9998] flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full border shadow-sm animate-in fade-in slide-in-from-right backdrop-blur-md transition-all ${theme === "dark" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-emerald-50 text-emerald-600 border-emerald-200"}`}
        >
          <Wifi className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="text-[0.65rem] sm:text-xs font-black uppercase tracking-wider">
            متصل
          </span>
        </div>
      )}
      {/* 💬 الـ Toast الذكي للرسائل (بينزل من النص فوق) */}
      {toast.show && (
        <div
          className={`fixed top-6 sm:top-8 left-1/2 -translate-x-1/2 z-[9999] px-6 py-3.5 sm:px-8 sm:py-4 rounded-2xl sm:rounded-[2rem] shadow-2xl flex flex-col items-center gap-1.5 min-w-[280px] max-w-[90vw] text-center border-2 transition-all duration-500 ease-in-out ${
            toast.isClosing
              ? "opacity-0 -translate-y-10 scale-95"
              : "animate-in slide-in-from-top-5 fade-in duration-300"
          } ${
            toast.type === "success"
              ? theme === "dark"
                ? "bg-emerald-900/95 text-emerald-100 border-emerald-500/30"
                : "bg-emerald-500 text-white border-emerald-600"
              : toast.type === "warning"
                ? theme === "dark"
                  ? "bg-amber-900/95 text-amber-100 border-amber-500/30"
                  : "bg-amber-500 text-emerald-950 border-amber-600"
                : toast.type === "error"
                  ? theme === "dark"
                    ? "bg-red-900/95 text-red-100 border-red-500/30"
                    : "bg-red-500 text-white border-red-600"
                  : theme === "dark"
                    ? "bg-slate-800/95 text-white border-slate-600"
                    : "bg-slate-800 text-white border-slate-700"
          }`}
        >
          <span className="font-black text-sm sm:text-base leading-relaxed">
            {toast.message}
          </span>
          {toast.subMessage && (
            <span className="text-[0.7rem] sm:text-xs opacity-90 font-bold">
              {toast.subMessage}
            </span>
          )}
        </div>
      )}
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
        <div className="flex flex-col items-center gap-4 mb-6 text-center relative z-10">
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
              </span>
              هي منصة ذكية صُممت لتنظيم خِتمتك القرآنية، ومتابعة وردك اليومي
              بيسر وسهولة، سواء كنت تقرأ بمفردك أو ضمن مجموعة.
            </p>
          </div>
          <div
            className={`p-6 rounded-3xl border shadow-sm ${isDark ? "bg-emerald-900/30 border-emerald-500/10" : "bg-white border-emerald-100"}`}
          >
            <p>
              يتيح لك النظام إنشاء مجموعات قراءة ومزامنة الإنجاز مع أصحابك
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
          className={`mt-8 pt-4 border-t text-center space-y-3 relative z-10 ${isDark ? "border-emerald-700/30" : "border-emerald-200"}`}
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
          <p></p>
          <a
            href="https://www.vecteezy.com/"
            target="_blank"
            rel="noreferrer"
            className={`text-[0.65rem] sm:text-xs opacity-60 font-black ${isDark ? "text-emerald-100" : "text-slate-500"}`}
          >
            الأيقونه تم صنعها من صورة من Vecteezy.com
          </a>
          <p
            className={`text-[0.6rem] sm:text-[0.65rem] opacity-40 mt-2 font-black uppercase tracking-widest ${isDark ? "text-emerald-100" : "text-slate-400"}`}
          >
            نَسَق - لخدمة كتاب الله © 2026
          </p>
        </footer>
      </div>
    </>
  );
}
