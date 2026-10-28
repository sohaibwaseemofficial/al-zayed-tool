import React from 'react';
import {
  PlusCircle,
  Download,
  Share2,
  Save,
  FolderArchive,
  Database,
  FileText,
  Settings,
  Eye,
  Edit3,
} from 'lucide-react';
import { PaymentSlip } from '@/types/slip';
import { MasterClientProject } from '@/lib/masterData';

interface TopNavbarProps {
  slip: PaymentSlip;
  clientProjects: MasterClientProject[];
  onSelectProject: (cp: MasterClientProject) => void;
  onNewSlip: () => void;
  onExportPNG: () => void;
  isExportingPNG: boolean;
  onExportPDF: () => void;
  isExportingPDF: boolean;
  onCopyWhatsApp: () => void;
  isCopiedWhatsApp: boolean;
  onSaveToCloud: () => void;
  isSaving: boolean;
  saveStatusText: string;
  onOpenArchive: () => void;
  archiveCount: number;
  onOpenMasterManager: () => void;
  onOpenSupabaseConfig: () => void;
  isSupabaseConnected: boolean;
  mobileViewTab: 'editor' | 'preview';
  onSetMobileViewTab: (tab: 'editor' | 'preview') => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  slip,
  clientProjects,
  onSelectProject,
  onNewSlip,
  onExportPNG,
  isExportingPNG,
  onExportPDF,
  isExportingPDF,
  onCopyWhatsApp,
  isCopiedWhatsApp,
  onSaveToCloud,
  isSaving,
  saveStatusText,
  onOpenArchive,
  archiveCount,
  onOpenMasterManager,
  onOpenSupabaseConfig,
  isSupabaseConnected,
  mobileViewTab,
  onSetMobileViewTab,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#001229] border-b border-slate-700/80 shadow-xl px-3 sm:px-4 py-2.5 text-slate-100">
      <div className="max-w-[1700px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-2.5">
        {/* Brand & Project Selector */}
        <div className="flex items-center justify-between w-full lg:w-auto gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-[#d4b779] to-[#C8A96A] text-slate-950 font-black font-serif flex items-center justify-center text-sm shadow">
              AZ
            </div>
            <div className="leading-tight">
              <span className="font-extrabold text-sm text-white tracking-wide uppercase font-serif">
                Al Zayed
              </span>
              <span className="text-[10px] text-[#C8A96A] font-semibold block uppercase tracking-wider">
                Payment Release Workspace
              </span>
            </div>
          </div>

          {/* Quick Client / Project Selector */}
          <div className="flex items-center gap-1.5">
            <select
              aria-label="Select Client/Project"
              onChange={(e) => {
                if (e.target.value === 'NEW') onNewSlip();
                else {
                  const found = clientProjects.find((cp) => cp.id === e.target.value);
                  if (found) onSelectProject(found);
                }
              }}
              value=""
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:border-[#C8A96A] focus:outline-none max-w-[190px] sm:max-w-[240px] truncate"
            >
              <option value="" disabled>Select Client / Project ▾</option>
              {clientProjects.map((cp) => (
                <option key={cp.id} value={cp.id}>
                  {cp.clientName} - {cp.projectName}
                </option>
              ))}
              <option value="NEW">+ Create New Blank Slip</option>
            </select>

            <button
              type="button"
              onClick={onNewSlip}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1"
              title="Create new slip"
            >
              <PlusCircle className="w-4 h-4 text-[#C8A96A]" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher (Editor vs Live Sheet Preview) */}
        <div className="flex lg:hidden w-full items-center justify-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => onSetMobileViewTab('editor')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mobileViewTab === 'editor'
                ? 'bg-[#C8A96A] text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Form Editor</span>
          </button>
          <button
            type="button"
            onClick={() => onSetMobileViewTab('preview')}
            className={`flex-1 py-1.5 px-3 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mobileViewTab === 'preview'
                ? 'bg-[#C8A96A] text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Excel Sheet Preview</span>
          </button>
        </div>

        {/* Controls: Export, WhatsApp, Save, Archive, Masters */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end text-xs">
          {/* Manage Masters */}
          <button
            type="button"
            onClick={onOpenMasterManager}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Manage suppliers, materials catalog, and client projects"
          >
            <Settings className="w-3.5 h-3.5 text-[#C8A96A]" />
            <span>Masters</span>
          </button>

          {/* Copy WhatsApp Summary */}
          <button
            type="button"
            onClick={onCopyWhatsApp}
            className="px-2.5 py-1.5 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow active:scale-95 cursor-pointer"
            title="Copy structured WhatsApp recap"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isCopiedWhatsApp ? 'Copied!' : 'WhatsApp'}</span>
          </button>

          {/* Export 3x HD PNG */}
          <button
            type="button"
            onClick={onExportPNG}
            disabled={isExportingPNG}
            className="px-2.5 py-1.5 rounded-lg bg-[#C8A96A] hover:bg-[#d8bc7d] text-slate-950 font-bold flex items-center gap-1.5 transition-all shadow active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Export 3x HD uncompressed PNG for WhatsApp"
          >
            <Download className={`w-3.5 h-3.5 ${isExportingPNG ? 'animate-bounce' : ''}`} />
            <span>{isExportingPNG ? 'Rendering...' : '3x HD PNG'}</span>
          </button>

          {/* Download PDF */}
          <button
            type="button"
            onClick={onExportPDF}
            disabled={isExportingPDF}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Download PDF document"
          >
            <FileText className={`w-3.5 h-3.5 text-[#C8A96A] ${isExportingPDF ? 'animate-spin' : ''}`} />
            <span>{isExportingPDF ? 'PDF...' : 'PDF'}</span>
          </button>

          {/* Save to Cloud (Supabase) */}
          <button
            type="button"
            onClick={onSaveToCloud}
            disabled={isSaving}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Save permanently by client name"
          >
            <Save className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isSaving ? 'Saving...' : saveStatusText || 'Save Slip'}</span>
          </button>

          {/* Open Archive Drawer */}
          <button
            type="button"
            onClick={onOpenArchive}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="Open past slips archive"
          >
            <FolderArchive className="w-3.5 h-3.5 text-[#C8A96A]" />
            <span>Archive ({archiveCount})</span>
          </button>

          {/* Supabase status indicator */}
          <button
            type="button"
            onClick={onOpenSupabaseConfig}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-white"
            title={isSupabaseConnected ? 'Supabase Live Connected' : 'Supabase Config (Click to setup)'}
          >
            <Database className={`w-3.5 h-3.5 ${isSupabaseConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
