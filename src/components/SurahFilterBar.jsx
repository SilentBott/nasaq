export default function SurahFilterBar({
  theme,
  filter,
  setFilter,
  onQuickRegister,
}) {
  const filters = [
    { id: "all", label: "كلّ السور" },
    { id: "mine", label: "لم ننهها" },
    { id: "remaining", label: "باقي السور" },
    { id: "completed", label: "أُنهت" },
  ];

  return (
    <div className="flex flex-row justify-between items-center mb-5 mt-3 px-2">
      <div className="flex flex-row flex-wrap gap-2 sm:gap-3 max-w-[80%]">
        {filters.map((t) => (
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
        onClick={onQuickRegister}
        className={`font-black border-b-[3px] sm:border-b-4 pb-1 active:scale-95 transition-all text-xl sm:text-2xl whitespace-nowrap ${theme === "dark" ? "text-emerald-400 border-emerald-400" : "text-emerald-700 border-emerald-700"}`}
      >
        تسجيل سريع
      </button>
    </div>
  );
}
