import React from "react";
import { X, ChevronDown, Trash2, BookOpen, Loader2, RotateCcw, ArrowRightLeft, Check } from "lucide-react";
import { SURAHS } from "../data/surahs";

export default function KhatmahModal({ selected, setSelected, quickRegister, setQuickRegister, logs, userName, vRanges, setVRanges, loading, onClaim, onDeleteAll, getOccupiedVerses, openModal }) {
    if (!selected && !quickRegister) return null;
    const isSuraDone = selected && logs.filter(l => l.surah_id === selected.id).reduce((sum, l) => sum + (l.verse_end - l.verse_start + 1), 0) >= selected.ayat;

    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && (setSelected(null), setQuickRegister(false))}>
            <div className="bg-emerald-950 w-full max-w-[420px] rounded-t-[2.5rem] sm:rounded-[2rem] border border-emerald-800 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <button onClick={() => { setSelected(null); setQuickRegister(false); }} className="p-1.5 bg-emerald-900/50 rounded-full text-emerald-700 hover:text-red-400 transition-colors"><X className="w-5 h-5" /></button>
                    <div className="text-right"><h2 className="text-2xl font-bold text-amber-400 font-serif">{selected ? selected.name_ar : "تسجيل سريع"}</h2></div>
                </div>

                {quickRegister && !selected && (
                    <div className="mb-6 relative group text-right">
                        <label className="text-[10px] text-emerald-700 font-bold uppercase mb-2 block tracking-widest">اختر السورة</label>
                        <select className="w-full bg-emerald-900/40 border border-emerald-800 rounded-xl py-3 px-4 text-right text-lg font-bold text-amber-200 appearance-none outline-none focus:border-amber-500" onChange={(e) => openModal(SURAHS.find(s => s.id === parseInt(e.target.value)))}>
                            <option value="">-- اضغط هنا للاختيار --</option>
                            {SURAHS.map(s => <option key={s.id} value={s.id} className="bg-emerald-950 text-white">{s.name_ar}</option>)}
                        </select>
                        <ChevronDown className="absolute left-4 top-1/2 mt-2 w-4 h-4 text-emerald-700 pointer-events-none" />
                    </div>
                )}

                {selected && (
                    <>
                        {isSuraDone ? (
                            <div className="py-8 flex flex-col items-center">
                                <div className="bg-emerald-900/50 p-4 rounded-full mb-4 border border-emerald-500/30"><Check className="w-12 h-12 text-emerald-400" /></div>
                                <h3 className="text-xl font-bold text-emerald-400 mb-1 text-center">سورة مكتملة</h3>
                                <p className="text-emerald-700 text-xs mb-4 text-center">بواسطة: {[...new Set(logs.filter(l => l.surah_id === selected.id).map(l => l.user_name))].join('، ')}</p>
                                <button onClick={onDeleteAll} className="w-full bg-red-950/40 border border-red-900/50 text-red-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-red-900/60 transition-all"><RotateCcw className="w-5 h-5" /> إلغاء الختم / الحجز</button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-4 mb-8">
                                    {vRanges.map((range, index) => {
                                        const occupied = getOccupiedVerses(selected.id);
                                        return (
                                            <div key={index} className={`flex flex-row-reverse gap-2 items-center transition-all duration-300 ${!range.isActive ? 'opacity-30' : 'opacity-100'}`}>
                                                <div className="flex-1 relative group">
                                                    <select value={range.start} onChange={(e) => { 
                                                        const r = [...vRanges]; r[index].start = parseInt(e.target.value); r[index].isActive = true; r[index].end = Math.max(r[index].start, r[index].end);
                                                        if (index === vRanges.length - 1 && r[index].end < selected.ayat && r[index].end > 0) r.push({ start: r[index].end + 1, end: 0, isActive: false, isSaved: false }); setVRanges(r);
                                                    }} disabled={range.isSaved} className={`w-full bg-emerald-900/40 border border-emerald-800 rounded-xl py-2.5 px-2 text-center text-lg font-bold appearance-none outline-none ${range.isSaved ? 'text-emerald-500' : 'text-amber-200'}`}>
                                                        <option value="0" disabled>من</option>
                                                        {Array.from({ length: selected.ayat }, (_, i) => i + 1).map(num => (<option key={num} value={num} className="bg-emerald-950 text-white" disabled={occupied.has(num) && !range.isSaved}>{num} {num === 1 ? '(أول السورة)' : num === selected.ayat ? '(آخر السورة)' : ''}</option>))}
                                                    </select>
                                                    {!range.isSaved && <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-700 pointer-events-none" />}
                                                </div>
                                                <div className="text-emerald-800 font-black text-xs">:</div>
                                                <div className="flex-1 relative group">
                                                    <select value={range.end} onChange={(e) => { const r = [...vRanges]; r[index].end = parseInt(e.target.value); r[index].isActive = true; setVRanges(r); }} disabled={range.isSaved} className={`w-full bg-emerald-900/40 border border-emerald-800 rounded-xl py-2.5 px-2 text-center text-lg font-bold appearance-none outline-none ${range.isSaved ? 'text-emerald-500' : 'text-amber-200'}`}>
                                                        <option value="0" disabled>إلى</option>
                                                        {!range.isSaved && <option value={selected.ayat} className="bg-emerald-900 text-amber-400">آخر السورة ({selected.ayat})</option>}
                                                        {Array.from({ length: selected.ayat - range.start + 1 }, (_, i) => i + range.start).map(num => (<option key={num} value={num} className="bg-emerald-950 text-white" disabled={occupied.has(num) && !range.isSaved}>{num} {num === selected.ayat ? '(آخر السورة)' : ''}</option>))}
                                                    </select>
                                                    {!range.isSaved && <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-700 pointer-events-none" />}
                                                </div>
                                                <div className="flex-none w-10 h-10 bg-emerald-900/60 border border-emerald-700 rounded-xl flex flex-col items-center justify-center">
                                                    <span className="text-amber-400 text-[10px] font-bold">{range.end ? range.end - range.start + 1 : 0}</span>
                                                    <span className="text-[6px] text-emerald-600 uppercase">آية</span>
                                                </div>
                                                <button onClick={() => setVRanges(vRanges.filter((_, i) => i !== index))} className="p-1 text-red-900/50 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={onDeleteAll} className="w-14 bg-red-950/20 border border-red-900/30 rounded-2xl flex items-center justify-center text-red-500 hover:bg-red-900/40 transition-all"><Trash2 className="w-6 h-6" /></button>
                                    <button onClick={onClaim} className="flex-1 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all text-base uppercase">
                                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <BookOpen className="w-5 h-5" />} حجز الآيات
                                    </button>
                                    <button onClick={() => { setSelected(null); setQuickRegister(false); }} className="w-14 bg-emerald-900/20 border border-emerald-800 rounded-2xl flex items-center justify-center text-emerald-500 hover:bg-emerald-900/40 transition-all"><ArrowRightLeft className="w-5 h-5" /></button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}