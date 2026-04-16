import { useState } from "react";
import { supabase } from "../lib/supabase";
import { User, Lock, ArrowLeft, ArrowRight, BookText } from "lucide-react";

// 👇 دالة التشفير باستخدام Web Crypto API (عشان الباسورد ميكونش مكشوف في الداتا بيز)
const hashPassword = async (password) => {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

export default function Auth({ theme, onLogin }) {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isExisting, setIsExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleNext = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    const name = username.trim();

    // التحقق من الاسم: 4 أحرف وثنائي
    if (name.length < 4 || name.split(" ").length < 2) {
      return setErrorMsg("يرجى كتابة اسم ثنائي على الأقل (4 أحرف فأكثر)");
    }

    setLoading(true);
    try {
      const { data } = await supabase
        .from("users")
        .select("username")
        .eq("username", name)
        .maybeSingle();

      if (data) {
        setIsExisting(true);
      } else {
        setIsExisting(false);
      }
      setStep(2);
    } catch (err) {
      console.error(err);
      setIsExisting(false);
      setStep(2);
    }
    setLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (password.length < 4)
      return setErrorMsg("كلمة المرور يجب أن تكون 4 أحرف على الأقل");

    setLoading(true);
    const name = username.trim();

    try {
      // 👇 تشفير الباسورد قبل إرساله لقاعدة البيانات
      const securedPassword = await hashPassword(password);

      if (isExisting) {
        // تسجيل الدخول
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("username", name)
          .eq("password", securedPassword)
          .maybeSingle();

        if (error || !data) {
          setLoading(false);
          return setErrorMsg("اسم المستخدم أو كلمة المرور غير صحيحة");
        }
        onLogin(name); // 👈 إرسال الاسم للـ App.jsx
      } else {
        // إنشاء حساب
        const { error } = await supabase
          .from("users")
          .insert([{ username: name, password: securedPassword }]);

        if (error) {
          setLoading(false);
          return setErrorMsg("حدث خطأ أثناء إنشاء الحساب، تأكد من الاتصال");
        }
        onLogin(name); // 👈 الدخول مباشرة بعد إنشاء الحساب
      }
    } catch (err) {
      setErrorMsg("حدث خطأ في الاتصال بالخادم");
    }
    setLoading(false);
  };

  const handleGuest = () => {
    const name = username.trim() || "ضيف";
    const guestName = `${name}_GUEST_${Math.floor(Math.random() * 10000)}`;
    onLogin(guestName);
  };

  return (
    <div
      className={`w-full max-w-md p-8 rounded-[2.5rem] border shadow-2xl relative z-10 transition-all ${theme === "dark" ? "bg-[#022a1d] border-emerald-800" : "bg-white border-slate-200"}`}
    >
      <div className="flex flex-col items-center mb-4">
        <div
          className={`p-4 rounded-full mb-4 shadow-inner ${theme === "dark" ? "bg-[#ffb900]/10" : "bg-emerald-50"}`}
        >
          <BookText
            size={40}
            className={theme === "dark" ? "text-[#ffb900]" : "text-emerald-600"}
          />
        </div>
        <h2
          className={`text-2xl font-black font-serif ${theme === "dark" ? "text-white" : "text-emerald-900"}`}
        >
          تسجيل الدخول لنَسَق
        </h2>
      </div>

      <form
        onSubmit={step === 1 ? handleNext : handleAuth}
        className="space-y-4"
      >
        <div className="relative">
          <User
            className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme === "dark" ? "text-emerald-500" : "text-slate-400"}`}
            size={20}
          />
          <input
            autoFocus
            disabled={step === 2}
            type="text"
            placeholder="اسم المستخدم (ثنائي)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={`w-full p-4 pr-12 rounded-2xl border font-bold text-sm outline-none transition-all disabled:opacity-50 ${theme === "dark" ? "bg-emerald-900/20 border-emerald-800 text-white focus:border-emerald-500" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-emerald-500"}`}
          />
        </div>

        {step === 2 && (
          <div className="relative animate-in slide-in-from-top-4 fade-in">
            <Lock
              className={`absolute right-4 top-1/2 -translate-y-1/2 ${theme === "dark" ? "text-emerald-500" : "text-slate-400"}`}
              size={20}
            />
            <input
              autoFocus
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-4 pr-12 rounded-2xl border font-bold text-sm outline-none transition-all ${theme === "dark" ? "bg-emerald-900/20 border-emerald-800 text-white focus:border-[#ffb900]" : "bg-slate-50 border-slate-200 text-slate-800 focus:border-[#ffb900]"}`}
            />
          </div>
        )}
        {step === 2 && !isExisting && (
          <div
            className={`p-3 rounded-xl border animate-in slide-in-from-bottom-2 fade-in text-center ${theme === "dark" ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"} mb-4`}
          >
            <p
              className={`text-[0.65rem] sm:text-xs font-black leading-relaxed ${theme === "dark" ? "text-red-400" : "text-red-600"}`}
            >
              ⚠️ تنبيه هام: "نَسَق" في نسخته التجريبية الأولى.
              <br />
              يرجى{" "}
              <span className="underline decoration-wavy underline-offset-4">
                عدم استخدام كلمة مرور تستخدمها لحساباتك الشخصية
              </span>{" "}
              (مثل الإيميل أو السوشيال ميديا). استخدم كلمة مرور بسيطة وخاصة بهذا
              التطبيق فقط.
            </p>
          </div>
        )}
        {errorMsg && (
          <p className="text-red-500 text-xs font-black text-center bg-red-500/10 p-2 rounded-xl">
            {errorMsg}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-4 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 flex justify-center items-center gap-2 ${theme === "dark" ? "bg-emerald-600 hover:bg-emerald-500" : "bg-emerald-500 hover:bg-emerald-400"}`}
        >
          {loading ? (
            "جاري التحميل..."
          ) : step === 1 ? (
            <>
              التالي <ArrowLeft size={18} />
            </>
          ) : isExisting ? (
            "تسجيل الدخول"
          ) : (
            "إنشاء حساب"
          )}
        </button>

        {step === 1 && (
          <button
            type="button"
            onClick={handleGuest}
            className={`w-full mt-2 font-bold text-xs underline transition-all hover:opacity-80 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
          >
            تسجيل كضيف (بدون كلمة سر)
          </button>
        )}

        {step === 2 && (
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setPassword("");
              setErrorMsg("");
            }}
            className={`w-full mt-2 font-bold text-xs flex items-center justify-center gap-1 transition-all hover:opacity-80 ${theme === "dark" ? "text-slate-400" : "text-slate-500"}`}
          >
            <ArrowRight size={14} /> تعديل اسم المستخدم
          </button>
        )}
      </form>
    </div>
  );
}
