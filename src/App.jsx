import {
  useState,
  useEffect,
  useCallback,
  useMemo,
  lazy,
  Suspense,
} from "react";
import { supabase } from "./lib/supabase";
import { SURAHS } from "./data/surahs";
import { FontContext } from "./FontContext";
import { useNasaqLogic } from "./hooks/useNasaqLogic";
import SurahCard from "./components/SurahCard";
import { Info } from "lucide-react";

// الاستدعاء الذكي للواجهات لسرعة التحميل
const Auth = lazy(() => import("./components/Auth"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const KhatmahModal = lazy(() => import("./components/KhatmahModal"));
const GroupHeader = lazy(() => import("./components/GroupHeader"));
const SurahFilterBar = lazy(() => import("./components/SurahFilterBar"));
const GroupInfoModal = lazy(() => import("./components/GroupInfoModal"));
const ToastMessage = lazy(() => import("./components/ToastMessage"));
const OfflineBadge = lazy(() => import("./components/OfflineBadge"));
const AboutView = lazy(() => import("./components/AboutView"));

export default function App() {
  const [userName, setUserName] = useState(
    () => localStorage.getItem("إسم_الحساب") || "",
  );
  const [view, setView] = useState("main");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "normal",
    isClosing: false,
  });
  const [selected, setSelected] = useState(null);
  const [quickRegister, setQuickRegister] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [filter, setFilter] = useState("all");
  const [vRanges, setVRanges] = useState([]);
  const [loading, setLoading] = useState(false);

  // إعدادات الخط والثيم (الـ Context)
  const [fontSize, setFontSize] = useState(
    () => Number(localStorage.getItem("font-size")) || 5,
  );
  const [themeSetting, setThemeSetting] = useState(
    () => localStorage.getItem("nasaq-theme") || "auto",
  );
  const [theme, setTheme] = useState("light");
  const [streak, setStreak] = useState(
    () => Number(localStorage.getItem("nasaq-streak")) || 0,
  );
  const [verseViewMode, setVerseViewMode] = useState(
    () => localStorage.getItem("nasaq-verse-mode") || "both",
  );
  const [highlightMode, setHighlightMode] = useState(
    () => localStorage.getItem("nasaq-h-mode") || "full",
  );
  // 👇 معالج المظهر الليلي (Theme Manager) 👇
  useEffect(() => {
    localStorage.setItem("nasaq-theme", themeSetting);
    if (themeSetting === "dark") {
      setTheme("dark");
    } else if (themeSetting === "light") {
      setTheme("light");
    } else {
      // المظهر التلقائي حسب نظام الجهاز
      const isSystemDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setTheme(isSystemDark ? "dark" : "light");
    }
  }, [themeSetting]);

  useEffect(() => {
    // تفعيل الكلاس في المتصفح عشان الـ Tailwind يشتغل
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
  // دالة الإشعارات
  const showToastMsg = useCallback(
    (message, type = "normal", subMessage = "") => {
      setToast({ show: true, isClosing: false, message, type, subMessage });
      setTimeout(() => setToast((p) => ({ ...p, isClosing: true })), 3000);
      setTimeout(() => setToast((p) => ({ ...p, show: false })), 4000);
    },
    [],
  );

  // استخدام الـ Hook لفصل تعقيدات الداتا بيز
  const {
    currentGroup,
    setcurrentGroup,
    myGroups,
    logs,
    setLogs,
    isOnline,
    fetchData,
  } = useNasaqLogic(userName, showToastMsg);

  // تحديث الشعلة (الستريك)
  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastRead = localStorage.getItem("nasaq-last-read");
    if (lastRead === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (lastRead === yesterday.toDateString()) setStreak((p) => p + 1);
    else setStreak(1);
    localStorage.setItem("nasaq-last-read", today);
  };
  // 👇 1. نظام الحفظ الذكي (أونلاين وأوفلاين) 👇
  const safeInsertLogs = async (inserts) => {
    // تحديث الشاشة فوراً عشان اليوزر يشوف إنجازه اتسجل (Optimistic UI)
    const enrichedInserts = inserts.map((i) => ({
      ...i,
      id: Date.now() + Math.random(),
    }));
    setLogs((prev) => [...prev, ...enrichedInserts]);

    if (navigator.onLine) {
      try {
        const cleanInserts = inserts.map(({ id, ...rest }) => rest);
        const { error } = await supabase
          .from("nasaq_logs")
          .insert(cleanInserts);
        if (error) throw error;
      } catch (err) {
        saveToOfflineQueue(inserts);
      }
    } else {
      showToastMsg("وضع عدم الاتصال: تم حفظ قراءتك محلياً ⏳", "normal");
      saveToOfflineQueue(inserts);
    }
    updateStreak();
  };

  const saveToOfflineQueue = (inserts) => {
    const pending = JSON.parse(
      localStorage.getItem("nasaq_pending_logs") || "[]",
    );
    pending.push(...inserts);
    localStorage.setItem("nasaq_pending_logs", JSON.stringify(pending));
  };

  // 👇 2. دالة المزامنة التلقائية (بتشتغل أول ما النت يرجع) 👇
  const syncOfflineLogs = useCallback(async () => {
    if (!navigator.onLine) return;
    const pending = JSON.parse(
      localStorage.getItem("nasaq_pending_logs") || "[]",
    );
    if (pending.length === 0) return;

    try {
      const cleanInserts = pending.map(({ id, ...rest }) => rest);
      const { error } = await supabase.from("nasaq_logs").insert(cleanInserts);
      if (!error) {
        localStorage.removeItem("nasaq_pending_logs");
        showToastMsg("تمت مزامنة قراءاتك السابقة بنجاح! 🌍", "success");
        fetchData();
      }
    } catch (err) {
      console.error("Sync Error", err);
    }
  }, [fetchData, showToastMsg]);

  // 👇 3. تشغيل المزامنة تلقائياً 👇
  useEffect(() => {
    window.addEventListener("online", syncOfflineLogs);
    if (navigator.onLine) syncOfflineLogs(); // لو فتحت التطبيق والنت شغال هيرفع اللي فات
    return () => window.removeEventListener("online", syncOfflineLogs);
  }, [syncOfflineLogs]);
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if (e.key === "/" && e.target.tagName !== "INPUT") {
        e.preventDefault();
        setQuickRegister(true);
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, []);
  // حساب الآيات الفريدة
  const getUniqueVersesCount = (surahLogs) => {
    if (!surahLogs || !Array.isArray(surahLogs)) return 0;
    const covered = new Set();
    surahLogs.forEach((l) => {
      if (l.verse_start && l.verse_end)
        for (let i = l.verse_start; i <= l.verse_end; i++) covered.add(i);
    });
    return covered.size;
  };

  const calculateGlobalProgress = () => {
    const total = 6236;
    const covered = new Set();
    logs.forEach((l) => {
      if (l.verse_start)
        for (let i = l.verse_start; i <= l.verse_end; i++)
          covered.add(`${l.surah_id}-${i}`);
    });
    return ((covered.size / total) * 100).toFixed(1);
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

  const generateInviteCode = () =>
    Math.random().toString(36).substring(2, 7).toUpperCase();

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
    if (my?.length > 0) {
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
    } else {
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
        showToastMsg("يحتاج إلى إنترنت", "warning");
        setLoading(false);
        return;
      }
      let query = supabase
        .from("nasaq_logs")
        .delete()
        .eq("surah_id", surah.id)
        .eq("user_name", userName);
      if (currentGroup.id) query = query.eq("group_id", currentGroup.id);
      else query = query.is("group_id", null);
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
          group_id: currentGroup.id || null,
        },
      ]);
    }
    fetchData();
    setLoading(false);
  };

  return (
    <FontContext.Provider
      value={{
        fontSize,
        setFontSize,
        theme,
        setTheme,
        themeSetting,
        setThemeSetting,
        streak,
        setStreak,
        verseViewMode,
        setVerseViewMode,
        highlightMode,
        setHighlightMode,
        getUniqueVersesCount,
      }}
    >
      <main
        dir="rtl"
        className={`min-h-screen transition-all ${theme === "dark" ? "bg-[#042f24] text-white" : "bg-emerald-50 text-slate-900"}`}
      >
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center font-black text-emerald-500">
              جاري التحميل...
            </div>
          }
        >
          {!userName ? (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center relative pb-24">
              <Auth
                theme={theme}
                onLogin={(n) => {
                  const safeName = n.trim().substring(0, 30);
                  setUserName(safeName);
                  localStorage.setItem("إسم_الحساب", safeName);
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
                <AboutView theme={theme} onClose={() => setView("main")} />
              )}
            </div>
          ) : !currentGroup ? (
            <div className="relative min-h-screen max-w-3xl mx-auto flex flex-col p-4 sm:p-8">
              <Dashboard
                userName={userName.split("_GUEST_")[0]}
                myGroups={myGroups}
                setcurrentGroup={setcurrentGroup}
                onLogout={() => {
                  setUserName("");
                  localStorage.removeItem("إسم_الحساب");
                  showToastMsg("إلى اللقاء 👋", "normal");
                }}
                onLeaveGroup={async (groupId) => {
                  await supabase
                    .from("group_members")
                    .delete()
                    .eq("group_id", groupId)
                    .eq("user_name", userName);
                  setcurrentGroup(null);
                  fetchData();
                }}
                onCreate={async (rawName, isPrivate) => {
                  if (!navigator.onLine)
                    return showToastMsg("يجب أن تكون متصلاً", "error");
                  if (!rawName || !rawName.trim())
                    return showToastMsg("يرجى كتابة اسم المجموعة", "warning");
                  const name = rawName.trim().substring(0, 30);
                  try {
                    if (!isPrivate) {
                      const { data: check } = await supabase
                        .from("groups")
                        .select("id")
                        .eq("name", name)
                        .eq("is_private", false);
                      if (check && check.length > 0)
                        return showToastMsg("هذا الاسم موجود مسبقاً", "error");
                    }
                    const inviteCode = generateInviteCode();
                    const { data, error } = await supabase
                      .from("groups")
                      .insert([
                        {
                          name,
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
                      showToastMsg(`تم إنشاء "${name}" بنجاح`, "success");
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                onJoin={async (name) => {
                  if (!navigator.onLine)
                    return showToastMsg("يجب أن تكون متصلاً", "error");
                  if (!name.trim())
                    return showToastMsg("يرجى كتابة اسم المجموعة", "warning");
                  try {
                    const { data: groupsData } = await supabase
                      .from("groups")
                      .select("*")
                      .eq("name", name.trim())
                      .eq("is_private", false);
                    if (!groupsData || groupsData.length === 0)
                      return showToastMsg(
                        "لم نجد مجموعة عامة بهذا الاسم",
                        "error",
                      );
                    const target = groupsData[0];
                    const { data: memberCheck } = await supabase
                      .from("group_members")
                      .select("*")
                      .eq("group_id", target.id)
                      .eq("user_name", userName);
                    if (!memberCheck || memberCheck.length === 0) {
                      await supabase
                        .from("group_members")
                        .insert([{ group_id: target.id, user_name: userName }]);
                    }
                    await fetchData();
                    setcurrentGroup(target);
                    showToastMsg(`تم الانضمام إلى "${name}"!`, "success");
                  } catch (err) {
                    console.error(err);
                  }
                }}
              />
              <footer className="text-center mt-auto pb-4">
                <button
                  onClick={() => setView("about")}
                  className="opacity-40 hover:opacity-100 font-black text-xs flex items-center gap-2 mx-auto"
                >
                  <Info size={14} /> عن نَسَق
                </button>
              </footer>
              {view === "about" && (
                <AboutView theme={theme} onClose={() => setView("main")} />
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex flex-col p-4 sm:p-8 min-h-screen">
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
              <SurahFilterBar
                theme={theme}
                filter={filter}
                setFilter={setFilter}
                onQuickRegister={() => setQuickRegister(true)}
              />

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-12">
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

              <footer className="py-4 text-center border-t border-emerald-500/5 mt-auto">
                <button
                  onClick={() => setView("about")}
                  className="opacity-40 hover:opacity-100 font-black text-xs flex items-center gap-2 mx-auto"
                >
                  <Info size={14} /> عن نَسَق
                </button>
              </footer>
              {view === "about" && (
                <AboutView theme={theme} onClose={() => setView("main")} />
              )}
            </div>
          )}
          {showGroupInfo && (
            <GroupInfoModal
              theme={theme}
              currentGroup={currentGroup}
              userName={userName}
              groupStats={groupStats}
              progress={calculateGlobalProgress()}
              onClose={() => setShowGroupInfo(false)}
              onLeave={() => {
                if (window.confirm("متأكد من الخروج؟")) {
                  supabase
                    .from("group_members")
                    .delete()
                    .eq("group_id", currentGroup.id)
                    .eq("user_name", userName)
                    .then(() => {
                      setcurrentGroup(null);
                      setShowGroupInfo(false);
                      fetchData();
                    });
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
                  setShowGroupInfo(false);
                } else {
                  const userInput = window.prompt(
                    `لتأكيد التصفير للجميع، اكتب: ${currentGroup.name}`,
                  );
                  if (userInput === currentGroup.name) {
                    await supabase
                      .from("nasaq_logs")
                      .delete()
                      .eq("group_id", currentGroup.id);
                    alert("تم التصفير بنجاح.");
                  }
                }
                fetchData();
              }}
              onDeleteGroup={async () => {
                const userInput = window.prompt(
                  `للتأكيد على حذف المجموعة نهائياً اكتب: ${currentGroup.name}`,
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
                  alert("تم حذف المجموعة.");
                }
              }}
              onKickUser={async (kicked) => {
                if (window.confirm(`طرد ${kicked} وحذف قراءاته؟`)) {
                  await supabase
                    .from("nasaq_logs")
                    .delete()
                    .eq("group_id", currentGroup.id)
                    .eq("user_name", kicked);
                  await supabase
                    .from("group_members")
                    .delete()
                    .eq("group_id", currentGroup.id)
                    .eq("user_name", kicked);
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
                  const { error } = await supabase
                    .from("groups")
                    .update({ invite_code: newCode })
                    .eq("id", currentGroup.id);
                  if (error) {
                    showToastMsg("حدث خطأ أثناء تغيير الرابط", "error");
                  } else {
                    setcurrentGroup((prev) => ({
                      ...prev,
                      invite_code: newCode,
                    }));
                    // إنشاء الرابط الجديد ونسخه فوراً
                    const newLink = `${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(currentGroup.name)}&code=${newCode}`;
                    navigator.clipboard.writeText(newLink);
                    showToastMsg(
                      "تم التغيير ونسخ الرابط الجديد! 📋",
                      "success",
                    );
                  }
                }
              }}
            />
          )}

          {(selected || quickRegister) && (
            <KhatmahModal
              selected={selected}
              setSelected={setSelected}
              quickRegister={quickRegister}
              setQuickRegister={setQuickRegister}
              logs={logs}
              currentGroup={currentGroup}
              userName={userName}
              vRanges={vRanges}
              setVRanges={setVRanges}
              loading={loading}
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
              onClaim={async () => {
                setLoading(true);
                const active = vRanges.filter(
                  (r) => r.isActive && !r.isSaved && r.start > 0 && r.end > 0,
                );
                const inserts = active.map((r) => ({
                  surah_id: selected?.id,
                  user_name: userName,
                  status: "reading",
                  verse_start: r.start,
                  verse_end: r.end,
                  group_id: currentGroup?.id || null,
                }));
                if (inserts.length > 0) {
                  await safeInsertLogs(inserts);
                  await fetchData();
                }
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
                  group_id: currentGroup?.id || null,
                }));
                if (enriched.length > 0) {
                  await safeInsertLogs(enriched);
                  await fetchData();
                  showToastMsg("تم الورد بنجاح! 🌟", "success");
                }
                setLoading(false);
                setSelected(null);
                setQuickRegister(false);
              }}
              onDeleteAll={async () => {
                if (!navigator.onLine)
                  return showToastMsg("يحتاج إلى إنترنت", "warning");
                if (window.confirm("حذف كل قراءاتك في هذه السورة؟")) {
                  let query = supabase
                    .from("nasaq_logs")
                    .delete()
                    .eq("surah_id", selected?.id)
                    .eq("user_name", userName);
                  if (currentGroup && currentGroup.id)
                    query = query.eq("group_id", currentGroup.id);
                  else query = query.is("group_id", null);
                  await query;
                  await fetchData();
                  setSelected(null);
                }
              }}
              onDeleteRange={async (id) => {
                if (id) {
                  await supabase.from("nasaq_logs").delete().eq("id", id);
                  await fetchData();
                }
              }}
            />
          )}

          <ToastMessage toast={toast} theme={theme} />
          <OfflineBadge
            isOnline={isOnline}
            showOfflineBadge={!isOnline}
            theme={theme}
          />
        </Suspense>
      </main>
    </FontContext.Provider>
  );
}
