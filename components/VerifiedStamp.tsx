import React from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface VerifiedStampProps {
  isVerified: boolean;
  onToggle: () => void;
  verifiedAt?: string;
  signatureToken?: string;
  readOnly?: boolean;
}

export const VerifiedStamp: React.FC<VerifiedStampProps> = ({
  isVerified,
  onToggle,
  verifiedAt,
  signatureToken,
  readOnly = false,
}) => {
  const playStampSound = () => {
    try {
      if (typeof window !== 'undefined' && 'AudioContext' in window) {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (readOnly) return;
    playStampSound();
    onToggle();
  };

  if (!isVerified) {
    return (
      <div className="flex items-center justify-center py-0.5">
        <button
          type="button"
          onClick={handleClick}
          disabled={readOnly}
          className="px-2 py-0.5 rounded border border-dashed border-emerald-600 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[10px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1"
          title="Click to stamp verification for Ms. Zoha Khan"
        >
          <ShieldCheck className="w-3 h-3 text-emerald-700 animate-pulse" />
          <span>Stamp (Ms. Zoha Khan)</span>
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={readOnly ? -1 : 0}
      title={readOnly ? 'Verified by Ms. Zoha Khan' : 'Click to re-stamp or remove verification'}
      className={`relative inline-flex items-center gap-2 px-2.5 py-1 rounded border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-sans shadow-sm select-none ${
        readOnly ? '' : 'cursor-pointer hover:bg-emerald-100/90 active:scale-95'
      }`}
    >
      <div className="flex items-center justify-center p-0.5 bg-emerald-600 rounded-full text-white">
        <CheckCircle2 className="w-3 h-3 stroke-[3]" />
      </div>

      <div className="text-left leading-none">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-black tracking-wider text-emerald-800 font-mono">
            VERIFIED
          </span>
          <span className="text-[8.5px] font-bold text-emerald-700 uppercase bg-emerald-200/80 px-1 rounded">
            AZTS
          </span>
        </div>
        <div className="text-[8px] font-mono text-emerald-700 mt-0.5">
          {verifiedAt || '28-OCT-2026 • 11:30 AM'}
        </div>
      </div>
    </div>
  );
};
