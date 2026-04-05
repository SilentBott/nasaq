import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "./lib/supabase";
import { SURAHS } from "./data/surahs";
import Auth from "./components/Auth";
import Dashboard from "./components/Dashboard";
import SurahCard from "./components/SurahCard";
import KhatmahModal from "./components/KhatmahModal";
import { ArrowLeft, LogOut } from "lucide-react";

export default function App() {
  // get the user, define other important things
  const [userName, setUserName] = useState(
    () => localStorage.getItem("إسم_الحساب") || "",
  );
  const [currentGroup, setcurrentGroup] = useState(null);
  const [myKhatmats, setMyKhatmats] = useState([]);
  const [loginNameInput, setLoginNameInput] = useState("");
  const [newKhatmahName, setNewKhatmahName] = useState("");
  const [logs, setLogs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [vRanges, setVRanges] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [quickRegister, setQuickRegister] = useState(false);
  const pressTimer = useRef(null);

  // get/set user
  const fetchData = useCallback(async () => {
    if (!userName) return;
    const { data: members } = await supabase
      .from("khatmah_members")
      .select("khatmah_id")
      .eq("user_name", userName);
    const ids = members?.map((m) => m.khatmah_id) || [];
    // get all the khatmah groups
    const { data: khatmats } = await supabase
      .from("khatmats")
      .select("*")
      .or(
        `creator_name.eq.${userName},id.in.(${ids.length ? ids.join(",") : "00000000-0000-0000-0000-000000000000"})`,
      );
    setMyKhatmats(khatmats || []);
    // if the page is the khatmah group
    if (currentGroup) {
      let q = supabase.from("khatmah_logs").select("*");
      if (currentGroup.id === null)
        q = q.is("khatmah_id", null).eq("user_name", userName);
      else q = q.eq("khatmah_id", currentGroup.id);
      const { data } = await q.order("created_at", { ascending: true });
      setLogs(data || []);
    }
  }, [userName, currentGroup]);

  // handle user logout
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    localStorage.removeItem("إسم_الحساب");
    if (error) {
      console.error("Error:", error.message);
    } else {
      // جيت هاب أو الموقع هيحس بتغيير الـ Auth state ويرجعك للـ Login
      // لو حابب تتأكد، ضيف السطر ده:
      window.location.reload();
    }
  };

  useEffect(() => {
    fetchData();
    const sub = supabase
      .channel("realtime")
      .on("postgres_changes", { event: "*", schema: "public" }, fetchData)
      .subscribe();
    return () => supabase.removeChannel(sub);
  }, [fetchData]);

  const handleLongPress = (surah) => {
    if (!surah) {
      clearTimeout(pressTimer.current);
      return;
    }
    pressTimer.current = setTimeout(async () => {
      await supabase.from("khatmah_logs").insert({
        surah_id: surah.id,
        user_name: userName,
        status: "completed",
        verse_start: 1,
        verse_end: surah.ayat,
        khatmah_id: currentGroup.id,
      });
    }, 4000);
  };
  // hangleClaim = تسجيل الآيات علي الموقع
  const handleClaim = async () => {
    setLoading(true);
    const active = vRanges.filter(
      (r) => r.isActive && !r.isSaved && r.start > 0 && r.end > 0,
    );
    const total =
      logs
        .filter((l) => l.surah_id === selected.id)
        .reduce((s, l) => s + (l.verse_end - l.verse_start + 1), 0) +
      active.reduce((s, r) => s + (r.end - r.start + 1), 0);
    const isFull = total >= selected.ayat;

    const inserts = active.map((r) => ({
      surah_id: selected.id,
      user_name: userName,
      status: isFull ? "completed" : "reading",
      verse_start: r.start,
      verse_end: r.end,
      khatmah_id: currentGroup.id,
    }));
    if (inserts.length > 0) await supabase.from("khatmah_logs").insert(inserts);
    setLoading(false);
    setSelected(null);
    setQuickRegister(false);
  };

  const deleteSurahLogs = async () => {
    if (!window.confirm("حذف جميع قراءاتك لهذه السورة؟")) return;
    setLoading(true);
    const q = supabase
      .from("khatmah_logs")
      .delete()
      .match({ surah_id: selected.id, user_name: userName });
    if (currentGroup.id === null) q.is("khatmah_id", null);
    else q.eq("khatmah_id", currentGroup.id);
    await q;
    setLoading(false);
    setSelected(null);
  };
  // عرض معلومات السوره وغيرها عند الضغط
  const openModal = (surah) => {
    setSelected(surah);
    const my = logs.filter(
      (l) => l.surah_id === surah.id && l.user_name === userName,
    );
    if (my.length > 0)
      setVRanges([
        ...my.map((l) => ({
          id: l.id,
          start: l.verse_start,
          end: l.verse_end,
          isActive: true,
          isSaved: true,
        })),
        { start: 0, end: 0, isActive: false, isSaved: false },
      ]);
    else {
      const sLogs = logs.filter((l) => l.surah_id === surah.id);
      const next =
        sLogs.length === 0 ? 1 : Math.max(...sLogs.map((l) => l.verse_end)) + 1;
      setVRanges([
        {
          start: Math.min(next, surah.ayat),
          end: 0,
          isActive: false,
          isSaved: false,
        },
      ]);
    }
  };
  //! choose name page
  if (!userName)
    return (
      <Auth
        loginNameInput={loginNameInput}
        setLoginNameInput={setLoginNameInput}
        onLogin={() => {
          if (loginNameInput) {
            localStorage.setItem("إسم_الحساب", loginNameInput);
            setUserName(loginNameInput);
            setLoginNameInput("");
          }
        }}
      />
    );
  //! Dashboard page
  if (!currentGroup)
    return (
      <Dashboard
        userName={userName}
        myKhatmats={myKhatmats}
        setcurrentGroup={setcurrentGroup}
        newKhatmahName={newKhatmahName}
        setNewKhatmahName={setNewKhatmahName}
        onCreate={async () => {
          const { data, error } = await supabase
            .from("khatmats")
            .insert({ name: newKhatmahName, creator_name: userName })
            .select()
            .single();
          if (!error) {
            await supabase
              .from("khatmah_members")
              .insert({ khatmah_id: data.id, user_name: userName });
            setNewKhatmahName("");
          } else alert("الاسم موجود");
        }}
        loginNameInput={loginNameInput}
        setLoginNameInput={setLoginNameInput}
        onJoin={async () => {
          const { data } = await supabase
            .from("khatmats")
            .select("id")
            .eq("name", loginNameInput)
            .single();
          if (data) {
            await supabase
              .from("khatmah_members")
              .insert({ khatmah_id: data.id, user_name: userName });
            setLoginNameInput("");
          } else alert("لا توجد ختمة");
        }}
        onLogout={handleLogout}
      />
    );
  //! group page
  return (
    <div className="min-h-screen bg-emerald-950 text-white pb-10 text-right">
      <header className="p-4 border-b border-emerald-800/50 flex flex-row-reverse justify-between items-center sticky top-0 bg-emerald-950/90 backdrop-blur-md z-10">
        <div className="flex flex-row-reverse items-center gap-3">
          <button
            onClick={() => setcurrentGroup(null)}
            className="p-2 bg-emerald-900/50 rounded-xl text-emerald-500"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-amber-400 leading-none">
              {currentGroup.name}
            </h1>
            <p className="text-[9px] text-emerald-600 mt-1 uppercase tracking-widest">
              {userName}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            const msg =
              currentGroup.creator_name === userName
                ? "حذف الختمة؟"
                : "الخروج؟";
            if (window.confirm(msg)) {
              if (currentGroup.creator_name === userName)
                await supabase
                  .from("khatmats")
                  .delete()
                  .eq("id", currentGroup.id);
              else
                await supabase
                  .from("khatmah_members")
                  .delete()
                  .match({ khatmah_id: currentGroup.id, user_name: userName });
              setcurrentGroup(null);
            }
          }}
          className="p-2 bg-red-950/20 border border-red-900/30 rounded-xl text-red-500 hover:bg-red-900/40 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </header>

      <div className="flex flex-col items-center py-6 gap-4">
        <button
          onClick={() => setQuickRegister(true)}
          className="text-white text-lg font-bold underline decoration-white underline-offset-8 hover:text-amber-400 hover:decoration-amber-400 transition-all"
        >
          تسجيل سريع
        </button>
        <div className="flex flex-wrap flex-row-reverse justify-center gap-2">
          {[
            { id: "all", label: "كلّ السور" },
            { id: "completed", label: "التي تم إنجازها" },
            { id: "remaining", label: "ما لم أنجزه" },
            { id: "mine", label: "ما نحن فيه" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setFilter(t.id)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold border transition-all ${filter === t.id ? "bg-amber-500 border-amber-500 text-emerald-950" : "bg-emerald-900/30 border-emerald-800 text-emerald-500"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main
        dir="rtl"
        className="p-4 max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 text-center"
      >
        {SURAHS.filter((s) => {
          const sLogs = logs.filter((l) => l.surah_id === s.id);
          const done =
            sLogs.some((l) => l.status === "completed") ||
            sLogs.reduce(
              (sum, l) => sum + (l.verse_end - l.verse_start + 1),
              0,
            ) >= s.ayat;
          if (filter === "completed") return done;
          if (filter === "remaining") return !done;
          if (filter === "mine")
            return sLogs.some((l) => l.status === "reading") && !done;
          return true;
        }).map((s) => (
          <SurahCard
            key={s.id}
            s={s}
            logs={logs}
            userName={userName}
            onStartPress={handleLongPress}
            onEndPress={() => clearTimeout(pressTimer.current)}
            onClick={openModal}
          />
        ))}
      </main>

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
        onClaim={handleClaim}
        onDeleteAll={deleteSurahLogs}
        getOccupiedVerses={(surahId) => {
          const occupied = new Set();
          logs
            .filter((l) => l.surah_id === surahId)
            .forEach((log) => {
              for (let i = log.verse_start; i <= log.verse_end; i++)
                occupied.add(i);
            });
          return occupied;
        }}
        openModal={openModal}
      />
    </div>
  );
}
