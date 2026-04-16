import {
  X,
  Calendar,
  AlertTriangle,
  Lock,
  Globe,
  Copy,
  RefreshCw,
  UserMinus,
} from "lucide-react";
import HoldToConfirmButton from "./HoldToConfirmButton";

export default function GroupInfoModal({
  theme,
  currentGroup,
  userName,
  groupStats,
  progress,
  onClose,
  onLeave,
  onReset,
  onDeleteGroup,
  onKickUser,
  onRegenerateCode,
}) {
  if (!currentGroup) return null;

  const isCreator = currentGroup.creator_name === userName;

  // 👇 الرابط بقى ذكي: لو مجموعة عامة مش هيحط الكود السري، ولو خاصة هيحطه
  const inviteLink = `${window.location.origin}${window.location.pathname}?invite=${encodeURIComponent(currentGroup.name)}${currentGroup.is_private ? `&code=${currentGroup.invite_code || ""}` : ""}`;

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("تم نسخ رابط الدعوة بنجاح! 📋");
  };

  const usersList = Object.entries(groupStats?.users || {}).sort(
    (a, b) => b[1] - a[1],
  );

  return (
    <div
      className="fixed inset-0 z-[400] bg-black/20 backdrop-blur-sm flex items-start justify-center overflow-y-auto px-4 py-12 sm:py-20"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md my-auto h-fit max-h-[85vh] overflow-y-auto quran-scroll p-8 sm:p-10 rounded-[3.5rem] border shadow-2xl relative z-10 ${theme === "dark" ? "bg-gradient-to-b from-[#064e3b] to-[#022a1d] border-emerald-700/40 text-emerald-50" : "bg-gradient-to-b from-white to-slate-50 border-slate-200 text-slate-800"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8 px-2 relative z-10">
          <h2
            className={`text-2xl sm:text-3xl font-black font-serif ${theme === "dark" ? "text-[#ffb900]" : "text-emerald-700"}`}
          >
            معلومات المجموعة
          </h2>
          <button
            onClick={onClose}
            className={`p-3 rounded-full transition-all active:scale-90 ${theme === "dark" ? "bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
          >
            <X size={20} />
          </button>
        </div>

        <div
          className={`p-4 rounded-2xl border flex items-center justify-center gap-2 font-black mb-6 relative z-10 ${currentGroup.is_private ? (theme === "dark" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-amber-50 border-amber-200 text-amber-600") : theme === "dark" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}
        >
          {currentGroup.is_private ? (
            <>
              <Lock size={18} />
              <span>هذه ختمة شخصية (خاصة بك فقط 🔒)</span>
            </>
          ) : (
            <>
              <Globe size={18} />
              <span>هذه مجموعة عامّة (متاحة للانضمام 🌍)</span>
            </>
          )}
        </div>

        <div className="space-y-6 relative z-10">
          {/* 👇 قسم مشاركة الرابط (يظهر للكل في العام، وللمنشئ في الخاص) 👇 */}
          <div
            className={`p-5 rounded-3xl border shadow-sm ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"}`}
          >
            <h4 className="text-[0.65rem] sm:text-xs font-black opacity-60 uppercase mb-3 text-right tracking-widest">
              رابط دعوة مباشر
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={copyInviteLink}
                className={`flex-1 p-3 rounded-xl font-black text-xs sm:text-sm flex justify-center items-center gap-2 transition-all ${theme === "dark" ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-emerald-500 hover:bg-emerald-400 text-white"}`}
              >
                <Copy size={16} /> نسخ الرابط
              </button>
              {/* زر تغيير الكود (للمجموعات الخاصة فقط، وللمنشئ فقط) */}
              {isCreator && currentGroup.is_private && (
                <button
                  onClick={onRegenerateCode}
                  title="تغيير كود الدعوة (لإبطال الرابط القديم)"
                  className={`p-3 rounded-xl transition-all ${theme === "dark" ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" : "bg-amber-100 text-amber-600 hover:bg-amber-200"}`}
                >
                  <RefreshCw size={16} />
                </button>
              )}
            </div>
          </div>

          <div
            className={`p-5 rounded-3xl border shadow-sm ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"}`}
          >
            <h4 className="text-[0.65rem] sm:text-xs font-black opacity-60 uppercase mb-4 text-right tracking-widest">
              الأعضاء ومساهماتهم
            </h4>
            <div className="space-y-3 max-h-48 overflow-y-auto quran-scroll pr-2">
              {/* 👇 رسالة: لم يتم قراءة أي شيء 👇 */}
              {usersList.length === 0 ? (
                <div
                  className={`text-center font-bold text-sm py-4 ${theme === "dark" ? "text-emerald-100/50" : "text-slate-400"}`}
                >
                  لم يتم قراءة أي شيء لحد الآن 📖
                </div>
              ) : (
                usersList.map(([user, count], idx) => {
                  const percent =
                    groupStats.totalVerses > 0
                      ? ((count / groupStats.totalVerses) * 100).toFixed(1)
                      : 0;
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center group"
                    >
                      <span className="font-bold text-sm bg-emerald-500/10 px-3 py-1 rounded-lg text-emerald-500">
                        {percent}%
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{user}</span>
                        {user === currentGroup.creator_name && (
                          <span className="text-[0.6rem] bg-amber-500 text-emerald-950 px-2 py-0.5 rounded-full font-black">
                            المنشئ
                          </span>
                        )}
                        {isCreator && user !== userName && (
                          <button
                            onClick={() => onKickUser(user)}
                            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-red-500/10 rounded-md hover:bg-red-500/20"
                          >
                            <UserMinus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div
              className={`p-4 rounded-2xl border shadow-sm ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"}`}
            >
              <span className="block text-2xl font-black text-emerald-500 mb-1">
                {progress}%
              </span>
              <span className="text-[0.65rem] font-black opacity-50">
                النسبة
              </span>
            </div>
            <div
              className={`p-4 rounded-2xl border shadow-sm ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"}`}
            >
              <span className="block text-2xl font-black text-emerald-500 mb-1">
                {groupStats.completedSurahs}
              </span>
              <span className="text-[0.65rem] font-black opacity-50">
                سور تامة
              </span>
            </div>
            <div
              className={`p-4 rounded-2xl border shadow-sm ${theme === "dark" ? "bg-emerald-900/30 border-emerald-500/10" : "bg-slate-50/80 border-slate-200"}`}
            >
              <span className="block text-2xl font-black text-emerald-500 mb-1">
                {groupStats.totalVerses}
              </span>
              <span className="text-[0.65rem] font-black opacity-50">آيات</span>
            </div>
          </div>

          <div className="pt-6 border-t border-dashed border-red-500/30 space-y-3">
            <button
              onClick={onLeave}
              className={`w-full p-4 rounded-2xl font-black text-sm transition-all shadow-sm ${theme === "dark" ? "bg-slate-800/50 hover:bg-slate-800 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-800"}`}
            >
              الخروج من المجموعة
            </button>
            <HoldToConfirmButton
              theme={theme}
              onConfirm={async () => {
                onReset("personal");
              }}
            />
            {isCreator && (
              <>
                <button
                  onClick={() => onReset("all")}
                  className={`w-full p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${theme === "dark" ? "bg-red-600 hover:bg-red-500 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}
                >
                  <AlertTriangle size={18} /> إعادة تعيين للجميع (تصفير)
                </button>
                <button
                  onClick={onDeleteGroup}
                  className={`w-full p-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all shadow-sm border ${theme === "dark" ? "bg-[#2a0808] hover:bg-[#3a0b0b] text-red-400 border-red-900/50" : "bg-red-50 hover:bg-red-100 text-red-700 border-red-200"}`}
                >
                  <X size={18} /> حذف المجموعة نهائياً
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
