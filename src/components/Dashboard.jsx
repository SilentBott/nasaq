//! Dashboard page ()
import { User, Users, ChevronDown, Plus } from "lucide-react";

export default function Dashboard({
  userName,
  myKhatmats,
  setcurrentGroup,
  newKhatmahName,
  setNewKhatmahName,
  onCreate,
  joinInput,
  setJoinInput,
  onJoin,
}) {
  return (
    <div className="min-h-screen bg-emerald-950 text-white p-6 text-right">
      <header className="max-w-2xl mx-auto flex flex-row-reverse justify-between items-center mb-12">
        <h1 className="text-2xl font-bold text-amber-400 font-serif">ختماتي</h1>
        <div className="bg-emerald-900 px-4 py-1 rounded-full text-xs border border-emerald-800 flex flex-row-reverse items-center gap-2">
          <User className="w-3 h-3 text-amber-500" /> {userName}
        </div>
      </header>
      <div className="max-w-2xl mx-auto space-y-4">
        <button
          onClick={() => setcurrentGroup({ id: null, name: "ختمتي الشخصية" })}
          className="w-full bg-emerald-900/40 border-2 border-amber-500/20 p-6 rounded-3xl flex flex-row-reverse justify-between items-center hover:border-amber-500/50 transition-all group"
        >
          <div className="flex flex-row-reverse items-center gap-4 text-right">
            <div className="bg-amber-500/10 p-3 rounded-2xl group-hover:bg-amber-500/20">
              <User className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold">ختمتي الشخصية</h3>
              <p className="text-emerald-600 text-xs mt-1">خاصة بك فقط</p>
            </div>
          </div>
          <ChevronDown className="rotate-90 text-emerald-800" />
        </button>
        {myKhatmats.map((k) => (
          <button
            key={k.id}
            onClick={() => setcurrentGroup(k)}
            className="w-full bg-emerald-900/20 border border-emerald-800 p-6 rounded-3xl flex flex-row-reverse justify-between items-center hover:bg-emerald-900/40 transition-all"
          >
            <div className="flex flex-row-reverse items-center gap-4 text-right">
              <div className="bg-emerald-800/50 p-3 rounded-2xl">
                <Users className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{k.name}</h3>
                <p className="text-emerald-700 text-[10px]">
                  بواسطة: {k.creator_name}
                </p>
              </div>
            </div>
            <ChevronDown className="rotate-90 text-emerald-800" />
          </button>
        ))}
        <hr className="border-emerald-900 my-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-emerald-900/10 border border-dashed border-emerald-800 p-4 rounded-3xl">
            <h4 className="text-xs font-bold text-emerald-600 mb-3 text-center">
              انضمام لختمة
            </h4>
            <input
              value={joinInput}
              onChange={(e) => setJoinInput(e.target.value)}
              placeholder="اسم الختمة بالضبط"
              className="w-full bg-emerald-950 border border-emerald-800 rounded-xl px-3 py-2 text-sm mb-2 text-center outline-none focus:border-amber-500"
            />
            <button
              onClick={onJoin}
              className="w-full bg-amber-500 text-emerald-950 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-amber-400"
            >
              <Users className="w-4 h-4" /> انضمام
            </button>
          </div>
          <div className="bg-emerald-900/10 border border-dashed border-emerald-800 p-4 rounded-3xl">
            <h4 className="text-xs font-bold text-emerald-600 mb-3 text-center">
              إنشاء ختمة جديدة
            </h4>
            <input
              value={newKhatmahName}
              onChange={(e) => setNewKhatmahName(e.target.value)}
              placeholder="اسم المسجد / العائلة"
              className="w-full bg-emerald-950 border border-emerald-800 rounded-xl px-3 py-2 text-sm mb-2 text-center outline-none focus:border-amber-500"
            />
            <button
              onClick={onCreate}
              className="w-full bg-emerald-800 text-white py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> إنشاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
