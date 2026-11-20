import { useEffect, useState } from 'react';

export default function LoadingBar({ text = 'Loading operations intelligence...' }) {
  const [progress, setProgress] = useState(15);
  const [statusMsg, setStatusMsg] = useState('Connecting to MongoDB Atlas...');

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(45);
      setStatusMsg('Analyzing guest reviews & sentiment scores...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(85);
      setStatusMsg('Computing week-over-week performance deltas...');
    }, 900);

    const timer3 = setTimeout(() => {
      setProgress(98);
      setStatusMsg('Rendering operational insights...');
    }, 1400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[380px] w-full px-4">
      <div className="bg-[#FFFFFF] border border-[#E8E4DC] rounded-3xl p-8 max-w-md w-full shadow-lg relative overflow-hidden text-center">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-sky-100 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-amber-100 rounded-full blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] flex items-center justify-center text-white text-xl shadow-md shadow-sky-200 animate-pulse">
            🏨
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-[#0F172A] tracking-wider uppercase">Azzurro Hotels</h3>
            <p className="text-xs text-slate-500 font-medium">Sydney Operations Intelligence</p>
          </div>
        </div>

        {/* Animated Progress Bar */}
        <div className="w-full bg-[#FAF8F4] h-3 rounded-full overflow-hidden p-0.5 border border-[#E8E4DC] shadow-inner mb-4">
          <div
            className="h-full bg-gradient-to-r from-[#0284C7] via-[#0EA5E9] to-emerald-400 rounded-full transition-all duration-500 ease-out relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[shimmer_1.5s_infinite] -skew-x-12" />
          </div>
        </div>

        {/* Status Message & Percentage */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1 font-medium">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-ping" />
            <span className="text-slate-700">{statusMsg}</span>
          </span>
          <span className="font-bold text-[#0284C7] bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
