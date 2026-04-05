import { useContext } from "react";
import { FontContext } from "../App";
import { Moon } from "lucide-react";

export default function Auth({ loginNameInput, setLoginNameInput, onLogin }) {
  const { fontSize } = useContext(FontContext);

  return (
    <div className="min-h-screen bg-emerald-950 flex items-center justify-center p-6 text-right">
      <div className="bg-emerald-900/40 p-8 rounded-3xl border border-emerald-800 w-full max-w-sm text-center shadow-2xl backdrop-blur-md">
        <Moon className="w-16 h-16 text-amber-400 mx-auto mb-6" />
        <h1
          style={{ fontSize: `${fontSize + 12}px` }}
          className="font-bold text-amber-400 mb-8 font-serif"
        >
          نَسَق
        </h1>
        <input
          value={loginNameInput}
          onChange={(e) => setLoginNameInput(e.target.value)}
          placeholder="اسمك الكريم..."
          style={{ fontSize: `${Math.max(14, fontSize - 4)}px` }}
          className="w-full bg-emerald-950 border border-emerald-700 rounded-xl px-4 py-4 text-white mb-4 outline-none focus:border-amber-500 text-center"
        />
        <button
          onClick={onLogin}
          style={{ fontSize: `${Math.max(16, fontSize - 2)}px` }}
          className="w-full bg-amber-500 text-emerald-950 font-black py-4 rounded-xl active:scale-95 transition-all shadow-lg"
        >
          ابدأ الآن
        </button>
      </div>
    </div>
  );
}
