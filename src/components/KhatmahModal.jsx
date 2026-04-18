import {
  useContext,
  useState,
  useRef,
  useMemo,
  useEffect,
  useLayoutEffect,
} from "react";
import { createPortal } from "react-dom";
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
import hafsData from "../data/Hafs.json";
import { SURAHS } from "../data/surahs";

// 👇 التعديل بتاع الـ toString() عشان ميضربش كراش وإنت بتقلب السور
const toArabic = (num) => {
  if (num === null || num === undefined) return "";
  return num.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
};

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildAdvancedRegexStr = (query) => {
  let normalizedQuery = query.trim().replace(/اللذين/g, "الذين");
  const chars = normalizedQuery.split("");

  const innerDiacritics =
    "[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06ED\\u0640]*?";

  const regexParts = chars.map((char) => {
    if (/[اأإآٱ]/.test(char)) return "(?:[اأإآٱ\\u0670]|ءا)";
    if (/[يىئ]/.test(char)) return "[يىئ]";
    if (/[هة]/.test(char)) return "[هة]";
    if (/[وؤ]/.test(char)) return "[وؤ]";
    if (/[كڪ]/.test(char)) return "[كڪ]";
    if (char === "ل") return `(?:ل${innerDiacritics})+`;
    if (char === " ") return "\\s+";

    return escapeRegex(char);
  });

  return regexParts.join(innerDiacritics);
};

