import { useState, useRef } from "react";

export default function HoldToConfirmButton({ onConfirm, theme }) {
  const [holding, setHolding] = useState(false);
  const timerRef = useRef(null);

  const startHold = () => {
    setHolding(true);
    timerRef.current = setTimeout(() => {
      onConfirm();
      setHolding(false);
    }, 5000); // 5 ثواني
  };

  const stopHold = () => {
    setHolding(false);
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <button
      onPointerDown={startHold}
      onPointerUp={stopHold}
      onPointerLeave={stopHold}
      onPointerCancel={stopHold}
      onContextMenu={(e) => e.preventDefault()}
      className={`relative w-full py-4 font-black text-xs sm:text-sm overflow-hidden rounded-2xl select-none transition-all touch-manipulation ${theme === "dark" ? "bg-red-900/40 text-red-300 border-red-800/50" : "bg-red-50 text-red-600 border-red-200"}`}
    >
      <span className="relative z-10">
        إزالة كل ما قرأته في المجموعة (اضغط باستمرار 5 ثوانٍ)
      </span>
      <div
        className={`absolute top-0 bottom-0 left-0 bg-red-600/50 transition-all z-0 ${holding ? "duration-[5000ms] w-full ease-linear" : "duration-200 w-0 ease-out"}`}
      />
    </button>
  );
}
