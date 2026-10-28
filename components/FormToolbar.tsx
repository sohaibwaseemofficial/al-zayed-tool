import React from 'react';
import {
  Download,
  Share2,
  ShieldCheck,
  Save,
  FolderArchive,
  PlusCircle,
  FileCheck,
  CheckCircle2,
  Layers,
  Database,
  ExternalLink,
} from 'lucide-react';
import { PaymentSlip } from '@/types/slip';

interface FormToolbarProps {
  slip: PaymentSlip;
  onExportPNG: () => void;
  isExporting: boolean;
  onCopyWhatsApp: () => void;
  isCopiedWhatsApp: boolean;
  onToggleZohaStamp: () => void;
  onSaveSlip: () => void;
  isSaving: boolean;
  saveStatusText: string;
  onOpenArchive: () => void;
  archiveCount: number;
  onSelectPreset: (clientName: string) => void;
  onNewBlankSlip: () => void;
  onOpenSupabaseConfig: () => void;
  isSupabaseConnected: boolean;
}

export const FormToolbar: React.FC<FormToolbarProps> = ({
  slip,
  onExportPNG,
  isExporting,
  onCopyWhatsApp,
  isCopiedWhatsApp,
  onToggleZohaStamp,
  onSaveSlip,
  isSaving,
  saveStatusText,
  onOpenArchive,
  archiveCount,
  onSelectPreset,
  onNewBlankSlip,
  onOpenSupabaseConfig,
  isSupabaseConnected,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#0A1322]/95 backdrop-blur-md border-b border-slate-700/80 shadow-xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Brand Identity & Active Client Tag */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#C8A96A] text-slate-950 font-black font-serif flex items-center justify-center text-sm shadow-md">
              AZ
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white tracking-wider uppercase font-serif">
                  Al Zayed
                </span>
                <span className="text-[10px] uppercase font-bold text-[#C8A96A] bg-[#C8A96A]/10 px-1.5 py-0.5 rounded border border-[#C8A96A]/30">
                  Payment Release System
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Active Client: <strong className="text-white font-semibold">{slip.clientName || 'Untitled'}</strong>
              </p>
            </div>
          </div>

          {/* Preset Selector Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Load Excel Preset"
              onChange={(e) => {
                if (e.target.value === 'NEW') onNewBlankSlip();
                else if (e.target.value) onSelectPreset(e.target.value);
              }}
              value=""
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-[#C8A96A] focus:outline-none"
            >
              <option value="" disabled>Load Excel Sheet Preset ▾</option>
              <option value="barsha">Dogma (Sheet 4 - Al barsha + Inner Space)</option>
              <option value="Esnad">Esnad (Sheet 1 - MS Pipes &amp; Arches)</option>
              <option value="Naaji">Naaji (Sheet 2 - AZTS-0008)</option>
              <option value="Masri">Masri (Sheet 5 - Structural Steel)</option>
              <option value="Arabico">Arabico (Sheet 7 - Shade Net &amp; Hardware)</option>
              <option value="Promser">Promser (Sheet 8 - Dubai Exhibition)</option>
              <option value="NEW">+ Create Clean Blank Slip</option>
            </select>
          </div>
        </div>

        {/* Right: Core Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* 1-Tap Stamp Button for Ms. Zoha Khan */}
          <button
            type="button"
            onClick={onToggleZohaStamp}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
              slip.verifiedByZoha
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-600'
            }`}
            title="1-Tap Official Stamp for Ms. Zoha Khan"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>{slip.verifiedByZoha ? 'VERIFIED (Zoha Khan)' : '1-Tap Stamp (Ms. Zoha)'}</span>
          </button>

          {/* Copy WhatsApp Summary Button */}
          <button
            type="button"
            onClick={onCopyWhatsApp}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#25D366] hover:bg-[#20ba59] text-slate-950 flex items-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
            title="Copy WhatsApp Summary"
          >
            <Share2 className="w-4 h-4 text-slate-950" />
            <span>{isCopiedWhatsApp ? 'Copied WhatsApp!' : 'Copy WhatsApp Summary'}</span>
          </button>

          {/* Export 3x HD PNG Button */}
          <button
            type="button"
            onClick={onExportPNG}
            disabled={isExporting}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#C8A96A] hover:bg-[#d8bc7d] text-slate-950 flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Export 3x HD uncompressed PNG for WhatsApp"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>{isExporting ? 'Generating 3x PNG...' : 'Export 3x HD PNG'}</span>
          </button>

          {/* Save to Supabase & Local */}
          <button
            type="button"
            onClick={onSaveSlip}
            disabled={isSaving}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Save permanently by client name"
          >
            <Save className="w-4 h-4 text-[#C8A96A]" />
            <span>{isSaving ? 'Saving...' : saveStatusText || 'Save Slip'}</span>
          </button>

          {/* Archive Drawer Button */}
          <button
            type="button"
            onClick={onOpenArchive}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Open Archive Drawer"
          >
            <FolderArchive className="w-4 h-4 text-[#C8A96A]" />
            <span>Archive ({archiveCount})</span>
          </button>

          {/* Supabase Status Dot */}
          <button
            type="button"
            onClick={onOpenSupabaseConfig}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            title={isSupabaseConnected ? 'Supabase Live Connected' : 'Supabase Local Fallback (Click to configure)'}
          >
            <Database className={`w-4 h-4 ${isSupabaseConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
