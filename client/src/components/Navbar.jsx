import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const linkClass = ({ isActive }) =>
    `px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all ${
      isActive
        ? 'bg-[#0284C7] text-white shadow-sm'
        : 'text-slate-600 hover:text-slate-900 hover:bg-[#F4EFE6]'
    }`;

  return (
    <nav className="bg-[#FFFFFF] border-b border-[#E8E4DC] sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Azzurro Brand Wordmark */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#0284C7] to-[#38BDF8] flex items-center justify-center text-white text-base shadow-sm group-hover:scale-105 transition-transform">
            🏨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-wider text-[#0F172A] uppercase">
                Azzurro
              </span>
              <span className="text-[10px] bg-[#E0F2FE] text-[#0369A1] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                Hotels
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight">
              Sydney · Free dinner. Cozy pods. Operations Intelligence.
            </p>
          </div>
        </Link>

        {/* Live Status indicator */}
        <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 bg-[#FAF8F4] border border-[#E8E4DC] px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="font-medium text-[11px]">Booking.com Live Review Stream</span>
        </div>

        {/* Navigation links */}
        <div className="flex items-center gap-1.5 bg-[#FAF8F4] p-1 rounded-full border border-[#E8E4DC]">
          <NavLink to="/" end className={linkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/compare" className={linkClass}>
            Compare Properties
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
