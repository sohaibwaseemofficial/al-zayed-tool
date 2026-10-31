import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  Building,
  Truck,
  Package,
  Layers,
  ChevronDown,
  DollarSign,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { PaymentSlip, MaterialItem } from '@/types/slip';
import {
  MasterMaterial,
  MasterSupplier,
  MasterClientProject,
  saveStoredSuppliers,
  saveStoredClientProjects,
} from '@/lib/masterData';
import { calculateSlipSubtotal, calculateSlipVAT, calculateSlipTotal } from '@/lib/supabase';
import { InlineDatePicker } from './InlineDatePicker';

interface FormEditorProps {
  slip: PaymentSlip;
  onChange: (updated: PaymentSlip) => void;
  materials: MasterMaterial[];
  suppliers: MasterSupplier[];
  clientProjects: MasterClientProject[];
  onUpdateSuppliers: (sups: MasterSupplier[]) => void;
  onUpdateClientProjects: (cps: MasterClientProject[]) => void;
  onToggleZohaStamp: () => void;
  onToggleHamzaApproval: () => void;
}

export const FormEditor: React.FC<FormEditorProps> = ({
  slip,
  onChange,
  materials,
  suppliers,
  clientProjects,
  onUpdateSuppliers,
  onUpdateClientProjects,
  onToggleZohaStamp,
  onToggleHamzaApproval,
}) => {
  const [inlineNewClientOpen, setInlineNewClientOpen] = useState(false);
  const [inlineClientName, setInlineClientName] = useState('');
  const [inlineProjectName, setInlineProjectName] = useState('');

  const [inlineNewSupplierOpen, setInlineNewSupplierOpen] = useState(false);
  const [inlineSupplierName, setInlineSupplierName] = useState('');

  const subtotal = calculateSlipSubtotal(slip);
  const vat = calculateSlipVAT(slip);
  const total = calculateSlipTotal(slip);

  const updateField = <K extends keyof PaymentSlip>(key: K, value: PaymentSlip[K]) => {
    onChange({ ...slip, [key]: value });
  };

  const updateStage = (stageKey: keyof PaymentSlip['stages']) => {
    onChange({
      ...slip,
      stages: {
        ...slip.stages,
        [stageKey]: !slip.stages[stageKey],
      },
    });
  };

  const updateBenefit = (benefitKey: keyof PaymentSlip['benefits']) => {
    onChange({
      ...slip,
      benefits: {
        ...slip.benefits,
        [benefitKey]: !slip.benefits[benefitKey],
      },
    });
  };

  const handleItemChange = (index: number, field: keyof MaterialItem, val: any) => {
    const newItems = [...slip.items];
    const item = { ...newItems[index], [field]: val };

    // When material description is selected from master catalog, auto-fill default unit price
    if (field === 'description') {
      const match = materials.find(
        (m) => m.description.toLowerCase() === String(val).trim().toLowerCase()
      );
      if (match && (!item.unitPrice || item.unitPrice === 0 || item.unitPrice === 100)) {
        item.unitPrice = match.defaultUnitPrice;
      }
    }

    if (field === 'qty' || field === 'unitPrice' || field === 'description') {
      const qty = field === 'qty' ? Number(val) || 0 : Number(item.qty) || 0;
      const unitPrice = field === 'unitPrice' ? Number(val) || 0 : Number(item.unitPrice) || 0;
      item.amount = Number((qty * unitPrice).toFixed(2));
    }

    newItems[index] = item;
    onChange({ ...slip, items: newItems });
  };

  const addItem = () => {
    const newItem: MaterialItem = {
      id: `item-${Date.now()}`,
      description: '',
      qty: 1,
      unitPrice: 0,
      amount: 0,
      projectName: slip.clientName || 'dogma',
    };
    onChange({ ...slip, items: [...slip.items, newItem] });
  };

  const removeItem = (index: number) => {
    if (slip.items.length <= 1) return;
    const newItems = slip.items.filter((_, i) => i !== index);
    onChange({ ...slip, items: newItems });
  };

  // Add inline new client
  const handleAddInlineClient = () => {
    if (!inlineClientName.trim()) return;
    const newCp: MasterClientProject = {
      id: `cp-${Date.now()}`,
      clientName: inlineClientName.trim(),
      projectName: inlineProjectName.trim() || inlineClientName.trim(),
      projectCode: `AZ-${Math.floor(100 + Math.random() * 900)}`,
    };
    const updated = [newCp, ...clientProjects];
    onUpdateClientProjects(updated);
    saveStoredClientProjects(updated);
    updateField('clientName', newCp.clientName);
    updateField('projectName', newCp.projectName);
    updateField('projectCode', newCp.projectCode || '');
    setInlineClientName('');
    setInlineProjectName('');
    setInlineNewClientOpen(false);
  };

  // Add inline new supplier
  const handleAddInlineSupplier = () => {
    if (!inlineSupplierName.trim()) return;
    const newSup: MasterSupplier = {
      id: `sup-${Date.now()}`,
      name: inlineSupplierName.trim(),
    };
    const updated = [newSup, ...suppliers];
    onUpdateSuppliers(updated);
    saveStoredSuppliers(updated);
    updateField('supplier', newSup.name);
    setInlineSupplierName('');
    setInlineNewSupplierOpen(false);
  };

  const hamzaApproved = slip.approvalSteps?.find((s) => s.step === 2)?.signed;
  const zohaVerified = slip.verifiedByZoha;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-4 sm:p-5 text-slate-100 space-y-6 text-xs font-sans h-full overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Form Editor &amp; Controls</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/30">
              Interactive
            </span>
          </h2>
          <p className="text-[11px] text-slate-400">
            Edits update the live Excel replica instantly
          </p>
        </div>

        {/* Live Total Tag */}
        <div className="text-right">
          <span className="text-[10px] text-slate-400 block font-medium">Payable Total</span>
          <span className="font-mono font-black text-sm text-yellow-400">
            AED {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* SECTION 1: BASIC INFORMATION */}
      <div className="space-y-3.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-[#C8A96A]" />
            1. Basic Information
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Row 8–13</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Payment Request No */}
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Payment Request No.
            </label>
            <input
              type="text"
              value={slip.paymentRequestNo}
              onChange={(e) => updateField('paymentRequestNo', e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold font-mono text-slate-100 focus:border-[#C8A96A] focus:outline-none"
            />
          </div>

          {/* Project Contract Value */}
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Project Contract Value (AED)
            </label>
            <input
              type="number"
              value={slip.expectedInvoiceValue || 9975}
              onChange={(e) => updateField('expectedInvoiceValue', Number(e.target.value) || 0)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold font-mono text-slate-100 focus:border-[#C8A96A] focus:outline-none"
            />
          </div>

          {/* Client Name with inline + New button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400 font-medium">Client Name</label>
              <button
                type="button"
                onClick={() => setInlineNewClientOpen(!inlineNewClientOpen)}
                className="text-[10px] text-[#C8A96A] hover:underline font-bold"
              >
                + New Client
              </button>
            </div>
            <input
              type="text"
              list="master-clients-list"
              value={slip.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              placeholder="Select or type client name..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-slate-100 focus:border-[#C8A96A] focus:outline-none"
            />
          </div>

          {/* Supplier with inline + New button */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] text-slate-400 font-medium">Supplier</label>
              <button
                type="button"
                onClick={() => setInlineNewSupplierOpen(!inlineNewSupplierOpen)}
                className="text-[10px] text-[#C8A96A] hover:underline font-bold"
              >
                + New Supplier
              </button>
            </div>
            <input
              type="text"
              list="master-suppliers-list"
              value={slip.supplier}
              onChange={(e) => updateField('supplier', e.target.value)}
              placeholder="Select or type supplier..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-slate-100 focus:border-[#C8A96A] focus:outline-none"
            />
          </div>

          {/* Project Name */}
          <div className="sm:col-span-2">
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              Project Name &amp; Location
            </label>
            <input
              type="text"
              list="master-projects-list"
              value={slip.projectName}
              onChange={(e) => updateField('projectName', e.target.value)}
              placeholder="Select or type project name..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 font-bold text-slate-100 focus:border-[#C8A96A] focus:outline-none"
            />
          </div>
        </div>

        {/* Inline Add Client Box */}
        {inlineNewClientOpen && (
          <div className="p-2.5 bg-slate-900 border border-[#C8A96A]/40 rounded-lg space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#C8A96A]">
              <span>Add &amp; Select New Client</span>
              <button onClick={() => setInlineNewClientOpen(false)}>✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Client Name..."
                value={inlineClientName}
                onChange={(e) => setInlineClientName(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded p-1.5 text-xs focus:outline-none"
              />
              <input
                type="text"
                placeholder="Project Name..."
                value={inlineProjectName}
                onChange={(e) => setInlineProjectName(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded p-1.5 text-xs focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddInlineClient}
              className="w-full py-1 rounded bg-[#C8A96A] text-slate-950 font-bold text-[11px]"
            >
              Add Client to Masters
            </button>
          </div>
        )}

        {/* Inline Add Supplier Box */}
        {inlineNewSupplierOpen && (
          <div className="p-2.5 bg-slate-900 border border-[#C8A96A]/40 rounded-lg space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#C8A96A]">
              <span>Add &amp; Select New Supplier</span>
              <button onClick={() => setInlineNewSupplierOpen(false)}>✕</button>
            </div>
            <input
              type="text"
              placeholder="Supplier Name..."
              value={inlineSupplierName}
              onChange={(e) => setInlineSupplierName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded p-1.5 text-xs focus:outline-none"
            />
            <button
              type="button"
              onClick={handleAddInlineSupplier}
              className="w-full py-1 rounded bg-[#C8A96A] text-slate-950 font-bold text-[11px]"
            >
              Add Supplier to Masters
            </button>
          </div>
        )}
      </div>

      {/* SECTION 2: MATERIAL DETAILS EDITOR */}
      <div className="space-y-3.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#C8A96A]" />
            2. Material Details Editor
          </span>
          <button
            type="button"
            onClick={addItem}
            className="px-2.5 py-1 bg-[#C8A96A] hover:bg-[#d8bc7d] text-slate-950 font-bold rounded-lg text-[10px] flex items-center gap-1 shadow transition-colors"
          >
            <Plus className="w-3 h-3" />
            <span>Add Row</span>
          </button>
        </div>

        {/* Items Rows */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {slip.items.map((item, idx) => (
            <div
              key={item.id || idx}
              className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-slate-700 space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] text-slate-500 font-bold">#{idx + 1}</span>
                <input
                  type="text"
                  list="master-materials-list"
                  placeholder="Select material from catalog or type..."
                  value={item.description}
                  onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded p-1.5 text-slate-100 font-medium text-xs focus:border-[#C8A96A] focus:outline-none"
                />
                {slip.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                    title="Delete row"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-12 gap-2 text-[11px] items-center">
                <div className="col-span-3">
                  <span className="text-[10px] text-slate-400 block">Qty</span>
                  <input
                    type="number"
                    step="any"
                    value={item.qty}
                    onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 font-mono font-bold text-center text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="col-span-4">
                  <span className="text-[10px] text-slate-400 block">Rate (AED)</span>
                  <input
                    type="number"
                    step="any"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-1 font-mono text-center text-slate-100 focus:outline-none"
                  />
                </div>

                <div className="col-span-5 text-right font-mono font-bold">
                  <span className="text-[10px] text-slate-400 block">Amount</span>
                  <span className="text-slate-200">
                    AED {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Math Summary & Transport Fee */}
        <div className="pt-2 border-t border-slate-800 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span>Subtotal:</span>
            <span className="font-mono font-bold text-slate-200">
              AED {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* VAT Percentage Control */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">VAT Rate (%):</span>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15].map((ratePreset) => {
                  const currentRate = slip.vatRate !== undefined ? slip.vatRate : 5;
                  const isActive = currentRate === ratePreset;
                  return (
                    <button
                      key={ratePreset}
                      type="button"
                      onClick={() => updateField('vatRate', ratePreset)}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-colors ${
                        isActive
                          ? 'bg-amber-500 text-black shadow-sm'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {ratePreset}%
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="any"
                min="0"
                max="100"
                value={slip.vatRate !== undefined ? slip.vatRate : 5}
                onChange={(e) => updateField('vatRate', e.target.value === '' ? 0 : Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-700 rounded p-1 font-mono font-bold text-right text-slate-100 focus:outline-none focus:border-amber-500"
              />
              <span className="text-slate-400 font-mono text-xs">%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-400">
            <span>VAT ({slip.vatRate !== undefined ? slip.vatRate : 5}%):</span>
            <span className="font-mono font-bold text-slate-200">
              AED {vat.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Transport Fee (AED):</span>
            <input
              type="number"
              step="any"
              value={slip.transport}
              onChange={(e) => updateField('transport', Number(e.target.value) || 0)}
              className="w-24 bg-slate-900 border border-slate-700 rounded p-1 font-mono font-bold text-right text-slate-100 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-1.5 border-t border-slate-800 font-bold">
            <span className="text-white uppercase tracking-wider text-xs">Total Payable:</span>
            <span className="font-mono font-black text-sm text-yellow-400">
              AED {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 3: VERIFICATION & MILESTONES (SECTION 5) */}
      <div className="space-y-3.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#C8A96A]" />
            3. Verification &amp; Milestones (Section 5)
          </span>
          <span className="font-mono font-bold text-[#C8A96A]">{slip.currentProgress}% Progress</span>
        </div>

        {/* Progress Slider */}
        <div>
          <input
            type="range"
            min="0"
            max="100"
            value={slip.currentProgress}
            onChange={(e) => updateField('currentProgress', Number(e.target.value) || 0)}
            className="w-full accent-[#C8A96A] cursor-pointer"
          />
        </div>

        {/* 7 Production Stages Toggles */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
            Production Stages:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {[
              { key: 'engineering', label: 'Engineering' },
              { key: 'materialProcurement', label: 'Procurement' },
              { key: 'fabrication', label: 'Fabrication' },
              { key: 'painting', label: 'Painting' },
              { key: 'fabric', label: 'Fabric' },
              { key: 'installation', label: 'Installation' },
              { key: 'dispatch', label: 'Dispatch' },
            ].map((st) => {
              const active = (slip.stages as any)[st.key];
              return (
                <button
                  key={st.key}
                  type="button"
                  onClick={() => updateStage(st.key as any)}
                  className={`py-1 px-2 rounded-lg text-left text-[11px] font-medium transition-colors border ${
                    active
                      ? 'bg-yellow-400 text-slate-950 font-bold border-yellow-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {active ? '✓ ' : '○ '} {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Milestone Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <div>
            <label className="text-[10px] text-slate-400 font-medium block mb-1">
              📅 Material Arrival Date
            </label>
            <div className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-100 text-xs">
              <InlineDatePicker
                value={slip.materialsArrivalDate || ''}
                onChange={(val) => updateField('materialsArrivalDate', val)}
                placeholder="e.g. 28-10-2026"
                className="text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 font-medium block mb-1">
              ⚙ Production Start On
            </label>
            <div className="bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-slate-100 text-xs">
              <InlineDatePicker
                value={slip.productionStartDate || ''}
                onChange={(val) => updateField('productionStartDate', val)}
                placeholder="e.g. n/a or upon delivery"
                className="text-slate-100"
              />
            </div>
          </div>
        </div>

        {/* Expected Benefits */}
        <div>
          <label className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
            Expected Benefits:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {[
              { key: 'productionWillContinue', label: 'Production will continue' },
              { key: 'projectDelayAvoided', label: 'Project delay avoided' },
              { key: 'clientMilestoneAchieved', label: 'Milestone achieved' },
              { key: 'clientPaymentClaimed', label: 'Payment claimed' },
            ].map((ben) => {
              const active = (slip.benefits as any)[ben.key];
              return (
                <button
                  key={ben.key}
                  type="button"
                  onClick={() => updateBenefit(ben.key as any)}
                  className={`py-1 px-2 rounded-lg text-left text-[11px] font-medium transition-colors border ${
                    active
                      ? 'bg-yellow-400 text-slate-950 font-bold border-yellow-400'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {active ? '☑ ' : '☐ '} {ben.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* SECTION 4: APPROVAL & E-SIGNATURES */}
      <div className="space-y-3.5 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C8A96A]" />
            4. Approval &amp; E-Signatures (Section 8)
          </span>
          <span className="text-[10px] text-slate-400">1-Tap Verification</span>
        </div>

        {/* 1-Tap Stamp Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Step 3: Ms. Zoha Khan (Project Coordinator) */}
          <button
            type="button"
            onClick={onToggleZohaStamp}
            className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              zohaVerified
                ? 'bg-emerald-950/70 border-emerald-500 text-emerald-200'
                : 'bg-slate-900 border-slate-700 hover:border-emerald-500 text-slate-300'
            }`}
          >
            <div
              className={`p-1.5 rounded-lg ${
                zohaVerified ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="font-bold text-xs block">
                {zohaVerified ? 'VERIFIED (Ms. Zoha Khan)' : '1-Tap Verify (Ms. Zoha Khan)'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Project Coordinator • Displays Green Seal
              </span>
            </div>
          </button>

          {/* Step 2: Hamza (Project Manager) */}
          <button
            type="button"
            onClick={onToggleHamzaApproval}
            className={`p-2.5 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
              hamzaApproved
                ? 'bg-blue-950/70 border-blue-500 text-blue-200'
                : 'bg-slate-900 border-slate-700 hover:border-blue-500 text-slate-300'
            }`}
          >
            <div
              className={`p-1.5 rounded-lg ${
                hamzaApproved ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <span className="font-bold text-xs block">
                {hamzaApproved ? 'APPROVED (Hamza)' : '1-Tap Approve (Hamza)'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Project Manager Signoff
              </span>
            </div>
          </button>
        </div>

        {/* Roles List Info */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10.5px] pt-1 border-t border-slate-800 text-slate-400">
          <div>
            <span className="text-slate-500 block">Step 1</span>
            <span className="font-medium text-slate-300">Requested: Usman</span>
          </div>
          <div>
            <span className="text-slate-500 block">Step 4</span>
            <span className="font-medium text-slate-300">Accounts: Zain</span>
          </div>
          <div>
            <span className="text-slate-500 block">Step 5</span>
            <span className="font-medium text-slate-300">Final: Sadiya</span>
          </div>
          <div>
            <span className="text-slate-500 block">Step 6</span>
            <span className="font-medium text-slate-300">Released: Javeriya</span>
          </div>
        </div>
      </div>
    </div>
  );
};
