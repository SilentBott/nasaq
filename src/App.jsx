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
import AboutView from "./components/AboutView";
import ToastMessage from "./components/ToastMessage";
import GroupInfoModal from "./components/GroupInfoModal";
import GroupHeader from "./components/GroupHeader";
import SurahFilterBar from "./components/SurahFilterBar";
import OfflineBadge from "./components/OfflineBadge";

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
  Globe,
  Lock,
} from "lucide-react";
import { FontContext } from "./FontContext";

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
  const [showOfflineBadge, setShowOfflineBadge] = useState(!navigator.onLine); // 👈 دي الحالة الجديدة
  // دالة لتوليد كود عشوائي (5 حروف/أرقام)
  const generateInviteCode = () =>
    Math.random().toString(36).substring(2, 7).toUpperCase();

  // معالج روابط الدعوة
  // معالج روابط الدعوة (بالاسم)

  const showToastMsg = useCallback(
    (message, type = "normal", subMessage = "") => {
      // 1. نظهر الـ Toast فوراً
      setToast({ show: true, isClosing: false, message, subMessage, type });

      // 2. بعد 3 ثواني ونص.. ندي أمر إنه يبدأ يختفي (Fade out)
      setTimeout(
        () => setToast((prev) => ({ ...prev, isClosing: true })),
        1000,
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
  const [myGroups, setMyGroups] = useState([]);
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
    localStorage.setItem("nasaq-h-mode", highlightMode);
    localStorage.setItem("nasaq-verse-mode", verseViewMode);
    return () => window.removeEventListener("resize", handleResize);
  }, [fontSize, streak, highlightMode, verseViewMode]);

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
    if (!userName) return;

    async function loadQuran() {
      setDataLoading(true);
      try {
        const mod = await import(`./data/Hafs.json`);
        setQuranData(mod.default || []);
      } catch (e) {
        console.error(e);
      } finally {
        setDataLoading(false);
      }
    }
    loadQuran();
  }, [userName]);

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
      // 👇 السحر هنا: بنطلب الاتنين مع بعض في نفس الوقت (Parallel Fetching)
      const [membersRes, createdGroupsRes] = await Promise.all([
        supabase
          .from("group_members")
          .select("group_id")
          .eq("user_name", userName),
        supabase.from("groups").select("*").eq("creator_name", userName),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (createdGroupsRes.error) throw createdGroupsRes.error;

      const ids = (membersRes.data || []).map((m) => m.group_id);
      const createdGroups = createdGroupsRes.data;

      let joinedGroups = [];
      if (ids.length > 0) {
        const { data: jGroups, error: err3 } = await supabase
          .from("groups")
          .select("*")
          .in("id", ids);
        if (err3) throw err3;
        joinedGroups = jGroups || [];
      }

      const allGroups = [...(createdGroups || []), ...joinedGroups];
      const uniqueGroups = Array.from(
        new Map(allGroups.map((item) => [item.id, item])).values(),
      );
      uniqueGroups.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setMyGroups(uniqueGroups);
      localStorage.setItem(
        `nasaq-groups-${userName.split("_GUEST_")[0]}`,
        JSON.stringify(uniqueGroups),
      );

      // 👇 تفعيل الختمة الشخصية بذكاء
      if (currentGroup) {
        let query = supabase
          .from("nasaq_logs")
          .select("*")
          .order("created_at", { ascending: true });

        if (currentGroup.id) {
          query = query.eq("group_id", currentGroup.id);
        } else {
          query = query.is("group_id", null).eq("user_name", userName); // 👈 الدعم السحري لـ Null
        }

        const { data, error: err4 } = await query;
        if (err4) throw err4;

        const cacheKey = currentGroup.id
          ? `nasaq-logs-${currentGroup.id}`
          : `nasaq-logs-personal-${userName.split("_GUEST_")[0]}`;
        localStorage.setItem(cacheKey, JSON.stringify(data || []));

        const queue = JSON.parse(
          localStorage.getItem("nasaq-offline-queue") || "[]",
        );
        const offlineLogs = queue.filter((q) =>
          currentGroup.id ? q.group_id === currentGroup.id : !q.group_id,
        );
        setLogs([...(data || []), ...offlineLogs]);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.warn("وضع عدم الاتصال مُفعل، جاري استرجاع البيانات المحلية...");
      const cachedGroups = JSON.parse(
        localStorage.getItem(`nasaq-groups-${userName.split("_GUEST_")[0]}`) ||
          "[]",
      );
      setMyGroups(cachedGroups);

      if (currentGroup) {
        const cacheKey = currentGroup.id
          ? `nasaq-logs-${currentGroup.id}`
          : `nasaq-logs-personal-${userName.split("_GUEST_")[0]}`;
        const cachedLogs = JSON.parse(localStorage.getItem(cacheKey) || "[]");
        const queue = JSON.parse(
          localStorage.getItem("nasaq-offline-queue") || "[]",
        );
        const offlineLogs = queue.filter((q) =>
          currentGroup.id ? q.group_id === currentGroup.id : !q.group_id,
        );

        setLogs([
          ...cachedLogs,
          ...offlineLogs.map((o) => ({ ...o, isOffline: true })),
        ]);
      }
    }
  }, [userName, currentGroup]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    if (!userName) return;
    const processInvite = async () => {
      const params = new URLSearchParams(window.location.search);
      const inviteName = params.get("invite"); // 👈 بناخد الاسم من الرابط
      const inviteCode = params.get("code");

      if (inviteName) {
        try {
          // 👈 بنبحث في الداتا بيز بالاسم (name)
          const { data: groupData } = await supabase
            .from("groups")
            .select("*")
            .eq("name", inviteName)
            .single();

          if (groupData) {
            // التحقق لو المجموعة خاصة محتاجة الكود
            if (groupData.is_private && groupData.invite_code !== inviteCode) {
              showToastMsg(
                "رابط الدعوة غير صالح أو منتهي الصلاحية ❌",
                "error",
              );
            } else {
              // التحقق إنه مش عضو أصلاً (وهنا بنستخدم الـ id بتاع المجموعة اللي رجعتلنا للربط)
              const { data: memberCheck } = await supabase
                .from("group_members")
                .select("*")
                .eq("group_id", groupData.id)
                .eq("user_name", userName);

              if (!memberCheck || memberCheck.length === 0) {
                await supabase
                  .from("group_members")
                  .insert([{ group_id: groupData.id, user_name: userName }]);
                showToastMsg(
                  `تم الانضمام بنجاح لـ "${groupData.name}"! 🎉`,
                  "success",
                );
                fetchData();
              }
              setcurrentGroup(groupData);
            }
          }
        } catch (err) {
          console.error(err);
        }
        // مسح الرابط عشان ميشتغلش تاني لو عمل ريفريش
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    };
    processInvite();
  }, [userName, fetchData]);
  // 👇 ================== نظام المزامنة المتأخرة (Offline Sync) ================== 👇
  const syncOfflineLogs = useCallback(async () => {
    const queueText = localStorage.getItem("nasaq-offline-queue");
    if (!queueText) return;
    const queue = JSON.parse(queueText);
    if (queue.length === 0) return;

    try {
      // تنظيف الداتا عشان السيرفر ميرفضهاش
      const cleanQueue = queue.map((q) => ({
        surah_id: q.surah_id,
        user_name: q.user_name,
        status: q.status,
        verse_start: q.verse_start,
        verse_end: q.verse_end,
        group_id: q.group_id,
      }));

      const { error } = await supabase.from("nasaq_logs").insert(cleanQueue);
      if (!error) {
        localStorage.removeItem("nasaq-offline-queue");
        fetchData();
        showToastMsg("تمت مزامنة قراءاتك المتأخرة بنجاح! ☁️", "success");
      } else throw error;
    } catch (err) {
      console.error("فشل المزامنة المتأخرة", err);
    }
  }, [fetchData, showToastMsg]);

  useEffect(() => {
    if (!navigator.onLine) {
      setTimeout(() => setShowOfflineBadge(false), 10000); // إخفاء بعد 5 ثواني لو بدأ أوفلاين
    }

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
      setShowOfflineBadge(true);
      setTimeout(() => setShowOfflineBadge(false), 5000); // 👈 إخفاء بعد 5 ثواني
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
        const { error } = await supabase.from("nasaq_logs").insert(inserts);
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
      if (!navigator.onLine) {
        showToastMsg(
          "عذراً، إلغاء الختمة يحتاج إلى اتصال بالإنترنت",
          "warning",
        );
        setLoading(false);
        return;
      }

      // 👇 مسح أي داتا تخص السورة دي بالكامل
      let query = supabase
        .from("nasaq_logs")
        .delete()
        .eq("surah_id", surah.id)
        .eq("user_name", userName);

      if (currentGroup.id) {
        query = query.eq("group_id", currentGroup.id);
      } else {
        query = query.is("group_id", null);
      }
      await query;
    } else {
      const sLogs = (logs || []).filter((l) => l.surah_id === surah.id);
      if (getUniqueVersesCount(sLogs) >= surah.ayat) {
        setLoading(false);
        return;
      }
      await safeInsertLogs([
        {
          surah_id: surah.id,
          user_name: userName,
          status: "completed",
          verse_start: 1,
          verse_end: surah.ayat,
          group_id: currentGroup.id || null, // 👈 دعم الختمة الشخصية
        },
      ]);
    }

    fetchData();
    setLoading(false);
  };

  const leaveGroup = async (groupId) => {
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
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
        highlightMode,
        setHighlightMode,
        quranData,
        dataLoading,
        getUniqueVersesCount,
      }}
    >
      <main
        dir="rtl"
        className={`min-h-screen overflow-x-hidden w-full transition-all ${theme === "dark" ? "bg-[#042f24] text-white" : "bg-emerald-50 text-slate-900"}`}
      >
        {!userName ? (
          <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center relative pb-24">
            <Auth
              theme={theme}
              onLogin={(authName) => {
                const safeName = authName.trim().substring(0, 30);

                if (!safeName) {
                  return showToastMsg("يرجى كتابة اسمك أولاً", "warning");
                }

                localStorage.setItem("إسم_الحساب", safeName);
                setUserName(safeName);
                fetchData();
                showToastMsg(
                  `أهلاً بك يا ${safeName.split("_GUEST_")[0]} 👋`,
                  "success",
                );
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
              userName={userName.split("_GUEST_")[0]}
              myGroups={myGroups}
              setcurrentGroup={setcurrentGroup}
              onLeaveGroup={leaveGroup}
              onLogout={() => {
                setUserName("");
                localStorage.removeItem("إسم_الحساب");
                showToastMsg(
                  `إلى اللقاء يا ${userName.split("_GUEST_")[0]} 👋`,
                  "normal",
                  "في رعاية الله وحفظه، ننتظرك قريباً",
                );
              }}
              onCreate={async (rawName, isPrivate) => {
                if (!navigator.onLine)
                  return showToastMsg(
                    "لا يمكن إنشاء مجموعة",
                    "error",
                    "يجب أن تكون متصلاً بالإنترنت",
                  );
                if (!rawName || !rawName.trim())
                  return showToastMsg("يرجى كتابة اسم المجموعة", "warning");

                // 👇 1. تعريف الاسم في البداية عشان ميعملش إيرور
                const name = rawName.trim().substring(0, 30);

                try {
                  if (!isPrivate) {
                    const { data: check } = await supabase
                      .from("groups")
                      .select("id")
                      .eq("name", name)
                      .eq("is_private", false);
                    if (check && check.length > 0)
                      return showToastMsg(
                        "هذا الاسم موجود كمجموعة عامة",
                        "error",
                        "اختر اسماً آخر",
                      );
                  }

                  // 👇 2. توليد الكود السري
                  const inviteCode = generateInviteCode();

                  // 👇 3. الحفظ في قاعدة البيانات
                  const { data, error } = await supabase
                    .from("groups")
                    .insert([
                      {
                        name: name,
                        creator_name: userName,
                        is_private: isPrivate,
                        invite_code: inviteCode,
                      },
                    ])
                    .select();

                  if (error) throw error;

                  if (data && data[0]) {
                    await fetchData();
                    setcurrentGroup(data[0]);
                    showToastMsg(
                      isPrivate
                        ? `تم إنشاء ختمتك الخاصة "${name}" 🔒`
                        : `تم إنشاء المجموعة العامة "${name}" 🌍`,
                      "success",
                    );
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

                try {
                  const { data: groupsData, error: gErr } = await supabase
                    .from("groups")
                    .select("*")
                    .eq("name", name.trim())
                    .eq("is_private", false);
                  if (gErr) throw gErr;

                  if (!groupsData || groupsData.length === 0)
                    return showToastMsg(
                      "عذراً، لم نجد مجموعة عامة بهذا الاسم",
                      "error",
                      "تأكد من الاسم أو قد تكون مجموعة خاصة 🔒",
                    );

                  const target = groupsData[0];
                  const { data: memberCheck } = await supabase
                    .from("group_members")
                    .select("*")
                    .eq("group_id", target.id)
                    .eq("user_name", userName);

                  if (!memberCheck || memberCheck.length === 0) {
                    const { error: insErr } = await supabase
                      .from("group_members")
                      .insert([{ group_id: target.id, user_name: userName }]);
                    if (insErr) throw insErr; // رمي الخطأ لو فشل الانضمام
                  }

                  await fetchData(); // 👈 استدعاء التحديث هنا قبل الدخول عشان تتأكد إنها اتضافت بره
                  setcurrentGroup(target);
                  showToastMsg(`تم الانضمام إلى مجموعة "${name}"!`, "success");
                } catch (err) {
                  console.error("Join Error:", err.message);
                  showToastMsg(
                    "حدث خطأ أثناء الانضمام، تأكد من الاتصال وجرب مرة أخرى",
                    "error",
                  );
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
            <GroupHeader
              theme={theme}
              currentGroup={currentGroup}
              userName={userName.split("_GUEST_")[0]}
              isOnline={isOnline}
              progress={calculateGlobalProgress()}
              streak={streak}
              onBack={() => setcurrentGroup(null)}
              onInfoClick={() => setShowGroupInfo(true)}
            />
            <main className="pb-12 flex-grow">
              {view === "about" ? (
                <AboutView theme={theme} onClose={() => setView("main")} />
              ) : (
                <>
                  <SurahFilterBar
                    theme={theme}
                    filter={filter}
                    setFilter={setFilter}
                    onQuickRegister={() => setQuickRegister(true)}
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {filteredSurahs.map((s) => (
                      <SurahCard
                        key={s.id}
                        s={s}
                        logs={logs}
                        userName={userName.split("_GUEST_")[0]}
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
              userName={userName.split("_GUEST_")[0]}
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
                  group_id: currentGroup.id || null, // 👈 التعديل هنا
                }));
                if (inserts.length > 0) {
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
                  group_id: currentGroup.id || null, // 👈 وهنا كمان
                }));
                if (enriched.length > 0) {
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
              onDeleteAll={async () => {
                if (!navigator.onLine) {
                  showToastMsg(
                    "عذراً، الحذف يحتاج إلى اتصال بالإنترنت",
                    "warning",
                  );
                  return;
                }
                if (window.confirm("حذف كل قراءاتك؟")) {
                  let query = supabase
                    .from("nasaq_logs")
                    .delete()
                    .eq("surah_id", selected.id)
                    .eq("user_name", userName);

                  if (currentGroup.id) {
                    query = query.eq("group_id", currentGroup.id);
                  } else {
                    query = query.is("group_id", null); // 👈 وهنا كمان
                  }

                  await query;
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
              <GroupInfoModal
                theme={theme}
                currentGroup={currentGroup}
                userName={userName.split("_GUEST_")[0]}
                groupStats={groupStats}
                progress={calculateGlobalProgress()}
                onClose={() => setShowGroupInfo(false)}
                onLeave={() => {
                  if (
                    window.confirm("متأكد من الخروج؟ (قراءاتك ستظل محفوظة)")
                  ) {
                    leaveGroup(currentGroup.id);
                    setShowGroupInfo(false);
                  }
                }}
                onReset={async (type) => {
                  if (type === "personal") {
                    await supabase
                      .from("nasaq_logs")
                      .delete()
                      .eq("group_id", currentGroup.id)
                      .eq("user_name", userName);
                    alert("تم مسح قراءاتك بنجاح.");
                  } else {
                    const userInput = window.prompt(
                      `هل أنت متأكد أنك تريد إعادة التعيين؟\nللتأكيد، اكتب اسم المجموعة:\n"${currentGroup.name}"`,
                    );
                    if (userInput === currentGroup.name) {
                      await supabase
                        .from("nasaq_logs")
                        .delete()
                        .eq("group_id", currentGroup.id);
                      alert("تم تصفير قراءات المجموعة بالكامل بنجاح.");
                    }
                  }
                  fetchData();
                  if (type === "personal") setShowGroupInfo(false);
                }}
                onDeleteGroup={async () => {
                  const userInput = window.prompt(
                    `⚠️ خطر: هل أنت متأكد من حذف المجموعة نهائياً؟\nللتأكيد، اكتب اسم المجموعة:\n"${currentGroup.name}"`,
                  );
                  if (userInput === currentGroup.name) {
                    await supabase
                      .from("nasaq_logs")
                      .delete()
                      .eq("group_id", currentGroup.id);
                    await supabase
                      .from("group_members")
                      .delete()
                      .eq("group_id", currentGroup.id);
                    await supabase
                      .from("groups")
                      .delete()
                      .eq("id", currentGroup.id);
                    setcurrentGroup(null);
                    setShowGroupInfo(false);
                    fetchData();
                    alert("تم حذف المجموعة نهائياً.");
                  }
                }}
                onKickUser={async (kickedUser) => {
                  if (
                    window.confirm(
                      `هل أنت متأكد من طرد "${kickedUser}" من المجموعة؟ سيتم حذف قراءاته أيضاً.`,
                    )
                  ) {
                    await supabase
                      .from("nasaq_logs")
                      .delete()
                      .eq("group_id", currentGroup.id)
                      .eq("user_name", kickedUser);
                    await supabase
                      .from("group_members")
                      .delete()
                      .eq("group_id", currentGroup.id)
                      .eq("user_name", kickedUser);
                    fetchData();
                  }
                }}
                onRegenerateCode={async () => {
                  if (
                    window.confirm(
                      "هل تريد تغيير كود الدعوة؟ الرابط القديم لن يعمل بعد الآن.",
                    )
                  ) {
                    const newCode = Math.random()
                      .toString(36)
                      .substring(2, 7)
                      .toUpperCase();
                    await supabase
                      .from("groups")
                      .update({ invite_code: newCode })
                      .eq("id", currentGroup.id);
                    setcurrentGroup({ ...currentGroup, invite_code: newCode });
                    alert("تم تغيير رابط الدعوة بنجاح.");
                  }
                }}
              />
            )}

            {/* رسالة الخروج */}
            {exitToast && (
              <div className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[9999] bg-slate-800 text-white px-6 py-3 rounded-full font-black text-sm shadow-2xl animate-in slide-in-from-bottom-5 fade-in whitespace-nowrap">
                اضغط مرة أخرى للخروج
              </div>
            )}
          </div>
        )}
      </main>
      <OfflineBadge
        isOnline={isOnline}
        showOfflineBadge={showOfflineBadge}
        theme={theme}
      />
      <ToastMessage toast={toast} theme={theme} />
    </FontContext.Provider>
  );
}
