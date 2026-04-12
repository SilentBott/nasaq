import React from "react";

export default function Auth({
  loginNameInput,
  setLoginNameInput,
  onLogin,
  theme,
}) {
  const isDark = theme === "dark";

  return (
    <div
      className={`w-full max-w-md p-10 rounded-[3rem] border-2 shadow-2xl animate-in zoom-in duration-500 relative z-10 transition-all ${
        isDark
          ? "bg-[#064e3b] border-emerald-800"
          : "bg-white border-emerald-100"
      }`}
    >
      <div className="flex flex-col items-center">
        <div
          className={isDark ? "text-[#ffb900] mb-4" : "text-emerald-600 mb-4"}
        >
          <svg
            width="60"
            height="60"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        </div>

        <h1
          className={`text-4xl font-black mb-2 font-serif tracking-tighter transition-all ${isDark ? "text-[#ffb900]" : "text-emerald-800"}`}
        >
          نَسَق
        </h1>

        <p
          className={`opacity-90 text-sm font-bold leading-relaxed mb-10 px-4 transition-all ${isDark ? "text-white" : "text-slate-600"}`}
        >
          نَسَق: منصة ذكية لتنظيم خِتمتك، ومتابعة وردك اليومي، والمزامنة مع
          أصحابك بكل يسر.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onLogin();
          }}
          className="w-full space-y-4"
        >
          <input
            maxLength={30}
            type="text"
            placeholder="اسمك الكريم..."
            className={`w-full border rounded-2xl px-6 py-5 outline-none text-center font-black transition-all placeholder:opacity-30 text-lg ${
              isDark
                ? "bg-[#042f24] border-emerald-700 text-white focus:border-[#ffb900]"
                : "bg-slate-50 border-slate-300 text-slate-900 focus:border-emerald-500"
            }`}
            value={loginNameInput}
            onChange={(e) => setLoginNameInput(e.target.value)}
          />

          <button
            type="submit"
            className={`w-full font-black py-5 rounded-2xl shadow-xl transition-all active:scale-95 text-xl ${
              isDark
                ? "bg-[#ffb900] hover:bg-amber-400 text-[#042f24]"
                : "bg-emerald-600 hover:bg-emerald-500 text-white"
            }`}
          >
            ابدأ الآن
          </button>
        </form>
      </div>
    </div>
  );
}