const getSmartSnippet = (text, query) => {
  if (!query.trim() || text.length <= 200) return text;

  try {
    const baseRegexStr = buildAdvancedRegexStr(query);
    const regex = new RegExp(baseRegexStr, "i");
    const match = regex.exec(text);

    if (!match) return text;

    const matchStart = match.index;

    if (matchStart < 120) return text;

    let start = Math.max(0, matchStart - 120);

    const nextSpace = text.indexOf(" ", start);
    if (nextSpace !== -1 && nextSpace < matchStart) {
      start = nextSpace;
    }

    return "... " + text.slice(start).trim();
  } catch (e) {
    return text;
  }
};

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
  const [dropdownStyle, setDropdownStyle] = useState({});
  const dropdownRef = useRef(null);

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
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", out);
    return () => document.removeEventListener("pointerdown", out);
  }, []);

  useLayoutEffect(() => {
    if (isOpen && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: `${rect.top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        transform: "translateY(-100%)",
        zIndex: 99999,
      });
    }
  }, [isOpen, query]);

  useEffect(() => {
    const handleScroll = (e) => {
      if (dropdownRef.current && dropdownRef.current.contains(e.target)) return;
      if (isOpen) setIsOpen(false);
    };
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("touchmove", handleScroll, true);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("touchmove", handleScroll, true);
    };
  }, [isOpen]);

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
          className={`w-full flex items-center relative z-20 ${theme === "dark" ? "bg-[#004030] border-amber-500" : "bg-white border-amber-500"} border-2 border-t-0 rounded-b-2xl rounded-t-none px-3 shadow-xl`}
        >
          <Search size={16} className="text-amber-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="رقم.."
            className={`w-full p-3 sm:p-4 bg-transparent outline-none ${theme === "dark" ? "text-white" : "text-slate-900"} font-black text-xs sm:text-sm`}
          />
        </div>
      )}

      {isOpen &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            dir="rtl"
            className={`rounded-t-3xl rounded-b-none border-2 border-b-0 ${theme === "dark" ? "bg-[#004030] border-amber-500" : "bg-white border-amber-500"} shadow-2xl overflow-hidden`}
          >
            <div className="max-h-[280px] overflow-y-auto quran-scroll bg-inherit">
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
          </div>,
          document.body,
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
  onMultiClaim,
  onDeleteRange,
  onDeleteAll,
  getOccupiedVerses,
  openModal,
}) {
  const { fontSize, theme, highlightMode } = useContext(FontContext);
  const [showFullQuran, setShowFullQuran] = useState(false);
  const [continuousReading, setContinuousReading] = useState(false);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [verseMenu, setVerseMenu] = useState(null);
  const [qSearch, setQSearch] = useState("");
  const isMobile = window.innerWidth < 640;
  const [touchStart, setTouchStart] = useState(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSnapping, setIsSnapping] = useState(false);
  const hasNavigatedRef = useRef(false);
  const jumpToLastPageRef = useRef(false);
  const sliderRef = useRef(null);
  const [multiSurahStart, setMultiSurahStart] = useState(null);

  const surahPages = useMemo(() => {
    if (!selected) return [];
    const pages = [
      ...new Set(
        hafsData
          .filter((v) => v.sura === selected.id)
          .map((v) => v.page)
          .filter(Boolean),
      ),
    ];
    return pages.sort((a, b) => a - b);
  }, [selected]);

  useEffect(() => {
    if (selected) {
      hasNavigatedRef.current = false;
      if (!jumpToLastPageRef.current) {
        setCurrentPageIndex(0);
      }
    }
  }, [selected]);

  useEffect(() => {
    if (jumpToLastPageRef.current && surahPages.length > 0) {
      setCurrentPageIndex(surahPages.length - 1);
      jumpToLastPageRef.current = false;
    }
  }, [surahPages]);

  useEffect(() => {
    if (
      !hasNavigatedRef.current &&
      selected &&
      hafsData.length > 0 &&
      surahPages.length > 0 &&
      vRanges?.length === 1 &&
      !vRanges[0].isSaved
    ) {
      const targetAya = vRanges[0].start;
      if (targetAya >= 1) {
        const verse = hafsData.find(
          (v) => v.sura === selected.id && v.aya === targetAya,
        );
        if (verse && verse.page) {
          const pIdx = surahPages.indexOf(verse.page);
          if (pIdx !== -1) {
            setCurrentPageIndex(pIdx);
            setShowFullQuran(true);
            hasNavigatedRef.current = true;
          }
        }
      }
    }
  }, [selected, surahPages, vRanges]);

  useEffect(() => {
    if (
      showFullQuran &&
      vRanges &&
      vRanges.length > 0 &&
      vRanges[0].start > 0
    ) {
      const timer = setTimeout(() => {
        const targetEl = document.getElementById(`verse-${vRanges[0].start}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
          targetEl.style.transition = "all 0.5s ease-in-out";
          targetEl.style.backgroundColor =
            theme === "dark"
              ? "rgba(255, 185, 0, 0.25)"
              : "rgba(255, 185, 0, 0.35)";
          targetEl.style.borderRadius = "8px";
          setTimeout(() => {
            targetEl.style.backgroundColor = "transparent";
          }, 2000);
        }
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showFullQuran, currentPageIndex, theme]);

  const turnPage = (direction) => {
    if (direction === "next") {
      if (currentPageIndex < surahPages.length - 1) {
        setCurrentPageIndex((p) => p + 1);
      } else if (selected.id < 114) {
        const nextSura = SURAHS.find((s) => s.id === selected.id + 1);
        setSelected(nextSura);
        setVRanges([
          { id: null, start: 0, end: 0, isActive: false, isSaved: false },
        ]);
      }
    } else {
      if (currentPageIndex > 0) {
        setCurrentPageIndex((p) => p - 1);
      } else if (selected.id > 1) {
        const prevSura = SURAHS.find((s) => s.id === selected.id - 1);
        jumpToLastPageRef.current = true;
        setSelected(prevSura);
        setVRanges([
          { id: null, start: 0, end: 0, isActive: false, isSaved: false },
        ]);
      }
    }
  };

  const triggerSlide = (direction) => {
    if (isSnapping) return;
    const containerWidth = sliderRef.current
      ? sliderRef.current.offsetWidth
      : window.innerWidth;
    const moveDistance = containerWidth + 20;
    setIsSnapping(true);
    setSwipeOffset(direction === "next" ? moveDistance : -moveDistance);
    setTimeout(() => {
      setIsSnapping(false);
      setSwipeOffset(0);
      turnPage(direction);
    }, 150);
  };

  const handlePrevPage = () => {
    if (!isDragging && !isSnapping) triggerSlide("prev");
  };
  const handleNextPage = () => {
    if (!isDragging && !isSnapping) triggerSlide("next");
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT") return;
      if (e.key === "Escape") {
        if (verseMenu) setVerseMenu(null);
        else {
          setSelected(null);
          setQuickRegister(false);
        }
      }
      if (showFullQuran && !continuousReading && surahPages.length > 0) {
        if (e.key === "ArrowLeft") handleNextPage();
        if (e.key === "ArrowRight") handlePrevPage();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    verseMenu,
    showFullQuran,
    continuousReading,
    surahPages,
    currentPageIndex,
    selected,
  ]);

  const onTouchStart = (e) => {
    if (isSnapping) return;
    setTouchStart(e.targetTouches[0].clientX);
    setIsDragging(true);
    setSwipeOffset(0);
  };

  const onTouchMove = (e) => {
    if (!touchStart || isSnapping) return;
    let diff = e.targetTouches[0].clientX - touchStart;
    if (
      diff > 0 &&
      currentPageIndex === surahPages.length - 1 &&
      selected.id === 114
    )
      return;
    if (diff < 0 && currentPageIndex === 0 && selected.id === 1) return;
    const containerWidth = sliderRef.current
      ? sliderRef.current.offsetWidth
      : window.innerWidth;
    const maxDrag = containerWidth + 20;
    if (diff > maxDrag) diff = maxDrag;
    if (diff < -maxDrag) diff = -maxDrag;
    setSwipeOffset(diff);
  };

  const onTouchEnd = () => {
    if (isSnapping || !isDragging) return;
    setIsDragging(false);
    if (!touchStart) return;
    const containerWidth = sliderRef.current
      ? sliderRef.current.offsetWidth
      : window.innerWidth;
    const moveDistance = containerWidth + 20;
    const threshold = containerWidth * 0.1;
    setIsSnapping(true);
    if (
      swipeOffset > threshold &&
      (currentPageIndex < surahPages.length - 1 || selected.id < 114)
    ) {
      setSwipeOffset(moveDistance);
      setTimeout(() => {
        setIsSnapping(false);
        setSwipeOffset(0);
        turnPage("next");
      }, 150);
    } else if (
      swipeOffset < -threshold &&
      (currentPageIndex > 0 || selected.id > 1)
    ) {
      setSwipeOffset(-moveDistance);
      setTimeout(() => {
        setIsSnapping(false);
        setSwipeOffset(0);
        turnPage("prev");
      }, 300);
    } else {
      setSwipeOffset(0);
      setTimeout(() => setIsSnapping(false), 150);
    }
  };

  const onMouseDown = (e) =>
    onTouchStart({ targetTouches: [{ clientX: e.clientX }] });
  const onMouseMove = (e) => {
    if (isDragging) onTouchMove({ targetTouches: [{ clientX: e.clientX }] });
  };
  const onMouseUp = () => onTouchEnd();
  const onMouseLeave = () => {
    if (isDragging) onTouchEnd();
  };

  const setVerseRangeTouch = (type, aya) => {
    if (!vRanges || vRanges.length === 0) return;
    const r = [...vRanges];
    const lastIdx = r.length - 1;
    if (type === "from") {
      setMultiSurahStart({ surah_id: selected.id, aya: aya });
      r[lastIdx].start = aya;
      if (r[lastIdx].end && aya > r[lastIdx].end) r[lastIdx].end = 0;
      r[lastIdx].isActive = true;
      setVRanges(r);
      setVerseMenu(null);
    } else {
      if (multiSurahStart && multiSurahStart.surah_id !== selected.id) {
        handleMultiSurahSave(multiSurahStart, {
          surah_id: selected.id,
          aya: aya,
        });
        setMultiSurahStart(null);
        setVerseMenu(null);
        return;
      }
      r[lastIdx].end = aya;
      if (r[lastIdx].start && aya < r[lastIdx].start) r[lastIdx].start = 0;
      r[lastIdx].isActive = true;
      setVRanges(r);
      setVerseMenu(null);
      setMultiSurahStart(null);
    }
  };

  const handleMultiSurahSave = async (startObj, endObj) => {
    const startSurahIdx = SURAHS.findIndex((s) => s.id === startObj.surah_id);
    const endSurahIdx = SURAHS.findIndex((s) => s.id === endObj.surah_id);
    const minIdx = Math.min(startSurahIdx, endSurahIdx);
    const maxIdx = Math.max(startSurahIdx, endSurahIdx);
    const realStartAya =
      startSurahIdx < endSurahIdx ? startObj.aya : endObj.aya;
    const realEndAya = startSurahIdx < endSurahIdx ? endObj.aya : startObj.aya;
    const inserts = [];
    for (let i = minIdx; i <= maxIdx; i++) {
      const s = SURAHS[i];
      let vStart = 1;
      let vEnd = s.ayat;
      if (i === minIdx) vStart = realStartAya;
      if (i === maxIdx) vEnd = realEndAya;
      inserts.push({ surah_id: s.id, verse_start: vStart, verse_end: vEnd });
    }
    if (onMultiClaim) onMultiClaim(inserts);
  };

  const quickResults = useMemo(() => {
    if (!quickRegister || qSearch.trim().length < 2) return null;

    try {
      const baseRegexStr = buildAdvancedRegexStr(qSearch);
      const searchRegex = new RegExp(baseRegexStr, "i");

      const suras = SURAHS.filter(
        (s) => searchRegex.test(s.name_ar) || s.name_ar.includes(qSearch),
      );
      const cleanAyas = simpleQuran
        .filter((v) => searchRegex.test(v.text))
        .slice(0, 15);

      const ayas = cleanAyas.map((cleanAya) => {
        const hafsAya = hafsData.find(
          (h) => h.sura === cleanAya.sura && h.aya === cleanAya.aya,
        );
        return hafsAya || cleanAya;
      });

      return { suras, ayas };
    } catch (e) {
      return { suras: [], ayas: [] };
    }
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

  const highlightText = (text, highlight) => {
    if (!highlight.trim()) return text;

    try {
      const baseRegexStr = buildAdvancedRegexStr(highlight);
      const trailingDiacritics =
        "[\\u0610-\\u061A\\u064B-\\u065F\\u0670\\u06D6-\\u06DC\\u06DF-\\u06E8\\u06EA-\\u06ED\\u0640]*";
      const regex = new RegExp(`(${baseRegexStr}${trailingDiacritics})`, "g");

      const parts = text.split(regex);

      const isFull = highlightMode === "full";
      const isRow = highlightMode === "row";
      const isText = highlightMode === "text";

      return parts.map((part, idx) => {
        if (idx % 2 !== 0) {
          let highlightStyle = {};

          if (isText) {
            highlightStyle = { color: "#ffb900" };
          } else if (isFull) {
            const bgColor =
              theme === "dark"
                ? "rgba(212, 175, 55, 0.3)"
                : "rgba(255, 217, 105, 0.5)";
            highlightStyle = {
              backgroundColor: bgColor,
              borderRadius: "4px",
            };
          } else if (isRow) {
            const rowColor =
              theme === "dark"
                ? "rgba(255, 185, 0, 0.7)"
                : "rgba(255, 185, 0, 0.9)";
            highlightStyle = {
              textDecoration: "underline",
              textDecorationColor: rowColor,
              textDecorationThickness: "2px",
              textUnderlineOffset: "4px",
              textDecorationSkipInk: "auto",
            };
          }

          return (
            <span
              key={idx}
              style={highlightStyle}
              className="transition-colors duration-200"
            >
              {part}
            </span>
          );
        }
        return part;
      });
    } catch (e) {
      return text;
    }
  };

  const renderVerses = (targetPageIdx) => {
    const versesToRender = hafsData.filter((v) => {
      if (v.sura !== selected.id) return false;
      if (continuousReading || surahPages.length === 0) return true;
      return v.page === surahPages[targetPageIdx];
    });

    if (versesToRender.length === 0) {
      return (
        <div className="text-center py-10 font-black opacity-50 text-sm">
          عذراً، لا يوجد بيانات للآيات.
        </div>
      );
    }

    return versesToRender.map((v, i) => {
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
        if (isText) highlightStyle = { color: "#ffb900" };
        else if (isFull) {
          const bgColor =
            theme === "dark"
              ? "rgba(212, 175, 55, 1)"
              : "rgba(255, 217, 105, 1)";
          highlightStyle = {
            color: "black",
            padding: "0 1px",
            margin: "0 -1px",
            boxDecorationBreak: "clone",
            WebkitBoxDecorationBreak: "clone",
            backgroundImage: `linear-gradient(to bottom, transparent 6px, ${bgColor} 2px, ${bgColor} calc(100% - 0px), transparent calc(100% - 4px))`,
            backgroundClip: "padding-box",
            backgroundColor: "transparent",
          };
        } else if (isRow) {
          highlightStyle = {
            backgroundImage:
              theme === "dark"
                ? "linear-gradient(to bottom, transparent 1.24em, rgba(255, 168, 0, 0.3) 5px, rgba(255, 168, 0, 0.3) calc(100% - 0.4em), transparent calc(100% - 0.5em))"
                : "linear-gradient(to bottom, transparent 1.24em, rgba(255, 185, 0, 0.3) 5px, rgba(255, 185, 0, 0.3) calc(100% - 0.4em), transparent calc(100% - 0.5em))",
            mixBlendMode: theme === "dark" ? "lighten" : "darken",
          };
        }
      }
      return (
        <span
          id={`verse-${v.aya}`}
          key={i}
          onClick={(e) => toggleVerseMenu(v.aya, e)}
          className={`inline transition-all duration-200 cursor-pointer ${isOcc ? "text-slate-400/40 grayscale pointer-events-none" : ""}`}
          style={highlightStyle}
        >
          {v.text.trim()}
          <span
            className={`${isSel ? (isFull ? "text-emerald-950" : "text-[#ffb900]") : isOcc ? "text-slate-400/30" : "text-[#ffb900]"} opacity-100 text-[0.6em] font-sans inline-block px-[0.2em] ml-[0.2em]`}
          >
            ({toArabic(v.aya)})
          </span>
        </span>
      );
    });
  };

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
            من هنا
          </button>
          <button
            onClick={() => setVerseRangeTouch("to", verseMenu.aya)}
            className={`px-3 py-2 sm:px-4 sm:py-2 font-black rounded-xl text-[0.65rem] sm:text-sm transition-all active:scale-95 shadow-md whitespace-nowrap ${theme === "dark" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-emerald-100 hover:bg-emerald-200 text-emerald-900"}`}
          >
            إلى هنا
          </button>
        </div>
      )}

      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-4"
        onClick={() => {
          setSelected(null);
          setQuickRegister(false);
        }}
      >
        <div
          className={`w-full transition-all duration-500 ease-in-out ${showFullQuran ? "max-w-4xl h-[100dvh] lg:h-[90vh] rounded-none lg:rounded-[3.5rem]" : "max-w-xl h-fit max-h-[90vh] rounded-t-[2.5rem] lg:rounded-[3.5rem]"} overflow-y-auto quran-scroll ${theme === "dark" ? "bg-[#042f24] lg:border-2 border-emerald-800 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]" : "bg-white lg:border-2 border-slate-200 shadow-xl"} p-2 sm:p-10 text-right relative flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-1.5 bg-emerald-500/20 rounded-full mx-auto mb-2 lg:hidden shrink-0"></div>

          <div className="relative flex items-center justify-between mb-2 gap-2 px-2 min-h-[48px]">
            {selected && (
              <button
                onClick={() => setShowFullQuran(!showFullQuran)}
                className="transition-all active:scale-90 z-20 relative bg-emerald-500/10 p-2 rounded-xl text-emerald-600 hover:bg-emerald-500/20"
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
            <h2
              className={`text-2xl sm:text-3xl font-black mr-5 font-serif tracking-tighter ${theme === "dark" ? "text-[#ffb900]" : "text-emerald-700"}`}
            >
              {selected ? selected.name_ar : "البحث السريع"}
            </h2>
            <div className="flex items-center gap-3 sm:gap-4 relative z-10">
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
                className={`flex items-center gap-4 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] border-2 ${theme === "dark" ? "bg-[#004030] border-emerald-800" : "bg-slate-50 border-slate-200"} mb-2`}
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
                <div className="p-2" dir="rtl">
                  {quickResults?.ayas?.length > 0 && (
                    <div className="mb-1 sm:mb-3">
                      <div className="space-y-3 sm:space-y-4 mb-4">
                        {quickResults.ayas.map((a, i) => {
                          const snippet = getSmartSnippet(a.text, qSearch);
                          return (
                            <button
                              key={i}
                              onClick={() => {
                                const s = SURAHS.find((sr) => sr.id === a.sura);
                                if (s) openModal(s, a.aya);
                              }}
                              className={`w-full p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[1.5rem] border-2 text-right flex flex-col gap-2.5 transition-all ${theme === "dark" ? "bg-[#004030] border-emerald-800 text-white" : "bg-white border-slate-200 text-emerald-800 hover:bg-slate-50"}`}
                            >
                              <span className="font-black text-[#ffb900] bg-[#ffb900]/10 px-3 py-1 rounded-full text-[0.6rem] sm:text-xs shrink-0 w-fit">
                                سورة{" "}
                                {SURAHS.find((s) => s.id === a.sura)?.name_ar} -
                                آية {toArabic(a.aya)}
                              </span>
                              <span
                                className="opacity-90 font-serif text-[0.95rem] sm:text-lg font-bold leading-loose line-clamp-3 sm:line-clamp-4 w-full text-justify"
                                dir="rtl"
                              >
                                {highlightText(snippet, qSearch)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-[#ffb900] bg-[#ffb900]/10 px-3 py-1 rounded-full text-xs sm:text-sm">
                          {toArabic(quickResults.ayas.length)}
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
                    </div>
                  )}
                  {quickResults?.suras?.length > 0 && (
                    <div>
                      <div className="space-y-3 sm:space-y-4 mb-4">
                        {quickResults.suras.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => openModal(s)}
                            className={`p-4 sm:p-5 rounded-[1.2rem] sm:rounded-[1.5rem] border-2 font-black text-right transition-all w-full text-sm sm:text-base ${theme === "dark" ? "dark:bg-[#004030] border-emerald-800 text-white hover:bg-[#004030]/80" : "bg-white border-slate-200 text-emerald-800 hover:bg-slate-50"}`}
                          >
                            سورة - {s.name_ar}
                          </button>
                        ))}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-black text-[#ffb900] bg-[#ffb900]/10 px-3 py-1 rounded-full text-xs sm:text-sm">
                          {toArabic(quickResults.suras.length)}
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
                  <div className="flex justify-between items-center mb-2 px-2 sm:px-6">
                    <button
                      onClick={() => setContinuousReading(!continuousReading)}
                      className={`text-[0.6rem] sm:text-xs px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border-2 font-black transition-all active:scale-95 ${theme === "dark" ? "bg-emerald-800 border-emerald-700 text-emerald-100" : "bg-emerald-100 border-emerald-200 text-emerald-800 hover:bg-emerald-200"}`}
                    >
                      {continuousReading ? "قراءة متواصلة" : "عرض الصفحات"}
                    </button>
                    {!continuousReading &&
                      surahPages &&
                      surahPages.length > 0 && (
                        <div className="flex items-center gap-3" dir="ltr">
                          <button
                            onClick={handleNextPage}
                            className={`p-2 rounded-full transition-all active:scale-95 ${theme === "dark" ? "bg-emerald-900 text-emerald-400 hover:bg-emerald-800" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                          >
                            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <span
                            className={`font-black text-xs sm:text-sm px-2 ${theme === "dark" ? "text-emerald-300" : "text-emerald-700"}`}
                          >
                            صـــ{" "}
                            {surahPages[currentPageIndex]
                              ? toArabic(surahPages[currentPageIndex])
                              : ""}
                          </span>
                          <button
                            onClick={handlePrevPage}
                            className={`p-2 rounded-full transition-all active:scale-95 ${theme === "dark" ? "bg-emerald-900 text-emerald-400 hover:bg-emerald-800" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                          >
                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      )}
                  </div>

                  <div
                    ref={sliderRef}
                    className={`relative touch-pan-y w-full border-y-2 sm:border-y-4 rounded-[1.5rem] sm:rounded-[2.5rem] overflow-hidden ${theme === "dark" ? "border-emerald-900/50 bg-[#042f24]" : "border-amber-100 bg-white"}`}
                    onTouchStart={!continuousReading ? onTouchStart : undefined}
                    onTouchMove={!continuousReading ? onTouchMove : undefined}
                    onTouchEnd={!continuousReading ? onTouchEnd : undefined}
                    onTouchCancel={!continuousReading ? onTouchEnd : undefined}
                    onMouseDown={!continuousReading ? onMouseDown : undefined}
                    onMouseMove={!continuousReading ? onMouseMove : undefined}
                    onMouseUp={!continuousReading ? onMouseUp : undefined}
                    onMouseLeave={!continuousReading ? onMouseLeave : undefined}
                    dir="rtl"
                  >
                    <div
                      className="relative w-full"
                      style={{
                        transform: `translateX(${swipeOffset}px)`,
                        transition: isSnapping
                          ? "transform 0.15s cubic-bezier(0.25, 1, 0.5, 1)"
                          : "none",
                      }}
                    >
                      {/* 👇 أضفنا style={{ containerType: "inline-size" }} للصفحة السابقة 👇 */}
                      {!continuousReading &&
                        (currentPageIndex > 0 ? (
                          <div
                            className="absolute top-0 w-full"
                            style={{ left: "calc(100% + 20px)" }}
                          >
                            <div
                              className="w-full flex-shrink-0 min-w-full py-3 px-2 sm:px-6"
                              style={{ containerType: "inline-size" }}
                            >
                              <div
                                className={`text-justify font-['Amiri_Quran'] ${theme === "dark" ? "text-emerald-50" : "text-slate-900"} transition-all`}
                                style={{
                                  lineHeight: "2.1",
                                  fontSize: `${2.7 + fontSize * 0.65}cqi`,
                                  textShadow: "0px 0px 0.3px currentColor",
                                }}
                              >
                                {renderVerses(currentPageIndex - 1)}
                              </div>
                            </div>
                          </div>
                        ) : selected.id > 1 ? (
                          <div
                            className="absolute top-0 w-full h-full flex flex-col items-center justify-center opacity-40 transition-all"
                            style={{ left: "calc(100% + 20px)" }}
                          >
                            <BookOpen
                              size={48}
                              className={
                                theme === "dark"
                                  ? "text-[#ffb900] mb-4"
                                  : "text-emerald-600 mb-4"
                              }
                            />
                            <h3
                              className={`text-2xl font-black font-serif ${theme === "dark" ? "text-[#ffb900]" : "text-emerald-800"}`}
                            >
                              سورة{" "}
                              {
                                SURAHS.find((s) => s.id === selected.id - 1)
                                  ?.name_ar
                              }
                            </h3>
                          </div>
                        ) : null)}

                      {/* الصفحة الحالية */}
                      <div className="relative z-10 w-full">
                        <div
                          className="w-full py-3 px-2 sm:px-6"
                          style={{ containerType: "inline-size" }}
                        >
                          <div
                            className={`text-justify font-['Amiri_Quran'] ${theme === "dark" ? "text-emerald-50" : "text-slate-900"} transition-all`}
                            style={{
                              lineHeight: "2.1",
                              fontSize: `${2.7 + fontSize * 0.65}cqi`,
                              textShadow: "0px 0px 0.3px currentColor",
                            }}
                          >
                            {renderVerses(currentPageIndex)}
                          </div>
                        </div>
                      </div>

                      {/* 👇 أضفنا style={{ containerType: "inline-size" }} للصفحة التالية 👇 */}
                      {!continuousReading &&
                        (currentPageIndex < surahPages.length - 1 ? (
                          <div
                            className="absolute top-0 w-full"
                            style={{ right: "calc(100% + 20px)" }}
                          >
                            <div
                              className="w-full flex-shrink-0 min-w-full py-3 px-2 sm:px-6"
                              style={{ containerType: "inline-size" }}
                            >
                              <div
                                className={`text-justify font-['Amiri_Quran'] ${theme === "dark" ? "text-emerald-50" : "text-slate-900"} transition-all`}
                                style={{
                                  lineHeight: "2.1",
                                  fontSize: `${2.7 + fontSize * 0.65}cqi`,
                                  textShadow: "0px 0px 0.3px currentColor",
                                }}
                              >
                                {renderVerses(currentPageIndex + 1)}
                              </div>
                            </div>
                          </div>
                        ) : selected.id < 114 ? (
                          <div
                            className="absolute top-0 w-full h-full flex flex-col items-center justify-center opacity-40 transition-all"
                            style={{ right: "calc(100% + 20px)" }}
                          >
                            <BookOpen
                              size={48}
                              className={
                                theme === "dark"
                                  ? "text-[#ffb900] mb-4"
                                  : "text-emerald-600 mb-4"
                              }
                            />
                            <h3
                              className={`text-2xl font-black font-serif ${theme === "dark" ? "text-[#ffb900]" : "text-emerald-800"}`}
                            >
                              سورة{" "}
                              {
                                SURAHS.find((s) => s.id === selected.id + 1)
                                  ?.name_ar
                              }
                            </h3>
                          </div>
                        ) : null)}
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
                    <div className="flex-1 relative">
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
                        const newRanges = vRanges.filter((_, i) => i !== index);
                        if (newRanges.length === 0) {
                          newRanges.push({
                            id: null,
                            start: 0,
                            end: 0,
                            isActive: false,
                            isSaved: false,
                          });
                        }
                        setVRanges(newRanges);
                      }}
                      className={`p-1.5 sm:p-2.5 shrink-0 transition-all active:scale-90 ${theme === "dark" ? "text-red-500" : "text-red-500"}`}
                    >
                      <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 sm:gap-4 pt-5 sm:pt-10">
                <button
                  onClick={onClaim}
                  className={`flex-1 font-black py-5 sm:py-7 rounded-[2rem] sm:rounded-[3rem] shadow-xl active:scale-95 transition-all text-lg sm:text-2xl flex items-center justify-center gap-2 sm:gap-3 ${theme === "dark" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-emerald-500 hover:bg-emerald-400 text-white"}`}
                >
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8" /> تأكيد الورد
                </button>
                <button
                  onClick={onDeleteAll}
                  className={`p-1.5 sm:p-2.5 shrink-0 transition-all active:scale-90 ${theme === "dark" ? "text-red-500" : "text-red-500"}`}
                >
                  <Trash2 className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
