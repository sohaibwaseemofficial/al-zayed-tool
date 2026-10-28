import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface InlineDatePickerProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  align?: 'left' | 'right';
  labelIcon?: string;
}

export function InlineDatePicker({
  value,
  onChange,
  placeholder = 'DD-MM-YYYY',
  className = '',
  align = 'left',
  labelIcon,
}: InlineDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const nativeDateInputRef = useRef<HTMLInputElement>(null);

  // Deterministic date parsing without calling new Date() on render
  const parseInitialDate = () => {
    if (!value) return null;
    // Try DD-MM-YYYY
    const dmyMatch = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmyMatch) {
      const d = parseInt(dmyMatch[1], 10);
      const m = parseInt(dmyMatch[2], 10) - 1;
      const y = parseInt(dmyMatch[3], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return { y, m, d };
    }
    // Try YYYY-MM-DD
    const ymdMatch = value.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (ymdMatch) {
      const y = parseInt(ymdMatch[1], 10);
      const m = parseInt(ymdMatch[2], 10) - 1;
      const d = parseInt(ymdMatch[3], 10);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) return { y, m, d };
    }
    return null;
  };

  const initialParsed = parseInitialDate();
  const [viewYear, setViewYear] = useState<number>(initialParsed ? initialParsed.y : 2026);
  const [viewMonth, setViewMonth] = useState<number>(initialParsed ? initialParsed.m : 9); // 0-11
  const [todayDate, setTodayDate] = useState<{ y: number; m: number; d: number } | null>(null);

  // Client-side only current date initialization (safe for Next.js 16 prerendering)
  useEffect(() => {
    const now = new Date();
    setTodayDate({
      y: now.getFullYear(),
      m: now.getMonth(),
      d: now.getDate(),
    });
  }, []);

  // Keep view in sync when value changes externally
  useEffect(() => {
    const p = parseInitialDate();
    if (p) {
      setViewYear(p.y);
      setViewMonth(p.m);
    }
  }, [value]);

  // Click outside listener to close calendar popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const formatDateString = (year: number, month: number, day: number) => {
    const dStr = String(day).padStart(2, '0');
    const mStr = String(month + 1).padStart(2, '0');
    return `${dStr}-${mStr}-${year}`;
  };

  const selectDay = (day: number) => {
    const formatted = formatDateString(viewYear, viewMonth, day);
    onChange(formatted);
    setIsOpen(false);
  };

  const selectPreset = (offsetDays: number) => {
    const target = new Date();
    target.setDate(target.getDate() + offsetDays);
    const formatted = formatDateString(
      target.getFullYear(),
      target.getMonth(),
      target.getDate()
    );
    onChange(formatted);
    setIsOpen(false);
  };

  // Build calendar matrix
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun
  // Convert so Monday is 0, Sunday is 6
  const startOffset = (firstDayOfMonth + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  // Check if a given day is selected
  const isSelected = (day: number) => {
    const targetStr = formatDateString(viewYear, viewMonth, day);
    return value.trim() === targetStr;
  };

  // Check if today
  const isToday = (day: number) => {
    if (!todayDate) return false;
    return (
      todayDate.y === viewYear &&
      todayDate.m === viewMonth &&
      todayDate.d === day
    );
  };

  // Convert for native date picker fallback
  const getNativeValue = () => {
    const dmyMatch = value.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dmyMatch) {
      return `${dmyMatch[3]}-${String(dmyMatch[2]).padStart(2, '0')}-${String(dmyMatch[1]).padStart(2, '0')}`;
    }
    return '';
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    if (val) {
      const [y, m, d] = val.split('-');
      onChange(`${d}-${m}-${y}`);
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center w-full">
      {/* Clickable text / input display */}
      <div className="flex-1 flex items-center min-w-0">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          onClick={() => setIsOpen(true)}
          className={`w-full bg-transparent border-none outline-none focus:bg-amber-50 focus:ring-1 focus:ring-amber-300 rounded px-1 text-inherit ${className}`}
        />
      </div>

      {/* Small interactive Calendar trigger button */}
      <button
        type="button"
        data-html2canvas-ignore="true"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title="Tap to open calendar picker"
        className="ml-1 p-0.5 rounded text-slate-500 hover:text-amber-700 hover:bg-amber-100/60 active:scale-95 transition-all flex-shrink-0 cursor-pointer"
      >
        <Calendar className="w-3.5 h-3.5" />
      </button>

      {/* Hidden native input for mobile browser native picker */}
      <input
        ref={nativeDateInputRef}
        type="date"
        value={getNativeValue()}
        onChange={handleNativeChange}
        data-html2canvas-ignore="true"
        className="sr-only"
        tabIndex={-1}
      />

      {/* CALENDAR POPOVER MODAL */}
      {isOpen && (
        <div
          data-html2canvas-ignore="true"
          className={`absolute top-full mt-1.5 ${
            align === 'right' ? 'right-0' : 'left-0'
          } z-50 w-64 bg-slate-900 text-slate-100 border border-slate-700 shadow-2xl rounded-xl p-3 text-xs animate-in fade-in zoom-in-95 duration-100 select-none`}
          style={{ minWidth: '260px' }}
        >
          {/* Popover Header: Month, Year, and Nav */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-bold text-slate-100 text-[13px]">
              {monthNames[viewMonth]} {viewYear}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={nextMonth}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 ml-1"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center justify-between gap-1 mb-2.5 pb-2 border-b border-slate-800/80 text-[10.5px]">
            <button
              type="button"
              onClick={() => selectPreset(0)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-[#C8A96A] hover:text-slate-950 font-medium transition-colors"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => selectPreset(1)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-[#C8A96A] hover:text-slate-950 font-medium transition-colors"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => selectPreset(7)}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-[#C8A96A] hover:text-slate-950 font-medium transition-colors"
            >
              +1 Week
            </button>
            <button
              type="button"
              onClick={() => {
                if (nativeDateInputRef.current) {
                  try {
                    nativeDateInputRef.current.showPicker();
                  } catch (e) {
                    nativeDateInputRef.current.click();
                  }
                }
              }}
              className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1"
              title="Open Device Native Calendar"
            >
              <Calendar className="w-2.5 h-2.5" />
              <span>More</span>
            </button>
          </div>

          {/* Day of Week Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 mb-1">
            {daysOfWeek.map((day) => (
              <div key={day} className="py-0.5">
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Blank offset days */}
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`blank-${i}`} className="h-7 w-7" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const selected = isSelected(dayNum);
              const todayFlag = isToday(dayNum);

              return (
                <button
                  key={`day-${dayNum}`}
                  type="button"
                  onClick={() => selectDay(dayNum)}
                  className={`h-7 w-7 rounded-lg text-xs font-semibold flex items-center justify-center transition-all ${
                    selected
                      ? 'bg-[#C8A96A] text-slate-950 font-bold shadow-md scale-105'
                      : todayFlag
                      ? 'border border-[#C8A96A] text-[#C8A96A] hover:bg-[#C8A96A]/20'
                      : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Footer: Current formatted value display */}
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono text-slate-300">{value || 'No date set'}</span>
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="text-slate-400 hover:text-rose-400 text-[10px]"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
