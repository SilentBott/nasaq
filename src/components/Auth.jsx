//! login/regester page and authinitication
import { Moon } from "lucide-react";

export default function Auth({ loginNameInput, setLoginNameInput, onLogin }) {
  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-6 text-right">
      <div className="bg-emerald-900/40 p-8 rounded-3xl border border-emerald-800 w-full max-w-sm text-center shadow-2xl backdrop-blur-md">
        <Moon className="w-16 h-16 text-amber-400 mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-amber-400 mb-8 font-serif">
          ختمة
        </h1>
        <input
          value={loginNameInput}
          onChange={(e) => setLoginNameInput(e.target.value)}
          placeholder="اسمك الكريم..."
          className="w-full bg-emerald-950 border border-emerald-700 rounded-xl px-4 py-4 text-white mb-4 outline-none focus:border-amber-500 text-center text-lg"
        />
        <button
          onClick={onLogin}
          className="w-full bg-amber-500 text-emerald-950 font-black py-4 rounded-xl active:scale-95 transition-all text-xl"
        >
          ابدأ الآن
        </button>
      </div>
    </div>
  );
}
