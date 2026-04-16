import { WifiOff } from "lucide-react";

export default function OfflineBadge({ isOnline, showOfflineBadge, theme }) {
  if (isOnline || !showOfflineBadge) return null;

  return (
    <div
      className={`fixed top-4 right-4 sm:top-6 sm:right-6 z-[9998] flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border shadow-sm animate-in fade-in slide-in-from-right backdrop-blur-md transition-all ${theme === "dark" ? "bg-red-500/10 text-red-500 border-red-500/20" : "bg-red-50 text-red-600 border-red-200"}`}
    >
      <WifiOff className="w-5 h-5 sm:w-6 sm:h-6" />
    </div>
  );
}
