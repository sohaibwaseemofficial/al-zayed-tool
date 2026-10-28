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
import {
  MasterMaterial,
  MasterSupplier,
  MasterClientProject,
  getStoredMaterials,
  getStoredSuppliers,
  getStoredClientProjects,
} from '@/lib/masterData';
import { formatWhatsAppSummary } from '@/lib/whatsapp';
import { exportElementTo3xHDPNG } from '@/lib/exportImage';
import { exportElementToPDF } from '@/lib/pdfExport';
import { TopNavbar } from '@/components/TopNavbar';
import { FormEditor } from '@/components/FormEditor';
import { PaymentReleaseForm } from '@/components/PaymentReleaseForm';
import { ArchiveDrawer } from '@/components/ArchiveDrawer';
import { MasterDataManagerModal } from '@/components/MasterDataManagerModal';
import { SupabaseModal } from '@/components/SupabaseModal';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function HomePage() {
  const [currentSlip, setCurrentSlip] = useState<PaymentSlip>(DEFAULT_SLIP);
  const [allSlips, setAllSlips] = useState<PaymentSlip[]>(INITIAL_EXCEL_PRESETS);

  // Master Data State
  const [masterMaterials, setMasterMaterials] = useState<MasterMaterial[]>([]);
  const [masterSuppliers, setMasterSuppliers] = useState<MasterSupplier[]>([]);
  const [masterClientProjects, setMasterClientProjects] = useState<MasterClientProject[]>([]);

  // Modals & Drawers State
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isMasterManagerOpen, setIsMasterManagerOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Status & Export States
  const [isExportingPNG, setIsExportingPNG] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatusText, setSaveStatusText] = useState('');
  const [isCopiedWhatsApp, setIsCopiedWhatsApp] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(false);

  // Mobile View Switcher: 'editor' | 'preview'
  const [mobileViewTab, setMobileViewTab] = useState<'editor' | 'preview'>('editor');

  const excelFormRef = useRef<HTMLDivElement>(null);

  // Initialize master data and slips
  useEffect(() => {
    const creds = getSupabaseCredentials();
    setIsSupabaseConnected(creds.isConfigured);

    setMasterMaterials(getStoredMaterials());
    setMasterSuppliers(getStoredSuppliers());
    setMasterClientProjects(getStoredClientProjects());

    const loadSlips = async () => {
      try {
        const { slips } = await fetchAllPaymentSlips();
        if (slips && slips.length > 0) {
          setAllSlips(slips);
          // Default to Dogma Sheet 4 or first slip
          const defaultSheet =
            slips.find((s) => s.id === 'slip-dogma-sheet4') ||
            slips.find((s) => s.paymentRequestNo === 'AZTS-0007') ||
            slips[0];
          setCurrentSlip(defaultSheet);
        }
      } catch (err) {
        console.error('Failed to load slips:', err);
      }
    };

    loadSlips();
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
    showToast(
      willBeVerified
        ? 'Verified as Ms. Zoha Khan! Official green seal stamped on slip.'
        : 'Verification removed.'
    );
    savePaymentSlip(updated);
  };

  // 1-Tap Approval for Hamza
  const handleToggleHamzaApproval = () => {
    const hamzaStep = currentSlip.approvalSteps?.find((s) => s.step === 2);
    const willBeApproved = !hamzaStep?.signed;

    const updatedSteps = currentSlip.approvalSteps.map((step) => {
      if (step.step === 2) {
        return {
          ...step,
          name: 'Hamza',
          position: 'Approved By (Project Manager)',
          signed: willBeApproved,
          signedAt: willBeApproved ? 'Approved' : '',
        };
      }
      return step;
    });

    const updated: PaymentSlip = {
      ...currentSlip,
      approvalSteps: updatedSteps,
    };

    setCurrentSlip(updated);
    showToast(willBeApproved ? 'Approved by Hamza (Project Manager)!' : 'PM approval cleared.');
    savePaymentSlip(updated);
  };

  // Export 3x HD PNG
  const handleExportPNG = async () => {
    if (!excelFormRef.current) return;
    setIsExportingPNG(true);
    showToast('Rendering 3x HD uncompressed PNG for WhatsApp...');

    try {
      const clientSanitized = (currentSlip.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateSanitized = (currentSlip.date || '2026-10-28').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `AlZayed_Payment_Release_${clientSanitized}_${dateSanitized}`;

      await exportElementTo3xHDPNG(excelFormRef.current, filename);
      showToast('3x HD PNG downloaded! Clean and sharp for WhatsApp.');
    } catch (err) {
      console.error('PNG export failed:', err);
      showToast('PNG export encountered an error.');
    } finally {
      setIsExportingPNG(false);
    }
  };

  // Export PDF
  const handleExportPDF = async () => {
    if (!excelFormRef.current) return;
    setIsExportingPDF(true);
    showToast('Generating PDF document...');

    try {
      const clientSanitized = (currentSlip.clientName || 'Client').replace(/[^a-zA-Z0-9_-]/g, '_');
      const dateSanitized = (currentSlip.date || '2026-10-28').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `AlZayed_Payment_Release_${clientSanitized}_${dateSanitized}.pdf`;

      await exportElementToPDF(excelFormRef.current, filename);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF export failed:', err);
      showToast('PDF export encountered an error.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Copy WhatsApp Summary
  const handleCopyWhatsApp = () => {
    const text = formatWhatsAppSummary(currentSlip);
    navigator.clipboard.writeText(text);
    setIsCopiedWhatsApp(true);
    showToast('Copied WhatsApp summary recap to clipboard!');
    setTimeout(() => setIsCopiedWhatsApp(false), 2500);
  };

  // Save Slip to Supabase Cloud & Local Storage
  const handleSaveToCloud = async () => {
    setIsSaving(true);
    setSaveStatusText('Saving...');

    try {
      const res = await savePaymentSlip(currentSlip);
      const { slips } = await fetchAllPaymentSlips();
      setAllSlips(slips);

      if (res.syncedToSupabase) {
        setSaveStatusText('Cloud Saved!');
        showToast(`Permanently saved "${currentSlip.clientName}" slip to Supabase!`);
      } else {
        setSaveStatusText('Saved Locally');
        showToast(`Saved "${currentSlip.clientName}" slip permanently to local archive.`);
      }
    } catch (err: any) {
      console.error('Error saving slip:', err);
      setSaveStatusText('Save Error');
      showToast('Cached locally.');
    } finally {
      setTimeout(() => {
        setIsSaving(false);
        setSaveStatusText('');
      }, 2500);
    }
  };

  // Quick Select from Master Client Projects
  const handleSelectProject = (cp: MasterClientProject) => {
    // Check if an existing slip matches
    const existing = allSlips.find(
      (s) =>
        s.clientName?.toLowerCase() === cp.clientName.toLowerCase() ||
        s.projectName?.toLowerCase() === cp.projectName.toLowerCase()
    );

    if (existing) {
      setCurrentSlip(existing);
      showToast(`Loaded slip for "${cp.clientName}".`);
    } else {
      const updated: PaymentSlip = {
        ...currentSlip,
        clientName: cp.clientName,
        projectName: cp.projectName,
        projectCode: cp.projectCode || `AZ-${Math.floor(100 + Math.random() * 900)}`,
      };
      setCurrentSlip(updated);
      showToast(`Switched client to "${cp.clientName}".`);
    }
  };

  // Create New Blank Slip
  const handleNewSlip = () => {
    const freshId = `slip-${Date.now()}`;
    const fresh: PaymentSlip = {
      ...DEFAULT_SLIP,
      id: freshId,
      paymentRequestNo: `AZTS-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().split('T')[0],
      clientName: 'New Client',
      projectName: 'New Project',
      projectCode: `AZ-PRJ-${Math.floor(100 + Math.random() * 900)}`,
      supplier: 'First Source',
      items: [
        {
          id: `item-${Date.now()}`,
          description: 'ANCHOR BOLTS M20X400M length',
          qty: 1,
          unitPrice: 13,
          amount: 13,
          projectName: 'New Project',
        },
      ],
      transport: 400,
      vatRate: 5,
      currentProgress: 10,
      verifiedByZoha: false,
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
      {/* 1. TOP NAVBAR (All controls fixed at top, NO overlapping bars across form) */}
      <TopNavbar
        slip={currentSlip}
        clientProjects={masterClientProjects}
        onSelectProject={handleSelectProject}
        onNewSlip={handleNewSlip}
        onExportPNG={handleExportPNG}
        isExportingPNG={isExportingPNG}
        onExportPDF={handleExportPDF}
        isExportingPDF={isExportingPDF}
        onCopyWhatsApp={handleCopyWhatsApp}
        isCopiedWhatsApp={isCopiedWhatsApp}
        onSaveToCloud={handleSaveToCloud}
        isSaving={isSaving}
        saveStatusText={saveStatusText}
        onOpenArchive={() => setIsArchiveOpen(true)}
        archiveCount={allSlips.length}
        onOpenMasterManager={() => setIsMasterManagerOpen(true)}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        isSupabaseConnected={isSupabaseConnected}
        mobileViewTab={mobileViewTab}
        onSetMobileViewTab={setMobileViewTab}
      />

      {/* 2. TWO-PANEL WORKSPACE (Desktop Side-by-Side & Mobile Responsive) */}
      <main className="flex-1 max-w-[1750px] w-full mx-auto p-3 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT PANEL: Form Editor & Controls */}
        <div
          className={`lg:col-span-5 h-[calc(100vh-85px)] ${
            mobileViewTab === 'editor' ? 'block' : 'hidden lg:block'
          }`}
        >
          <FormEditor
            slip={currentSlip}
            onChange={(updated) => setCurrentSlip(updated)}
            materials={masterMaterials}
            suppliers={masterSuppliers}
            clientProjects={masterClientProjects}
            onUpdateSuppliers={setMasterSuppliers}
            onUpdateClientProjects={setMasterClientProjects}
            onToggleZohaStamp={handleToggleZohaStamp}
            onToggleHamzaApproval={handleToggleHamzaApproval}
          />
        </div>

        {/* RIGHT PANEL: Live Printable Excel Replica (Completely Clean & Unobstructed) */}
        <div
          className={`lg:col-span-7 flex flex-col items-center h-[calc(100vh-85px)] overflow-hidden bg-slate-900/40 border border-slate-800/80 rounded-2xl p-3 sm:p-4 ${
            mobileViewTab === 'preview' ? 'block' : 'hidden lg:flex'
          }`}
        >
          {/* Replica Header with Zoom Controls */}
          <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#C8A96A]" />
                Live Printable Excel Replica
              </span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">
                (Clean export target for 3x HD PNG &amp; PDF)
              </span>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
              <button
                onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.05))}
                className="p-1 hover:text-white rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] px-1 text-slate-300">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((z) => Math.min(1.4, z + 0.05))}
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

          {/* Clean Scrollable Viewport without any floating overlays */}
          <div className="flex-1 w-full overflow-auto flex justify-center items-start py-2">
            <div
              style={{
                transform: `scale(${zoomScale})`,
                transformOrigin: 'top center',
                transition: 'transform 0.1s ease',
              }}
              className="my-auto pb-8"
            >
              <PaymentReleaseForm
                ref={excelFormRef}
                slip={currentSlip}
                onChange={(updated) => setCurrentSlip(updated)}
                isReadOnly={false}
              />
            </div>
          </div>
        </div>
      </main>

      {/* 3. MASTER DATA MANAGER MODAL */}
      <MasterDataManagerModal
        isOpen={isMasterManagerOpen}
        onClose={() => setIsMasterManagerOpen(false)}
        materials={masterMaterials}
        suppliers={masterSuppliers}
        clientProjects={masterClientProjects}
        onUpdateMaterials={setMasterMaterials}
        onUpdateSuppliers={setMasterSuppliers}
        onUpdateClientProjects={setMasterClientProjects}
      />

      {/* 4. REAL SLIPS ARCHIVE DRAWER */}
      <ArchiveDrawer
        isOpen={isArchiveOpen}
        onClose={() => setIsArchiveOpen(false)}
        slips={allSlips}
        activeSlipId={currentSlip.id}
        onSelectSlip={(s) => setCurrentSlip(s)}
        onDeleteSlip={handleDeleteSlip}
        onDuplicateSlip={handleDuplicateSlip}
        onExportSlipPNG={(s) => {
          setCurrentSlip(s);
          setTimeout(() => handleExportPNG(), 300);
        }}
        onExportSlipPDF={(s) => {
          setCurrentSlip(s);
          setTimeout(() => handleExportPDF(), 300);
        }}
        isSupabaseConnected={isSupabaseConnected}
        onOpenSupabaseSettings={() => {
          setIsArchiveOpen(false);
          setIsSupabaseModalOpen(true);
        }}
      />

      {/* 5. SUPABASE SETTINGS MODAL */}
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#001229] border-2 border-[#C8A96A] text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-[#C8A96A] flex-shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
