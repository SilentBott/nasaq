import {
  Home,
  BookText,
  Users,
  WifiOff,
  Sparkles,
  SearchCheck,
  Flame,
  ShieldCheck,
} from "lucide-react";

export default function AboutView({ theme, onClose }) {
  const isDark = theme === "dark";

  const features = [
    {
      icon: <SearchCheck size={20} />,
      title: "محرك بحث متطور (رسم عثماني)",
      desc: "ابحث بكلمات بسيطة، وسيقوم محرك نَسَق الذكي بالعثور عليها متجاهلاً التشكيل والألف الخنجرية، مع تظليل دقيق للنتائج.",
    },
    {
      icon: <Sparkles size={20} />,
      title: "رادار الختمات والمزامنة اللحظية",
      desc: "راقب المجموعات التي توشك على الختم عبر (الرادار)، وشاهد تقدم مجموعتك يتحدث لحظياً أمام عينيك مع كل قراءة للأعضاء.",
    },
    {
      icon: <WifiOff size={20} />,
      title: "قراءة وتسجيل بلا إنترنت",
      desc: "اقرأ في أي مكان! سيقوم النظام بحفظ وردك محلياً بدقة، ومزامنته تلقائياً مع خوادمنا فور عودة الاتصال بالإنترنت.",
    },
    {
      icon: <Flame size={20} />,
      title: "إحصائيات دقيقة وسلسلة الالتزام",
      desc: "نظام حسابي معقد يمنع تكرار الآيات لضمان دقة نسبة الإنجاز، مع نظام (الشعلة) الذي يحفزك على القراءة اليومية دون انقطاع.",
    },
    {
      icon: <Users size={20} />,
      title: "ختمات مخصصة ودخول فوري",
      desc: "أنشئ ختمتك الشخصية، أو شارك الأجر في مجموعة عامة. كل هذا بدون حسابات معقدة، فقط اكتب اسمك وابدأ رحلتك.",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[500] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <style>{`.quran-scroll::-webkit-scrollbar { width: 4px; } .quran-scroll::-webkit-scrollbar-track { background: transparent; margin: 48px 0; } .quran-scroll::-webkit-scrollbar-thumb { background: #ffb900; border-radius: 10px; }`}</style>

      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg h-fit max-h-[85vh] overflow-y-auto quran-scroll p-6 sm:p-10 rounded-[2.5rem] border text-right shadow-2xl relative z-10 ${
          isDark
            ? "bg-gradient-to-b from-[#064e3b] to-[#022a1d] border-emerald-700/40 text-emerald-50"
            : "bg-gradient-to-b from-emerald-50 to-white border-emerald-200 text-slate-800"
        }`}
      >
        {isDark && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
        )}

        <button
          onClick={onClose}
          className={`absolute top-6 left-6 p-3 rounded-full active:scale-95 transition-all z-20 ${
            isDark
              ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
              : "bg-red-50 text-red-500 hover:bg-red-100"
          }`}
        >
          <Home size={20} />
        </button>

        <div className="flex flex-col items-center gap-3 mb-8 text-center relative z-10 pt-4">
          <div
            className={`p-4 rounded-full border shadow-inner ${
              isDark
                ? "bg-[#ffb900]/10 border-[#ffb900]/20"
                : "bg-emerald-100 border-emerald-200"
            }`}
          >
            <BookText
              size={40}
              className={isDark ? "text-[#ffb900]" : "text-emerald-700"}
            />
          </div>
          <h2
            className={`text-4xl font-black font-serif tracking-tighter ${
              isDark ? "text-[#ffb900]" : "text-emerald-800"
            }`}
          >
            نَسَق
          </h2>
          <p
            className={`text-sm font-bold mt-2 ${isDark ? "text-emerald-200/70" : "text-emerald-700/70"}`}
          >
            رفيقك الذكي في رحلة القرآن
          </p>
        </div>

        <div className="space-y-3 text-sm sm:text-base font-bold relative z-10">
          <div
            className={`p-5 rounded-3xl border shadow-sm mb-6 ${
              isDark
                ? "bg-emerald-900/30 border-emerald-500/10"
                : "bg-white border-emerald-100"
            }`}
          >
            <p className="leading-loose">
              <span
                className={`text-lg font-black ml-1 ${
                  isDark ? "text-[#ffb900]" : "text-emerald-700"
                }`}
              >
                «نَسَق»
              </span>
              هي منصة ذكية وحديثة صُممت لتنظيم خِتمتك القرآنية، وتيسير متابعة
              وردك اليومي بأسلوب تقني يضمن دقة الإنجاز وسلاسة الاستخدام.
            </p>
          </div>

          <h3
            className={`text-lg font-black mb-4 px-2 ${isDark ? "text-emerald-300" : "text-emerald-700"}`}
          >
            دليلك لاستخدام المنصة:
          </h3>

          <div className="space-y-3">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border shadow-sm flex items-start gap-3 transition-all hover:scale-[1.01] ${
                  isDark
                    ? "bg-emerald-900/20 border-emerald-500/10 hover:bg-emerald-900/40"
                    : "bg-white border-emerald-100 hover:bg-emerald-50"
                }`}
              >
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    isDark
                      ? "bg-[#ffb900]/10 text-[#ffb900]"
                      : "bg-emerald-100 text-emerald-600"
                  }`}
                >
                  {feature.icon}
                </div>
                <div>
                  <h4
                    className={`font-black text-sm sm:text-base mb-1 ${isDark ? "text-emerald-100" : "text-emerald-900"}`}
                  >
                    {feature.title}
                  </h4>
                  <p
                    className={`text-[0.7rem] sm:text-sm leading-relaxed ${isDark ? "text-emerald-100/70" : "text-slate-600"}`}
                  >
                    {feature.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer
          className={`mt-10 pt-6 border-t text-center space-y-4 relative z-10 ${
            isDark ? "border-emerald-700/30" : "border-emerald-200"
          }`}
        >
          <div className="space-y-1">
            <p
              className={`text-[0.65rem] sm:text-xs opacity-70 font-black ${isDark ? "text-emerald-100" : "text-slate-500"}`}
            >
              تم استخراج الآيات وبيانات المصحف الشريف بالاعتماد على مشروع
            </p>
            <a
              href="http://tanzil.net/"
              target="_blank"
              rel="noreferrer"
              className={`inline-block text-[0.7rem] sm:text-xs font-black uppercase tracking-wider transition-all hover:-translate-y-0.5 ${isDark ? "text-[#ffb900] hover:text-amber-300" : "text-emerald-700 hover:text-emerald-500"}`}
            >
              Tanzil - Quran Navigator
            </a>
          </div>
          <div className="space-y-1">
            <p
              className={`text-[0.65rem] sm:text-xs opacity-70 font-black ${isDark ? "text-emerald-100" : "text-slate-500"}`}
            >
              الأساس الرسومي للأيقونة من
            </p>
            <a
              href="https://www.vecteezy.com/"
              target="_blank"
              rel="noreferrer"
              className={`inline-block text-[0.7rem] sm:text-xs font-black transition-all hover:-translate-y-0.5 ${isDark ? "text-[#ffb900] hover:text-amber-300" : "text-emerald-700 hover:text-emerald-500"}`}
            >
              Vecteezy.com
            </a>
          </div>
          <p
            className={`text-[0.6rem] sm:text-[0.65rem] opacity-50 pt-2 font-black uppercase tracking-widest ${isDark ? "text-emerald-100" : "text-slate-400"}`}
          >
            نَسَق - لخدمة كتاب الله © 2026
          </p>
        </footer>
      </div>
    </div>
  );
}
