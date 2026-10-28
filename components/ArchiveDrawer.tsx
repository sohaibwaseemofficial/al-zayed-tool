import React, { useState } from 'react';
import {
  X,
  Search,
  FolderArchive,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Trash2,
  Copy,
  Download,
  Share2,
  Database,
  Cloud,
  HardDrive,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import { PaymentSlip } from '@/types/slip';
import { calculateSlipTotal } from '@/lib/supabase';
import { formatWhatsAppSummary } from '@/lib/whatsapp';

interface ArchiveDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  slips: PaymentSlip[];
  activeSlipId: string;
  onSelectSlip: (slip: PaymentSlip) => void;
  onDeleteSlip: (id: string) => void;
  onDuplicateSlip: (slip: PaymentSlip) => void;
  onExportSlipPNG: (slip: PaymentSlip) => void;
  onExportSlipPDF: (slip: PaymentSlip) => void;
  isSupabaseConnected: boolean;
  onOpenSupabaseSettings: () => void;
}

export const ArchiveDrawer: React.FC<ArchiveDrawerProps> = ({
  isOpen,
  onClose,
  slips,
  activeSlipId,
  onSelectSlip,
  onDeleteSlip,
  onDuplicateSlip,
  onExportSlipPNG,
  onExportSlipPDF,
  isSupabaseConnected,
  onOpenSupabaseSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VERIFIED' | 'DRAFT'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Extract unique client names
  const clients = Array.from(
    new Set(slips.map((s) => s.clientName?.trim()).filter(Boolean))
  );

  // Filter slips by search, client, and verified/draft status
  const filteredSlips = slips.filter((s) => {
    const matchesSearch =
      searchTerm === '' ||
      s.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.projectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.paymentRequestNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supplier?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient =
      selectedClient === 'ALL' || s.clientName?.trim() === selectedClient;

    const isVerified = Boolean(s.verifiedByZoha);
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'VERIFIED' && isVerified) ||
      (statusFilter === 'DRAFT' && !isVerified);

    return matchesSearch && matchesClient && matchesStatus;
  });

  const handleCopyWhatsApp = (e: React.MouseEvent, slip: PaymentSlip) => {
    e.stopPropagation();
    const text = formatWhatsAppSummary(slip);
    navigator.clipboard.writeText(text);
    setCopiedId(slip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-lg bg-slate-900 border-l border-slate-700/80 shadow-2xl flex flex-col h-full z-10 text-slate-100">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0A1322] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-[#C8A96A]/40 rounded-lg text-[#C8A96A]">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Slips Archive &amp; Tracking
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {slips.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Permanently synced by client name
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Supabase status banner */}
        <div className="px-4 py-2 bg-slate-950/70 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            {isSupabaseConnected ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <Cloud className="w-3.5 h-3.5" />
                <span>Supabase Live Sync</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium">
                <HardDrive className="w-3.5 h-3.5" />
                <span>Local Storage Active</span>
              </span>
            )}
          </div>
          <button
            onClick={onOpenSupabaseSettings}
            className="text-[11px] text-[#C8A96A] hover:underline flex items-center gap-1"
          >
            <Database className="w-3 h-3" />
            <span>Config</span>
          </button>
        </div>

        {/* Search & Status Filters */}
        <div className="p-4 border-b border-slate-800 space-y-3 bg-slate-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by client, project, or request #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#C8A96A] transition-colors"
            />
          </div>

          {/* Status Tabs: All | Verified | Draft */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`flex-1 py-1 rounded text-[11px] transition-colors ${
                statusFilter === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Slips ({slips.length})
            </button>
            <button
              onClick={() => setStatusFilter('VERIFIED')}
              className={`flex-1 py-1 rounded text-[11px] transition-colors ${
                statusFilter === 'VERIFIED'
                  ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Verified ({slips.filter((s) => s.verifiedByZoha).length})
            </button>
            <button
              onClick={() => setStatusFilter('DRAFT')}
              className={`flex-1 py-1 rounded text-[11px] transition-colors ${
                statusFilter === 'DRAFT'
                  ? 'bg-amber-900/60 text-amber-300 border border-amber-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Draft ({slips.filter((s) => !s.verifiedByZoha).length})
            </button>
          </div>

          {/* Client Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            <button
              onClick={() => setSelectedClient('ALL')}
              className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
                selectedClient === 'ALL'
                  ? 'bg-[#C8A96A] text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Clients
            </button>
            {clients.map((c) => {
              const count = slips.filter((s) => s.clientName?.trim() === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedClient(c)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap text-[11px] font-medium transition-colors ${
                    selectedClient === c
                      ? 'bg-[#C8A96A] text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Slips List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredSlips.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-slate-500">
              <FileSpreadsheet className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No payment slips found</p>
              <p className="text-xs text-slate-600 mt-1">Try a different search or filter</p>
            </div>
          ) : (
            filteredSlips.map((slip) => {
              const total = calculateSlipTotal(slip);
              const isActive = slip.id === activeSlipId;

              return (
                <div
                  key={slip.id}
                  className={`group relative p-3.5 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-gradient-to-br from-[#121e35] to-[#0A1322] border-[#C8A96A] shadow-md ring-1 ring-[#C8A96A]/50'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white group-hover:text-[#C8A96A] transition-colors">
                          {slip.clientName || 'Unnamed Client'}
                        </h4>
                        {slip.verifiedByZoha ? (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            VERIFIED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800 text-slate-400">
                            <Clock className="w-2.5 h-2.5" />
                            Draft
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {slip.projectName} • {slip.paymentRequestNo}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Supplier: <span className="text-slate-300 font-medium">{slip.supplier || 'N/A'}</span>
                      </p>
                    </div>

                    {/* Total Amount in Excel Yellow Tag */}
                    <div className="text-right flex-shrink-0">
                      <div className="px-2 py-0.5 rounded bg-yellow-400 text-slate-950 font-black text-xs font-mono shadow-sm">
                        AED {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1">
                        {slip.date}
                      </span>
                    </div>
                  </div>

                  {/* 4 Quick Action Buttons */}
                  <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-slate-800/60 text-[10px] font-semibold">
                    {/* Open / Edit */}
                    <button
                      type="button"
                      onClick={() => {
                        onSelectSlip(slip);
                        onClose();
                      }}
                      className="py-1.5 px-1 rounded bg-[#C8A96A] hover:bg-[#d8bc7d] text-slate-950 font-bold flex items-center justify-center gap-1 transition-colors"
                      title="Open and edit this slip"
                    >
                      <ArrowRight className="w-3 h-3" />
                      <span>Edit</span>
                    </button>

                    {/* Download 3x PNG */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportSlipPNG(slip);
                      }}
                      className="py-1.5 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1 transition-colors border border-slate-700"
                      title="Download 3x HD PNG"
                    >
                      <Download className="w-3 h-3 text-[#C8A96A]" />
                      <span>3x PNG</span>
                    </button>

                    {/* Download PDF */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onExportSlipPDF(slip);
                      }}
                      className="py-1.5 px-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center gap-1 transition-colors border border-slate-700"
                      title="Download PDF"
                    >
                      <FileText className="w-3 h-3 text-emerald-400" />
                      <span>PDF</span>
                    </button>

                    {/* Copy WhatsApp */}
                    <button
                      type="button"
                      onClick={(e) => handleCopyWhatsApp(e, slip)}
                      className="py-1.5 px-1 rounded bg-[#25D366]/20 hover:bg-[#25D366]/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center gap-1 transition-colors"
                      title="Copy WhatsApp Summary"
                    >
                      <Share2 className="w-3 h-3 text-[#25D366]" />
                      <span>{copiedId === slip.id ? 'Copied!' : 'WhatsApp'}</span>
                    </button>
                  </div>

                  {/* Duplicate & Delete Row */}
                  <div className="flex items-center justify-between mt-2 pt-1.5 text-[10.5px] text-slate-500 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateSlip(slip);
                      }}
                      className="hover:text-slate-300 flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Duplicate</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete slip for "${slip.clientName}"?`)) {
                          onDeleteSlip(slip.id);
                        }
                      }}
                      className="hover:text-rose-400 flex items-center gap-1 text-slate-500"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          Connected to Supabase • All changes permanently saved
        </div>
      </div>
    </div>
  );
};
