'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PaymentSlip } from '@/types/slip';
import { DEFAULT_SLIP, INITIAL_EXCEL_PRESETS } from '@/lib/sampleData';
import {
  savePaymentSlip,
  fetchAllPaymentSlips,
  deletePaymentSlip,
  getSupabaseCredentials,
  calculateSlipTotal,
} from '@/lib/supabase';
import { formatWhatsAppSummary } from '@/lib/whatsapp';
import { exportElementTo3xHDPNG } from '@/lib/exportImage';
import { PaymentReleaseForm } from '@/components/PaymentReleaseForm';
import { FormToolbar } from '@/components/FormToolbar';
import { ArchiveDrawer } from '@/components/ArchiveDrawer';
import { SupabaseModal } from '@/components/SupabaseModal';
import {
  Share2,
  Download,
  ShieldCheck,
  FolderArchive,
  Save,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const [currentSlip, setCurrentSlip] = useState<PaymentSlip>(DEFAULT_SLIP);
  const [allSlips, setAllSlips] = useState<PaymentSlip[]>(INITIAL_EXCEL_PRESETS);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatusText, setSaveStatusText] = useState('');
  const [isCopiedWhatsApp, setIsCopiedWhatsApp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  const formPrintRef = useRef<HTMLDivElement>(null);

  // Initialize data on mount
  useEffect(() => {
    const creds = getSupabaseCredentials();
    setIsSupabaseConnected(creds.isConfigured);

    const loadData = async () => {
      try {
        const { slips, fromSupabase } = await fetchAllPaymentSlips();
        if (slips && slips.length > 0) {
          setAllSlips(slips);
          // Default to the exact Dogma sheet from the user's screenshot
          const dogma = slips.find((s) => s.id === 'slip-dogma-sheet4') || slips.find((s) => s.paymentRequestNo === 'AZTS-0007') || DEFAULT_SLIP;
          setCurrentSlip(dogma);
        }
      } catch (err) {
        console.error('Failed to load initial slips:', err);
      }
    };

    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1-Tap Stamp for Ms. Zoha Khan
  const handleToggleZohaStamp = () => {
    const willBeVerified = !currentSlip.verifiedByZoha;
    const nowStr = new Date().toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const updatedSteps = currentSlip.approvalSteps.map((step) => {
      if (step.step === 3) {
        return {
          ...step,
          name: 'Ms. Zoha Khan',
          position: 'Verified By (Project Coordinator)',
          signed: willBeVerified,
          signedAt: willBeVerified ? nowStr : '',
          signatureToken: willBeVerified ? `AZ-VER-ZOHA-${Math.floor(1000 + Math.random() * 9000)}` : '',
        };
      }
      return step;
    });

    const updated: PaymentSlip = {
      ...currentSlip,
      verifiedByZoha: willBeVerified,
      verifiedAt: willBeVerified ? nowStr : undefined,
      approvalSteps: updatedSteps,
    };

    setCurrentSlip(updated);

    if (willBeVerified) {
      showToast('Official Green VERIFIED Badge Stamped for Ms. Zoha Khan!');
    } else {
      showToast('Verification stamp removed.');
    }

    // Auto-save update
    savePaymentSlip(updated);
  };

  // Export 3x HD PNG
  const handleExportPNG = async () => {
    if (!formPrintRef.current) return;
    setIsExporting(true);
    showToast('Rendering 3x HD uncompressed PNG for WhatsApp...');

    try {
      const clientSanitized = (currentSlip.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateSanitized = (currentSlip.date || '2026-08-21').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `AlZayed_Payment_Release_${clientSanitized}_${dateSanitized}`;

      await exportElementTo3xHDPNG(formPrintRef.current, filename);
      showToast('3x HD PNG downloaded successfully! Ready to share on WhatsApp.');
    } catch (err) {
      console.error('PNG export failed:', err);
      showToast('Export failed. Please check browser permissions.');
    } finally {
      setIsExporting(false);
    }
  };

  // Copy WhatsApp Summary
  const handleCopyWhatsApp = () => {
    const text = formatWhatsAppSummary(currentSlip);
    navigator.clipboard.writeText(text);
    setIsCopiedWhatsApp(true);
    showToast('Copied WhatsApp Summary recap to clipboard!');
    setTimeout(() => setIsCopiedWhatsApp(false), 2500);
  };

  // Save Slip (Permanently stored by client name)
  const handleSaveSlip = async () => {
    setIsSaving(true);
    setSaveStatusText('Saving...');

    try {
      const res = await savePaymentSlip(currentSlip);
      // Update local archive list
      const { slips } = await fetchAllPaymentSlips();
      setAllSlips(slips);

      if (res.syncedToSupabase) {
        setSaveStatusText('Saved to Supabase!');
        showToast(`Permanently saved "${currentSlip.clientName}" slip to Supabase & local storage!`);
      } else {
        setSaveStatusText('Saved Locally!');
        showToast(`Saved "${currentSlip.clientName}" slip permanently to local archive!`);
      }
    } catch (err: any) {
      console.error('Error saving slip:', err);
      setSaveStatusText('Save Error');
      showToast('Save encountered an issue, cached locally.');
    } finally {
      setTimeout(() => {
        setIsSaving(false);
        setSaveStatusText('');
      }, 2500);
    }
  };

  // Load Preset
  const handleSelectPreset = (name: string) => {
    const q = name.toLowerCase();
    const found = allSlips.find(
      (s) =>
        s.clientName?.toLowerCase().includes(q) ||
        s.projectName?.toLowerCase().includes(q) ||
        s.paymentRequestNo?.toLowerCase().includes(q) ||
        s.id?.toLowerCase().includes(q)
    );
    if (found) {
      setCurrentSlip(found);
      showToast(`Loaded "${found.clientName || found.projectName}" Excel slip.`);
    }
  };

  // New Blank Slip
  const handleNewBlankSlip = () => {
    const newId = `slip-${Date.now()}`;
    const fresh: PaymentSlip = {
      ...DEFAULT_SLIP,
      id: newId,
      paymentRequestNo: `AZTS-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      clientName: 'New Client',
      projectName: 'New Project',
      projectCode: `AZ-PRJ-${Math.floor(100 + Math.random() * 900)}`,
      items: [
        {
          id: `item-${Date.now()}`,
          description: 'MS Steel Tube / Pipe 6MTR',
          qty: 1,
          unitPrice: 500,
          amount: 500,
          projectName: 'New Project',
        },
      ],
      transport: 400,
      vatRate: 5,
      verifiedByZoha: false,
      verifiedAt: undefined,
      finalDecision: 'APPROVED FOR PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentSlip(fresh);
    savePaymentSlip(fresh);
    fetchAllPaymentSlips().then(({ slips }) => setAllSlips(slips));
    showToast('Created new blank payment release slip.');
  };

  // Duplicate Slip
  const handleDuplicateSlip = (slip: PaymentSlip) => {
    const duplicated: PaymentSlip = {
      ...slip,
      id: `slip-copy-${Date.now()}`,
      clientName: `${slip.clientName} (Copy)`,
      paymentRequestNo: `${slip.paymentRequestNo}-REV`,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCurrentSlip(duplicated);
    savePaymentSlip(duplicated);
    fetchAllPaymentSlips().then(({ slips }) => setAllSlips(slips));
    showToast(`Duplicated slip for "${duplicated.clientName}".`);
  };

  // Delete Slip
  const handleDeleteSlip = async (id: string) => {
    await deletePaymentSlip(id);
    const { slips } = await fetchAllPaymentSlips();
    setAllSlips(slips);
    if (currentSlip.id === id) {
      setCurrentSlip(slips[0] || DEFAULT_SLIP);
    }
    showToast('Slip deleted successfully.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-[#C8A96A] selection:text-slate-950">
      {/* Top Application Header / Toolbar */}
      <FormToolbar
        slip={currentSlip}
        onExportPNG={handleExportPNG}
        isExporting={isExporting}
        onCopyWhatsApp={handleCopyWhatsApp}
        isCopiedWhatsApp={isCopiedWhatsApp}
        onToggleZohaStamp={handleToggleZohaStamp}
        onSaveSlip={handleSaveSlip}
        isSaving={isSaving}
        saveStatusText={saveStatusText}
        onOpenArchive={() => setIsArchiveOpen(true)}
        archiveCount={allSlips.length}
        onSelectPreset={handleSelectPreset}
        onNewBlankSlip={handleNewBlankSlip}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
      />

      {/* Main Workspace */}
      <main className="flex-1 flex flex-col items-center justify-start py-6 px-2 md:px-4">
        {/* Helper bar & Zoom controls */}
        <div className="w-full max-w-4xl flex items-center justify-between pb-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 font-semibold text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-[#C8A96A]" />
              Exact Visual Excel Clone
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="hidden sm:inline text-slate-400">
              Yellow Highlight Total (AED {calculateSlipTotal(currentSlip).toLocaleString('en-US', { minimumFractionDigits: 2 })})
            </span>
          </div>

          {/* Zoom & View Controls */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoomScale((z) => Math.max(0.65, z - 0.1))}
              className="p-1 hover:text-white rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] px-1 text-slate-300">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              onClick={() => setZoomScale((z) => Math.min(1.4, z + 0.1))}
              className="p-1 hover:text-white rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomScale(1)}
              className="p-1 hover:text-white rounded"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Container for Mobile & Tablet */}
        <div className="w-full overflow-x-auto flex justify-center pb-24 md:pb-8">
          <div
            style={{
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
            }}
            className="my-1"
          >
            <PaymentReleaseForm
              ref={formPrintRef}
              slip={currentSlip}
              onChange={(updated) => setCurrentSlip(updated)}
              onToggleZohaStamp={handleToggleZohaStamp}
            />
          </div>
        </div>
      </main>

      {/* Floating Bottom Quick-Action Bar for Mobile Screens */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0A1322]/95 backdrop-blur-lg border-t border-slate-700 p-2.5 flex items-center justify-between gap-1.5 shadow-2xl">
        <button
          type="button"
          onClick={handleToggleZohaStamp}
          className={`flex-1 py-2 px-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all shadow-sm ${
            currentSlip.verifiedByZoha
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-950 text-emerald-300 border border-emerald-600'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="truncate">{currentSlip.verifiedByZoha ? 'VERIFIED' : 'Stamp Zoha'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyWhatsApp}
          className="flex-1 py-2 px-1.5 rounded-lg text-[11px] font-bold bg-[#25D366] text-slate-950 flex items-center justify-center gap-1 transition-all shadow-sm"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="truncate">WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={handleExportPNG}
          disabled={isExporting}
          className="flex-1 py-2 px-1.5 rounded-lg text-[11px] font-bold bg-[#C8A96A] text-slate-950 flex items-center justify-center gap-1 transition-all shadow-sm disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="truncate">3x PNG</span>
        </button>

        <button
          type="button"
          onClick={() => setIsArchiveOpen(true)}
          className="p-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
          title="Open Archive Drawer"
        >
          <FolderArchive className="w-4 h-4 text-[#C8A96A]" />
        </button>
      </div>

      {/* Archive Drawer */}
      <ArchiveDrawer
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        slips={allSlips}
        activeSlipId={currentSlip.id}
        onSelectSlip={(slip) => setCurrentSlip(slip)}
        onDeleteSlip={handleDeleteSlip}
        onDuplicateSlip={handleDuplicateSlip}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseSettings={() => {
          setIsArchiveOpen(false);
          setIsSupabaseModalOpen(true);
        }}
      />

      {/* Supabase Configuration Modal */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onCredentialsUpdated={() => {
          const creds = getSupabaseCredentials();
          setIsSupabaseConnected(creds.isConfigured);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-16 md:bottom-6 right-4 z-50 bg-[#0A1322] border-2 border-[#C8A96A] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C8A96A] flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
