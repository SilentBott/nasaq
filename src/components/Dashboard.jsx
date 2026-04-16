import { useState, useContext, useRef } from "react";
import { FontContext } from "../FontContext";
import SettingsMenu from "./SettingsMenu";
import {
  User,
  Users,
  ChevronDown,
  LogOut,
  Settings,
  Globe,
  Lock,
} from "lucide-react";

export default function Dashboard({
  userName,
  myGroups,
  setcurrentGroup,
  onLeaveGroup,
  onCreate,
  onJoin,
  onLogout,
}) {
  const { theme } = useContext(FontContext);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [jInp, setJInp] = useState("");
  const [createName, setCreateName] = useState("");
  const [isPrivateGroup, setIsPrivateGroup] = useState(false);
  const [holdingGroupId, setHoldingGroupId] = useState(null);
  const [holdProgress, setHoldProgress] = useState(0);

  const intervalRef = useRef(null);
  const groupDelayRef = useRef(null);

  const startGroupHold = (group) => {
    if (intervalRef.current || groupDelayRef.current) return;
    setHoldingGroupId(group.id);
    setHoldProgress(0);

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
    if (groupDelayRef.current) clearTimeout(groupDelayRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    groupDelayRef.current = null;
    intervalRef.current = null;
    setHoldProgress(0);
    setHoldingGroupId(null);
  };

  return (
    <div className="p-6 text-right max-w-2xl mx-auto">
      <header className="flex flex-row justify-between items-center mb-10">
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
            onClick={onLogout}
            className={`p-3 rounded-full border dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20 bg-white text-slate-400`}
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="space-y-2">
        <button
          onClick={() =>
            setcurrentGroup({
              id: null,
              name: "ختمتي الشخصية",
              is_private: true,
            })
          }
          className={`w-full ${theme === "dark" ? "bg-emerald-900/10 border-emerald-800" : "bg-white border-slate-200"} border-2 p-3 rounded-[3rem] flex flex-row-reverse justify-between items-center group active:scale-95 shadow-sm`}
        >
          <div className="bg-amber-500/10 p-3 ml-3 rounded-3xl">
            <User size={28} className="text-amber-500" />
          </div>
          <div className="flex flex-row-reverse items-center gap-5 mr-3">
            <div>
              <h3 className="font-black font-serif text-xl sm:text-2xl mb-1">
                ختمتي الشخصية
              </h3>
              <p className="text-emerald-600 text-xs sm:text-sm font-bold uppercase font-mono">
                أنت فقط
              </p>
            </div>
            <ChevronDown className="rotate-90 text-slate-300" />
          </div>
        </button>

        {myGroups?.map((k) => (
          <button
            key={k.id}
            onClick={() => {
              if (holdProgress === 0) setcurrentGroup(k);
            }}
            onPointerDown={() => startGroupHold(k)}
            onPointerUp={cancelGroupHold}
            onPointerLeave={cancelGroupHold}
            onContextMenu={(e) => e.preventDefault()}
            className={`w-full relative overflow-hidden touch-manipulation select-none ${theme === "dark" ? "bg-emerald-900/5 border-emerald-800/50" : "bg-white border-slate-100"} border p-5 rounded-[3rem] flex flex-row-reverse justify-between items-center group active:scale-95 shadow-sm`}
          >
            {holdingGroupId === k.id && holdProgress > 0 && (
              <div
                className="absolute top-0 right-0 bottom-0 bg-red-500/30 z-0 transition-all ease-linear duration-75"
                style={{ width: `${holdProgress}%` }}
              />
            )}

            <div className="flex flex-row-reverse items-center gap-5 relative z-10">
              <div
                className={`p-4 rounded-3xl ${k.is_private ? "bg-amber-500/10" : "bg-emerald-500/5"}`}
              >
                {k.is_private ? (
                  <Lock size={28} className="text-amber-500" />
                ) : (
                  <Globe size={28} className="text-emerald-500" />
                )}
              </div>
              <div>
                <h3 className="font-black font-serif text-xl sm:text-2xl mb-1">
                  {k.name}
                </h3>
                <p className="text-slate-500 text-xs sm:text-sm font-bold uppercase tracking-widest">
                  أنشأها: {k.creator_name === userName ? "أنت" : k.creator_name}
                </p>
              </div>
            </div>
            <ChevronDown className="rotate-90 text-slate-300 relative z-10" />
          </button>
        ))}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12">
          <div className="dark:bg-emerald-900/5 bg-white border border-dashed p-7 rounded-[2.5rem] border-inherit shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onCreate(createName, isPrivateGroup);
                setCreateName("");
                setIsPrivateGroup(false);
              }}
            >
              <div className="relative w-full">
                <input
                  type="text"
                  maxLength={30}
                  placeholder="اسم المجموعة المرجو إنشاؤها"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className={`w-full p-4 pl-14 rounded-2xl border font-bold transition-all focus:outline-none focus:ring-2 ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-600 focus:ring-emerald-500 text-white placeholder-slate-400"
                      : "bg-white border-slate-200 focus:ring-emerald-400 text-slate-800 placeholder-slate-400"
                  }`}
                />

                <button
                  type="button"
                  onClick={() => setIsPrivateGroup(!isPrivateGroup)}
                  title={isPrivateGroup ? "ختمة شخصية (خاصة)" : "مجموعة عامة"}
                  className={`absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all active:scale-95 ${
                    isPrivateGroup
                      ? theme === "dark"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-amber-100 text-amber-600"
                      : theme === "dark"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {isPrivateGroup ? <Lock size={20} /> : <Globe size={20} />}
                </button>
              </div>

              <button
                type="submit"
                className={`w-full mt-4 p-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 ${
                  theme === "dark"
                    ? "bg-emerald-600 hover:bg-emerald-500"
                    : "bg-emerald-500 hover:bg-emerald-400"
                }`}
              >
                إنشاء المجموعة
              </button>
            </form>
          </div>

          <div className="dark:bg-emerald-900/5 bg-white border border-dashed p-7 rounded-[2.5rem] border-inherit shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onJoin(jInp);
                setJInp("");
              }}
            >
              <div className="relative w-full">
                <input
                  type="text"
                  maxLength={30}
                  value={jInp}
                  onChange={(e) => setJInp(e.target.value)}
                  placeholder="اسم المجموعة المراد الانضمام لها"
                  className={`w-full p-4 rounded-2xl border font-bold transition-all focus:outline-none focus:ring-2 ${
                    theme === "dark"
                      ? "bg-slate-800/50 border-slate-600 focus:ring-amber-500 text-white placeholder-slate-400"
                      : "bg-white border-slate-200 focus:ring-amber-400 text-slate-800 placeholder-slate-400"
                  }`}
                />
              </div>
              <button
                type="submit"
                className={`w-full mt-4 p-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 ${
                  theme === "dark"
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-amber-500 hover:bg-amber-400"
                }`}
              >
                الإنضمام لمجموعة
              </button>
            </form>
          </div>
        </div>
      </div>

      <SettingsMenu
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
}
