import { Home, BookText } from "lucide-react";

export default function AboutView({ theme, onClose }) {
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
