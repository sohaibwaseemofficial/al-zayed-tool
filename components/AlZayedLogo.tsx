import React from 'react';

interface AlZayedLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AlZayedLogo: React.FC<AlZayedLogoProps> = ({ className = '', size = 'md' }) => {
  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Luxury Geometric Shield / Emblem */}
      <div className="relative flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-br from-[#16233b] via-[#0A1322] to-[#040811] border-2 border-[#C8A96A] shadow-md shadow-black/40 overflow-hidden">
        {/* Subtle geometric lines */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg viewBox="0 0 100 100" className="w-full h-full stroke-[#C8A96A]" fill="none" strokeWidth="1">
            <polygon points="50,5 95,95 5,95" />
            <line x1="50" y1="5" x2="50" y2="95" />
            <line x1="25" y1="50" x2="75" y2="50" />
          </svg>
        </div>

        {/* Monogram AZ in Radiant Gold */}
        <div className="relative text-center flex flex-col items-center justify-center">
          <span className="font-serif font-black tracking-widest text-xl text-[#C8A96A] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] leading-none">
            AZ
          </span>
          <div className="w-6 h-[1.5px] bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent my-0.5" />
          <span className="text-[7px] font-sans uppercase tracking-[0.2em] text-white/80 font-bold">
            EST. 1995
          </span>
        </div>
      </div>

      {/* Brand Name Typography mirroring the Excel Form */}
      <div className="flex flex-col justify-center text-left leading-tight">
        <span className="text-[10px] font-medium tracking-[0.25em] text-[#C8A96A] uppercase font-sans">
          شركة الزايد للخيام والمظلات
        </span>
        <h2 className="text-lg md:text-xl font-extrabold tracking-wider text-white font-serif uppercase">
          AL ZAYED
        </h2>
        <span className="text-[11px] font-semibold tracking-widest text-[#F2EFE6] uppercase">
          TENTS &amp; SHADES L.L.C
        </span>
      </div>
    </div>
  );
};
