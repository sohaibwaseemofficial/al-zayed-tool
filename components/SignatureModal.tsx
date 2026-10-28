import React, { useRef, useState, useEffect } from 'react';
import { X, CheckCircle2, PenTool, Eraser, ShieldCheck, Check } from 'lucide-react';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  stepNumber: number;
  roleName: string;
  personName: string;
  isCurrentSigned: boolean;
  onApplyStamp: (signatureToken?: string) => void;
  onApplyDrawing: (dataUrl: string) => void;
  onClearSignature: () => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  stepNumber,
  roleName,
  personName,
  isCurrentSigned,
  onApplyStamp,
  onApplyDrawing,
  onClearSignature,
}) => {
  const [activeMode, setActiveMode] = useState<'stamp' | 'draw'>('stamp');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (isOpen && activeMode === 'draw') {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#001a4d'; // Navy pen ink
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      }
    }
  }, [isOpen, activeMode]);

  if (!isOpen) return null;

  // Drawing handlers for mouse & touch
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSaveDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onApplyDrawing(dataUrl);
    onClose();
  };

  const handleOneTapStamp = () => {
    const token = `AZ-${personName.slice(0, 2).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    onApplyStamp(token);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-slate-100 z-10">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C8A96A]" />
              <span>Step {stepNumber}: E-Signature &amp; Stamp</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {roleName} — <strong className="text-white">{personName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-slate-800 my-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveMode('stamp')}
            className={`flex-1 py-2 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeMode === 'stamp'
                ? 'border-[#C8A96A] text-[#C8A96A]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>One-Tap Official Stamp</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMode('draw')}
            className={`flex-1 py-2 text-center border-b-2 flex items-center justify-center gap-1.5 transition-colors ${
              activeMode === 'draw'
                ? 'border-[#C8A96A] text-[#C8A96A]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Draw Touch Signature</span>
          </button>
        </div>

        {/* Tab 1: One-Tap Stamp */}
        {activeMode === 'stamp' && (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl border-2 border-dashed border-emerald-600/60 bg-emerald-950/30 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 text-white font-mono font-black text-xs tracking-wider shadow">
                <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                <span>{stepNumber === 3 ? 'VERIFIED' : 'APPROVED'}</span>
              </div>
              <div className="text-xs font-bold text-white uppercase">{personName}</div>
              <div className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                {roleName}
              </div>
              <div className="text-[9px] text-slate-400 font-mono">
                Al Zayed Security Authorization Stamp
              </div>
            </div>

            <button
              type="button"
              onClick={handleOneTapStamp}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Apply Official Stamp</span>
            </button>
          </div>
        )}

        {/* Tab 2: Draw Touch Signature */}
        {activeMode === 'draw' && (
          <div className="space-y-3 py-1">
            <div className="relative border-2 border-slate-700 bg-white rounded-xl overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={380}
                height={140}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-36 bg-white cursor-crosshair touch-none"
              />
              <div className="absolute bottom-1 right-2 pointer-events-none text-[10px] text-slate-400 italic font-serif">
                Sign with finger or mouse
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>

              <button
                type="button"
                onClick={handleSaveDrawing}
                disabled={!hasDrawn}
                className="flex-1 py-1.5 rounded-lg bg-[#C8A96A] hover:bg-[#d8bc7d] text-slate-950 font-bold text-xs flex items-center justify-center gap-1 shadow disabled:opacity-50 transition-all"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Signature</span>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Clear / Remove button if currently signed */}
        {isCurrentSigned && (
          <div className="pt-3 mt-3 border-t border-slate-800 flex justify-between items-center">
            <button
              type="button"
              onClick={() => {
                onClearSignature();
                onClose();
              }}
              className="text-xs text-rose-400 hover:underline flex items-center gap-1"
            >
              <Eraser className="w-3 h-3" />
              <span>Clear / Remove Signature</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
