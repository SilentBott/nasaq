import { useContext, useState, useRef, useMemo, useEffect } from "react";
import { FontContext } from "../FontContext";
import {
  X,
  Trash2,
  BookOpen,
  Book,
  Search,
  Loader2,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import simpleQuran from "../data/quran-simple-clean.json";
import { SURAHS } from "../data/surahs";

const VerseSelect = ({
  value,
  onChange,
  disabled,
  surahId,
  ayatCount,
  occupied,
  label,
  theme,
  startLimit,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);

  const filtered = useMemo(
    () =>
      Array.from({ length: ayatCount || 0 }, (_, i) => i + 1).filter((n) => {
        const txt =
          simpleQuran.find((v) => v.sura === surahId && v.aya === n)?.text ||
          "";
        return (
          (n.toString().includes(query) || txt.includes(query)) &&
          (startLimit ? n >= startLimit : true)
        );
      }),
    [surahId, ayatCount, query, startLimit],
  );

  useEffect(() => {
    const out = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", out);
    return () => document.removeEventListener("mousedown", out);
  }, []);

  return (
    <div className="relative flex-1 overflow-visible w-full" ref={ref}>
      {!isOpen ? (
        <button
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className={`w-full rounded-2xl p-3 sm:p-4 text-center border font-black transition-all text-xs sm:text-base ${theme === "dark" ? "bg-[#004030] border-emerald-800 text-emerald-300" : "bg-white border-slate-200 text-slate-700 shadow-sm hover:bg-slate-50"}`}
        >
          {value === 0
            ? label
            : value === 1
              ? "أول آية"
              : value === ayatCount
                ? `آخـر (${value})`
                : value}
        </button>
      ) : (
        <div
          className={`w-full flex items-center ${theme === "dark" ? "bg-[#004030]" : "bg-white"} border-2 border-amber-500 rounded-2xl px-3 shadow-xl`}
        >
          <Search size={16} className="text-amber-500" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="رقم.."
            className={`w-full p-3 sm:p-4 bg-transparent outline-none ${theme === "dark" ? "text-white" : "text-slate-900"} font-black text-xs sm:text-sm`}
          />
        </div>
      )}
      {isOpen && (
        <div
          className={`absolute bottom-full mb-3 left-0 right-0 z-[1100] rounded-3xl border-2 ${theme === "dark" ? "bg-[#004030] border-emerald-800" : "bg-white border-slate-200"} shadow-2xl overflow-hidden opacity-100`}
        >
          <div className="max-h-[400px] overflow-y-auto quran-scroll bg-inherit">
            {(filtered || []).map((n) => (
              <button
                key={n}
                disabled={occupied.has(n)}
                onClick={() => {
                  onChange(n);
                  setIsOpen(false);
                  setQuery("");
                }}
                className={`w-full p-4 sm:p-5 text-right border-b ${theme === "dark" ? "border-emerald-800 hover:bg-[#ffb900]/15" : "border-slate-100 hover:bg-slate-50"} last:border-0 flex justify-between items-center gap-3 ${occupied.has(n) ? "opacity-30 grayscale" : ""}`}
              >
                <span className="font-black text-[#ffb900] text-[0.65rem] sm:text-xs shrink-0">
                  آية {n}
                </span>
                <span
                  className={`truncate opacity-100 font-serif text-xs sm:text-sm font-bold ${theme === "dark" ? "text-emerald-50" : "text-slate-700"}`}
                >
                  {simpleQuran
                    .find((v) => v.sura === surahId && v.aya === n)
                    ?.text.split(" ")
                    .slice(0, 3)
                    .join(" ")}
                  ..
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function KhatmahModal({
  selected,
  setSelected,
  quickRegister,
  setQuickRegister,
  logs,
  userName,
  vRanges,
  setVRanges,
  loading,
  onClaim,
  onDeleteRange,
  onDeleteAll,
  getOccupiedVerses,
  openModal,
}) {
  const { fontSize, theme, quranData, dataLoading, highlightMode } =
    useContext(FontContext);
  const [showFullQuran, setShowFullQuran] = useState(false);
  const [continuousReading, setContinuousReading] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [verseMenu, setVerseMenu] = useState(null);
  const [qSearch, setQSearch] = useState("");
  const isMobile = window.innerWidth < 640;

  const surahPages = useMemo(() => {
    if (!selected || dataLoading) return [];
    const pages = [
      ...new Set(
        quranData?.filter((v) => v.sura === selected.id).map((v) => v.page),
      ),
    ];
    return pages.sort((a, b) => a - b);
  }, [selected, quranData, dataLoading]);

  const quickResults = useMemo(() => {
    if (!quickRegister || qSearch.length < 2) return null;
    const suras = SURAHS.filter((s) => s.name_ar.includes(qSearch));
    const ayas = simpleQuran
      .filter((v) => v.text.includes(qSearch))
      .slice(0, 15);
    return { suras, ayas };
  }, [qSearch, quickRegister]);

  useEffect(() => {
    if (selected) setVerseMenu(null);
  }, [selected]);
  useEffect(() => {
    const handleScroll = () => {
      if (verseMenu) setVerseMenu(null);
    };
    window.addEventListener("wheel", handleScroll);
    window.addEventListener("touchmove", handleScroll);
    return () => {
      window.removeEventListener("wheel", handleScroll);
      window.removeEventListener("touchmove", handleScroll);
    };
  }, [verseMenu]);

  if (!selected && !quickRegister) return null;
  const occupied = selected ? getOccupiedVerses(selected.id) : new Set();

  const toggleVerseMenu = (aya, e) => {
    if (occupied.has(aya)) return;
    if (verseMenu?.aya === aya) setVerseMenu(null);
    else setVerseMenu({ aya, x: e.clientX, y: e.clientY });
  };

  const setVerseRangeTouch = (type, aya) => {
    if (!vRanges || vRanges.length === 0) return;
    const r = [...vRanges];
    const lastIdx = r.length - 1;
    if (type === "from") {
      r[lastIdx].start = aya;
      if (r[lastIdx].end && aya > r[lastIdx].end) r[lastIdx].end = 0;
      r[lastIdx].isActive = true;
    } else {
      r[lastIdx].end = aya;
      if (r[lastIdx].start && aya < r[lastIdx].start) r[lastIdx].start = 0;
      r[lastIdx].isActive = true;
    }
    setVRanges(r);
    setVerseMenu(null);
  };

  if (dataLoading && selected)
    return (
      <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center">
        <Loader2 className="animate-spin text-[#ffb900] w-12 h-12" />
      </div>
    );

  return (
    <>
      <style>{` .quran-scroll::-webkit-scrollbar { width: 3px; } .quran-scroll::-webkit-scrollbar-track { background: transparent; margin: 30px 0; } .quran-scroll::-webkit-scrollbar-thumb { background: #ffb900; border-radius: 10px; } `}</style>

      {verseMenu && (
        <div
          className={`fixed z-[9999] backdrop-blur-md border-2 border-[#ffb900] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] p-2 sm:p-3 flex gap-2 sm:gap-3 animate-in zoom-in duration-200 ${theme === "dark" ? "bg-[#022a1d]/95" : "bg-white/95"}`}
          style={{
            top: `${Math.min(verseMenu.y - 60, window.innerHeight - 80)}px`,
            left: `${Math.max(10, Math.min(verseMenu.x - 80, window.innerWidth - 180))}px`,
          }}
        >
          <button
            onClick={() => setVerseRangeTouch("from", verseMenu.aya)}
            className={`px-3 py-2 sm:px-4 sm:py-2 font-black rounded-xl text-[0.65rem] sm:text-sm transition-all active:scale-95 shadow-md whitespace-nowrap ${theme === "dark" ? "bg-[#ffb900] hover:bg-amber-400 text-[#042f24]" : "bg-amber-100 hover:bg-amber-200 text-amber-900"}`}
          >
            بدء (من)
          </button>
          <button
            onClick={() => setVerseRangeTouch("to", verseMenu.aya)}
            className={`px-3 py-2 sm:px-4 sm:py-2 font-black rounded-xl text-[0.65rem] sm:text-sm transition-all active:scale-95 shadow-md whitespace-nowrap ${theme === "dark" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900"}`}
          >
            انتهاء (إلى)
          </button>
        </div>
      )}

      {/* //! التعديل هنا: استخدام lg بدل sm للتحويل لـ Popup */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4"
        onClick={() => {
          setSelected(null);
          setQuickRegister(false);
        }}
      >
        <div
          className={`w-full transition-all duration-500 ease-in-out 
            ${
              showFullQuran
                ? "max-w-4xl h-[100dvh] lg:h-[90vh] rounded-none lg:rounded-[3.5rem]"
                : "max-w-xl h-fit max-h-[90vh] rounded-t-[2.5rem] lg:rounded-[3.5rem]"
            } overflow-y-auto quran-scroll 
            ${
              theme === "dark"
                ? "bg-[#042f24] lg:border-2 border-emerald-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                : "bg-white lg:border-2 border-slate-200 shadow-xl"
            } p-4 sm:p-10 text-right relative flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* //! إخفاء الشريط العلوي في اللاب توب فقط */}
          <div className="w-12 h-1.5 bg-emerald-500/20 rounded-full mx-auto mb-6 lg:hidden shrink-0"></div>

          <div className="flex justify-between items-center mb-8 px-2">
            <h2
              className={`text-2xl sm:text-3xl font-black font-serif tracking-tighter ${theme === "dark" ? "text-[#ffb900]" : "text-emerald-700"}`}
            >
              {selected ? selected.name_ar : "البحث السريع"}
            </h2>
            <div className="flex items-center gap-3 sm:gap-4">
              {selected && (
                <button
                  onClick={() => setShowFullQuran(!showFullQuran)}
                  className="transition-all active:scale-90"
                >
                  {showFullQuran ? (
                    <Book
                      size={28}
                      className={`sm:w-8 sm:h-8 ${theme === "dark" ? "text-emerald-400" : "text-emerald-900"}`}
                    />
                  ) : (
                    <BookOpen
                      size={28}
                      className="sm:w-8 sm:h-8 text-[#ffb900]"
                    />
                  )}
                </button>
              )}
              <button
                onClick={() => {
                  setSelected(null);
                  setQuickRegister(false);
                }}
                className={`p-2 sm:p-2.5 rounded-full transition-all ${theme === "dark" ? "bg-emerald-900/40 text-emerald-300 hover:bg-red-500/20" : "bg-slate-100 text-slate-500 hover:bg-red-50"}`}
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {quickRegister && !selected && (
            <div className="flex flex-col-reverse px-2">
              <div
                className={`flex items-center gap-4 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border-2 mt-6 ${theme === "dark" ? "bg-[#004030] border-emerald-800" : "bg-slate-50 border-slate-200"}`}
              >
                <Search
                  className={`${theme === "dark" ? "text-slate-400" : "text-emerald-500"} w-5 h-5 sm:w-6 sm:h-6`}
                />
                <input
                  autoFocus
                  placeholder="بحث (مثال: البقرة، يوسف، رحمن)..."
                  className={`bg-transparent w-full outline-none font-black font-serif text-xl sm:text-2xl ${theme === "dark" ? "text-white" : "text-emerald-900"} placeholder:opacity-40`}
                  onChange={(e) => setQSearch(e.target.value)}
                />
              </div>
              {quickResults && (
                <div className="space-y-6 sm:space-y-8 p-2 mt-4" dir="rtl">
                  {quickResults.suras?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <span className="font-black text-[#ffb900] bg-[#ffb900]/10 px-3 py-1 rounded-full text-xs sm:text-sm">
                          {quickResults.suras.length}
                        </span>
                        <span
                          className={`font-black text-sm sm:text-base ${theme === "dark" ? "text-emerald-400" : "text-emerald-700"}`}
                        >
                          سورة
                        </span>
                        <div
                          className={`flex-1 h-px ${theme === "dark" ? "bg-emerald-800/50" : "bg-slate-200"}`}
                        ></div>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        {quickResults.suras.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => openModal(s)}
                            className={`p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 font-black text-right transition-all w-full text-sm sm:text-base ${theme === "dark" ? "dark:bg-[#004030] border-emerald-800 text-white hover:bg-[#004030]/80" : "bg-white border-slate-200 text-emerald-800 hover:bg-slate-50"}`}
                          >
                            سورة - {s.name_ar}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {quickResults.ayas?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <span className="font-black text-[#ffb900] bg-[#ffb900]/10 px-3 py-1 rounded-full text-xs sm:text-sm">
                          {quickResults.ayas.length}
                        </span>
                        <span
                          className={`font-black text-sm sm:text-base ${theme === "dark" ? "text-emerald-400" : "text-emerald-700"}`}
                        >
                          آيات
                        </span>
                        <div
                          className={`flex-1 h-px ${theme === "dark" ? "bg-emerald-800/50" : "bg-slate-200"}`}
                        ></div>
                      </div>
                      <div className="space-y-3 sm:space-y-4">
                        {quickResults.ayas.map((a, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              const s = SURAHS.find((sr) => sr.id === a.sura);
                              if (s) openModal(s, a.aya);
                            }}
                            className={`w-full p-5 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border-2 text-right flex justify-between items-center transition-all ${theme === "dark" ? "bg-[#004030] border-emerald-800 text-white" : "bg-white border-slate-200 text-emerald-800 hover:bg-slate-50"}`}
                          >
                            <span className="font-black text-[#ffb900] bg-[#ffb900]/10 px-3 py-1 rounded-full text-[0.6rem] sm:text-xs shrink-0">
                              آية -{" "}
                              {SURAHS.find((s) => s.id === a.sura)?.name_ar} :{" "}
                              {a.aya}
                            </span>
                            <span className="truncate opacity-90 font-serif text-lg sm:text-xl font-bold ml-2">
                              {a.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selected && (
            <>
              {showFullQuran && (
                <div className="mb-8 w-full animate-in fade-in duration-500">
                  <div className="flex justify-between items-center mb-6 px-2 sm:px-6">
                    <button
                      onClick={() => setContinuousReading(!continuousReading)}
                      className={`text-[0.6rem] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 font-black transition-all active:scale-95 ${theme === "dark" ? "bg-emerald-800 border-emerald-700 text-emerald-100" : "bg-emerald-100 border-emerald-200 text-emerald-800 hover:bg-emerald-200"}`}
                    >
                      {continuousReading ? "عرض الصفحات" : "قراءة متواصلة"}
                    </button>
                    {!continuousReading && (
                      <div className="flex items-center gap-3 sm:gap-6">
                        <button
                          onClick={() =>
                            setCurrentPageIndex((p) => Math.max(0, p - 1))
                          }
                          className={`p-2 sm:p-3 rounded-xl transition-all active:scale-95 ${theme === "dark" ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                        >
                          <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                        <span
                          className={`text-xs sm:text-sm font-black opacity-80 ${theme === "dark" ? "text-emerald-50" : "text-slate-700"}`}
                        >
                          صـ {surahPages[currentPageIndex]}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPageIndex((p) =>
                              Math.min(surahPages.length - 1, p + 1),
                            )
                          }
                          className={`p-2 sm:p-3 rounded-xl transition-all active:scale-95 ${theme === "dark" ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                        >
                          <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div
                    className={`w-full py-10 px-2 sm:px-6 ${theme === "dark" ? "bg-[#004030]/40 border-emerald-900/50" : "bg-amber-50/50 border-amber-100 shadow-sm"} border-y-2 sm:border-y-4 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden`}
                  >
                    <div
                      style={{ containerType: "inline-size" }}
                      className="w-full"
                    >
                      <div
                        className={`text-justify font-['Amiri_Quran'] ${theme === "dark" ? "text-emerald-50" : "text-slate-900"} transition-all`}
                        style={{
                          lineHeight: "2.1",
                          fontSize: `${2.47 + fontSize * 0.66}cqi`,
                          textShadow: "0px 0px 0.3px currentColor",
                        }}
                        dir="rtl"
                      >
                        {quranData
                          ?.filter(
                            (v) =>
                              v.sura === selected.id &&
                              (continuousReading
                                ? true
                                : v.page === surahPages[currentPageIndex]),
                          )
                          .map((v, i) => {
                            const isSel = vRanges?.some(
                              (r) =>
                                r.isActive &&
                                !r.isSaved &&
                                v.aya >= r.start &&
                                (r.end ? v.aya <= r.end : v.aya === r.start),
                            );
                            const isOcc = occupied.has(v.aya);

                            const isFull = highlightMode === "full";
                            const isRow = highlightMode === "row";
                            const isText = highlightMode === "text";

                            let highlightStyle = {};
                            if (isSel) {
                              if (isText) {
                                highlightStyle = { color: "#ffb900" };
                              } else if (isRow) {
                                highlightStyle = {
                                  backgroundColor:
                                    theme === "dark" ? "#78350f" : "#fef08a",
                                  padding: "0",
                                };
                              } else if (isFull) {
                                highlightStyle = {
                                  backgroundColor: "#ffb900",
                                  color: "#022a1d",
                                  padding: "0.15em 0.1em",
                                  WebkitBoxDecorationBreak: "clone",
                                  boxDecorationBreak: "clone",
                                  borderRadius: "4px",
                                };
                              }
                            }

                            return (
                              <span
                                key={i}
                                onClick={(e) => toggleVerseMenu(v.aya, e)}
                                className={`inline transition-all duration-200 cursor-pointer ${isOcc ? "text-slate-400/40 grayscale pointer-events-none" : ""}`}
                                style={highlightStyle}
                              >
                                {v.text}
                                <span
                                  className={`${isSel ? (isFull ? "text-emerald-800" : "text-[#ffb900]") : isOcc ? "text-slate-400/30" : "text-[#ffb900]"} opacity-100 text-[0.65em] font-sans inline-block px-[0.2em] ml-[0.2em]`}
                                >
                                  ({v.aya})
                                </span>
                              </span>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 sm:space-y-6 mb-8 px-1 sm:px-2 mt-6 w-full">
                {(vRanges || []).map((range, index) => (
                  <div
                    key={index}
                    className="flex flex-row items-center gap-1 sm:gap-2 w-full"
                  >
                    <div className="w-20 sm:w-28 shrink-0">
                      <VerseSelect
                        value={range.start}
                        onChange={(v) => {
                          const r = [...vRanges];
                          r[index].start = v;
                          r[index].isActive = true;
                          setVRanges(r);
                        }}
                        surahId={selected?.id}
                        ayatCount={selected?.ayat}
                        occupied={occupied}
                        label="مِن"
                        theme={theme}
                      />
                    </div>
                    <span className="text-slate-300 font-black px-0.5 sm:px-1 shrink-0">
                      :
                    </span>

                    <div className="flex-1 relative flex flex-col items-center">
                      <VerseSelect
                        value={range.end}
                        onChange={(v) => {
                          const r = [...vRanges];
                          r[index].end = v;
                          r[index].isActive = true;
                          if (
                            index === vRanges.length - 1 &&
                            v < (selected?.ayat || 0)
                          ) {
                            let n = v + 1;
                            while (occupied.has(n)) n++;
                            if (n <= (selected?.ayat || 0))
                              r.push({
                                id: null,
                                start: n,
                                end: 0,
                                isActive: false,
                                isSaved: false,
                              });
                          }
                          setVRanges(r);
                        }}
                        surahId={selected?.id}
                        ayatCount={selected?.ayat}
                        occupied={occupied}
                        label="إلي"
                        theme={theme}
                        startLimit={range.start}
                      />
                      {index === vRanges.length - 1 && (
                        <button
                          onClick={() => {
                            const r = [...vRanges];
                            r[index].end = selected?.ayat;
                            r[index].isActive = true;
                            setVRanges(r);
                          }}
                          className={`absolute top-full mt-2 sm:mt-3 text-xs sm:text-base font-black underline text-center w-full px-2 active:scale-95 transition-transform ${theme === "dark" ? "text-emerald-300" : "text-emerald-700"}`}
                        >
                          إلى آخر السورة
                        </button>
                      )}
                    </div>

                    <span className="text-slate-300 font-black px-0.5 sm:px-1 shrink-0">
                      =
                    </span>
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 ${theme === "dark" ? "bg-[#ffb900]/10 border-[#ffb900]/20" : "bg-amber-50 border-amber-200"} border rounded-[0.8rem] sm:rounded-2xl flex items-center justify-center shadow-inner mx-0.5 sm:mx-1`}
                    >
                      <span className="text-[#ffb900] font-black text-xs sm:text-sm">
                        {range.end ? range.end - range.start + 1 : 0}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (range.isSaved) onDeleteRange(range.id);
                        setVRanges(vRanges.filter((_, i) => i !== index));
                      }}
                      className={`p-1.5 sm:p-2.5 shrink-0 transition-all active:scale-90 ${theme === "dark" ? "text-red-500" : "text-red-500"}`}
                    >
                      <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 sm:gap-4 pt-8 sm:pt-10">
                <button
                  onClick={onClaim}
                  className={`flex-1 font-black py-5 sm:py-7 rounded-[2rem] sm:rounded-[3rem] shadow-xl active:scale-95 transition-all text-lg sm:text-2xl flex items-center justify-center gap-2 sm:gap-3 ${theme === "dark" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-emerald-500 hover:bg-emerald-400 text-white"}`}
                >
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" /> تأكيد الورد
                </button>
                <button
                  onClick={onDeleteAll}
                  className={`p-5 sm:p-6 rounded-[1.8rem] sm:rounded-[2.5rem] border-2 transition-all active:scale-90 ${theme === "dark" ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-red-50 border-red-200 text-red-600"}`}
                >
                  <Trash2 className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
